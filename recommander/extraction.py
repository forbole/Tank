print("importing...")
from rake_nltk import Rake
import requests
import json
import sys
import glob
import os
#import math_distance

input_dir = sys.argv[1]
#/parcel/data/out/output.json
output_path = sys.argv[2]
config_path = "config.json"

class map_to_lower:
    def __init__(self):
        self.matrix_lookup={}
    def map_to_lower(self,load):
        #append to max length
        if self.matrix_lookup.get(load)==None:
            self.matrix_lookup[load]=len(self.matrix_lookup.keys())
        return self.matrix_lookup[load]

user_embed_lookup=map_to_lower()
print(user_embed_lookup.map_to_lower("0x1231231"))

def walk_through_files(path, file_extension='.txt',only_one=""):
    post={}
    try:
        for (dirpath, dirnames, filenames) in os.walk(path):
            dirname=os.path.basename(os.path.normpath(dirpath))
            for filename in filenames:
                f=open(f"{dirpath}/{filename}")
                if filename.endswith(file_extension): 
                    if post.get(dirname)==None:
                        p=json.load(f)
                        post[dirname]=[p]
                    else:
                        file=json.load(f)
                        post[dirname].append(file)
                f.close()
    except FileNotFoundError:
        outputJson={"status":"FileNotFoundError"}
        with open(output_path, 'w+') as outfile:
            json.dump(outputJson, outfile)
        exit()

  # 路徑為目錄的例外處理
    except IsADirectoryError:
        outputJson={"status":"IsADirectoryError"}
        with open(output_path, 'w+') as outfile:
            json.dump(outputJson, outfile)
        exit()

    return post

#/parcel/data/in/<username>/<userhistory>.json

print("walking...")
user_posts=walk_through_files(input_dir)
sequence_to_classify=[post['payload']['message']['message']  for user in user_posts.keys() for post in user_posts[user] ]
outputJson={"status":"Great"}
print(set(sequence_to_classify))

with open(config_path) as json_file:
    config = json.load(json_file)
r = Rake()
outputJson={"status":"Great"}
recommendation_json=[]
# Get Config
'''
config.json
{
    "keywords":{
        "enable":bool,
        "degree_depth":int,
        "jaccard_simularity_thereshold":int
    },
    "math_distance":{
        "enable":bool,
        "thereshold:int
    },
    "location":{
        "enable":bool,
        "diameter":5
    },
    "date":{
        "enable":bool,
    }
    "general":{
        "chain":url,
        "num_of_posts":int
    }
}

output.json
{
    "status":"Great",
    "result":[]
}

inputs.json
{
    "message":"..."
    "date":10/10...
    "location":{
        "Latitude":
        "Longitude":
    }
}
'''

with open(config_path) as json_file:
    config = json.load(json_file)

DEGREE_DEPTH=config['keywords']['degree_depth']
NUM_POSTS=config['general']['num_of_posts']
CHAIN=config['general']['chain']
JACCARD=config['keywords']['jaccard_simularity_thereshold']

# Get list of candidate posts from localhost:1415/posts (chain)
response = requests.get(CHAIN)
if response.status_code !=200:
    print("oops")
    with open(output_path, 'w+') as outfile:
        outputJson['status']=response.status_code
        json.dump(outputJson, outfile)
        exit()

post_candidates=response.json()['result']

#cold start
if not sequence_to_classify:
    with open(output_path, 'w+') as outfile:
        outputJson={
            "status":200,
            "result":post_candidates[:NUM_POSTS]
        }
        json.dump(outputJson, outfile)
        exit()

# extract the keywords from interacted posts
r.extract_keywords_from_sentences(sequence_to_classify)
    # To get keyword phrases ranked highest to lowest.
words_degree=r.get_word_degrees()

# to reduce the keywords to a simpler phase
word_keys=list(words_degree.keys())
word_value=list(words_degree.values())
max_edges=max(word_value)
keywords=[ i for i in words_degree if words_degree[i] in range(max_edges-DEGREE_DEPTH,max_edges+1)]

# Context based filtering
def inlist(post_keyphases,keywords):
    for post_keyphase in post_keyphases:
        for k in keywords:
            if k in post_keyphase:
                return True
    return False

# Jaccard simularity
def jaccard_similarity(list1, list2):
    intersection = len(list(set(list1).intersection(list2)))
    union = (len(set(list1)) + len(set(list2))) - intersection
    if  ((float(intersection) / float(union)) > JACCARD):
        return True
    return False

if False:
    for post in post_candidates:
        if len(recommendation_json)>=NUM_POSTS-1:
            break

        text=post['message']
        r.extract_keywords_from_text(text)
        post_keyphases=r.get_ranked_phrases()
        if inlist(post_keyphases,keywords):
            recommendation_json.append(post)

        if jaccard_similarity(post_keyphases,keywords):
            recommendation_json.append(post)

#math_distance


# fill the recommendation if the recommendation is not enough
for post in post_candidates:
    if len(recommendation_json)>=NUM_POSTS-1:
        break
    if post in recommendation_json:
        continue
    recommendation_json.append(post)

with open(output_path, 'w+') as outfile:
    outputJson={
        "status":200,
        "result":recommendation_json
    }

    json.dump(outputJson, outfile)