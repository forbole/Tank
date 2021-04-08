import pandas as pd
import json
import subprocess
import time
import os
import pickle
import secrets
from tqdm import tqdm
from subprocess import check_output
import shutil
import zipfile
import wget
import sys
import argparse

#1.Add post to chain
#2.Add user that interested to the the data to ./test_workdir/data/in
indir = "./test_workdir/data/in"
MINDsmall_train="https://mind201910small.blob.core.windows.net/release/MINDsmall_train.zip"
MINDsmall_dev="https://mind201910small.blob.core.windows.net/release/MINDsmall_dev.zip"
#wget.download(MINDsmall_train, bar=bar_progress)
def bar_progress(current, total, width=80):
    progress_message = "Downloading: %d%% [%d / %d] bytes" % (current / total * 100, current, total)
  # Don't use print() as it will print in new line every time.
    sys.stdout.write("\r" + progress_message)
    sys.stdout.flush()

def unzip(name):
    if not os.path.isfile(f"{name}.zip"):
        wget.download(f"https://mind201910small.blob.core.windows.net/release/{name}.zip",f"{name}.zip")
        os.mkdir(f"./{name}")
    with zipfile.ZipFile(f"{name}.zip", 'r') as zip_ref:
            zip_ref.extractall(f"./{name}")

    news=pd.read_csv(f"./{name}/news.tsv",sep='\t',names=["newsID","Category","SubCategory","Title","Abstract","URL","Title_Entities","Abstract_Entites"])
    behaviors=pd.read_csv(f"./{name}/behaviors.tsv",sep='\t',names=["impression_ID","user_ID","Time","History","Impressions"])
    print(f"{news.shape[0]} posts will be spam on chain with {name}")
    print(f"{behaviors.shape[0]} users behaviour entry will be spam to output with {name}")
    return news, behaviors

def build_object_from_message(result,s):
    post_id=result['logs'][0]['events'][1]['attributes'][0]['value']
    creation_time=result['logs'][0]['events'][1]['attributes'][2]['value']
    owner=result['logs'][0]['events'][1]['attributes'][3]['value']
    return {"payload":{
    "source":"desmos/post",
    "message":{"post_id":post_id,
    "parent_id":"",
    "message":s,
    "created":creation_time,
    "last_edited":"0001-01-01T00:00:00Z",
    "allows_comments":True,
    "subspace":"4e188d9c17150037d5194bbdb91ae1eb2a78a15aca04cb35530cccb81494b36e",
    "creator":owner,
    "attachments":"","reactions":[],
    "children":[],
    "key":post_id}},
    "timestamp":"2021-03-29T07:24:59.675Z",
    "latitude":22.25,
    "longitude":114.1667
  }

#build a dictionary of new post id and old post id
def spam_posts(news,dataset_name,start_ind=0,save_batch=1,test=True):
    pickledir=getPickleDir(dataset_name)
    pickleComplete=getPickleComplete(dataset_name)
    newsmap={}
    if test==True:
        news=news.head()
    iterRows=news[start_ind:]
    totalRow=iterRows.shape[0]
    for index, n in tqdm(iterRows.iterrows(),total=totalRow):
        if index%save_batch==0 and index: # implenment save function...
            with open(f"{pickledir}/{index}.pickle", 'wb') as handle:
                pickle.dump(newsmap, handle, protocol=pickle.HIGHEST_PROTOCOL)
            newsmap={}
        try:
            s=n["Abstract"]
            if not isinstance(s, str):
                continue
            if len(s)==0:
                continue
            s=s.replace('"','\\"')
            s=s.replace('\'',"\\'")
            if len(s)>500:
                s=s[:500]
            p=subprocess.Popen(f"desmos tx posts create 4e188d9c17150037d5199bbdb91ae1eb2a78a15aca04cb35530cccb81494b36e \"{s}\" --chain-id testchain -y --from jack --keyring-backend=test",shell=True,stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            p.wait(10)
            stdout, stderr = p.communicate()
            out = stdout.decode('utf-8')
            result=json.loads(out)
            newsmap[n["newsID"]]=build_object_from_message(result,s)
        except Exception as e:
            print(f"Expection:{e}\nMessage:{s}")
            continue
    return merge_saved_dictionary_and_delete_old(dataset_name,newsmap)

def merge_saved_dictionary_and_delete_old(dataset_name,lastnewsmap):
    pickledir=getPickleDir(dataset_name)
    pickleComplete=getPickleComplete(dataset_name)
    newsmap={}
    for (dirpath, dirnames, filenames) in tqdm(os.walk(pickledir)):
        for names in filenames:
            with open(f"{dirpath}/{names}",'rb') as f:
                smallnewsmap = pickle.load(f)
                newsmap = {**newsmap, **smallnewsmap}
    newsmap = {**newsmap, **lastnewsmap}
    print(newsmap)
    with open(pickleComplete, 'wb') as handle:
        pickle.dump(newsmap, handle, protocol=pickle.HIGHEST_PROTOCOL)
    print(pickledir)
    shutil.rmtree(pickledir)
    return newsmap

def getPickleDir(dataset_name):
    return (f"./{dataset_name}_newsmap")

def getPickleComplete(dataset_name):
    return (f"./{dataset_name}_complete.pickle")

def spam_merge_post(news,dataset_name):
    newsmap={}
    pickledir=getPickleDir(dataset_name)
    pickleComplete=getPickleComplete(dataset_name)
    if os.path.isfile(pickleComplete):
        print(f"{pickleComplete} exist, reading...")
        with open(pickleComplete,'rb') as f:
            newsmap = pickle.load(f)
    else:
        if os.path.isdir(pickledir):
            #halfway though it
            print(f"{pickledir} exist and it process exited previously, consume...")

            f=[]
            for (dirpath, dirnames, filenames) in  tqdm(os.walk(pickledir)):
                f.extend(filenames)
            if len(f)==0:
                newsmap = spam_posts(news,dataset_name)
            else:
                maximumf=max([int(i.replace('.pickle','')) for i in f])
                newsmap = spam_posts(news,dataset_name,maximumf)
        else:
            print(f"{pickledir} not exist,making new one")
            os.mkdir(pickledir)
            newsmap = spam_posts(news,dataset_name)
    return newsmap

def spam_users(behaviors,newsmap):
    for index, u in tqdm(behaviors.iterrows(),total=behaviors.shape[0]):
        userid=u["user_ID"]
        directory=(f"./{indir}/{userid}")
        try:
            if not os.path.isdir(directory):
                os.mkdir(directory)
            if not isinstance(u["History"], str):
                continue
            if len(u["History"])==0:
                continue
            for post in u["History"].split():
                f=(f"{directory}/{secrets.token_hex(15)}.json")
                if post in newsmap:
                    d=newsmap[post]
                    with open(f, 'w+') as outfile:
                        json.dump(d,outfile, indent=4, sort_keys=True)
        except Exception as e:
            print(f"Expection:{e}\nMessage:{userid}")
            continue

def full_spam(name):
    news,behavior=unzip(name)
    newsmap=spam_merge_post(news,name)
    spam_users(behavior,newsmap)
    print(f"finish spamming {name}")

full_spam("MINDsmall_train")
full_spam("MINDsmall_dev")

print("finish!")