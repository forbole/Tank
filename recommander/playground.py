from rake_nltk import Rake
import requests
import json
import sys
import glob
import os
import math_distance

input_dir = sys.argv[1]
output_path = sys.argv[2]
config_path = "config.json"
sequence_to_classify=[]
for filename in glob.glob(input_dir+'*.txt'):
    with open(filename, 'r') as f: # open in readonly mode
       sequence_to_classify.append(f.read()) 

print(sequence_to_classify)
r = Rake()
recommendation_json=[]
outputJson={"status":"Great"}
# Get Config
'''
config.json
{
    "keywords":{
        "degree_depth":3
        "jaccard_simularity_thereshold":0.5
    },
    "general":{
        "chain":"http://lcd.morpheus.desmos.network:1317/posts",
        "num_of_posts":10
    }
}

output.json
{
    "status":"Great",
    "result":[]
}
'''

with open(config_path) as json_file:
    config = json.load(json_file)

DEGREE_DEPTH=config['keywords']['degree_depth']
NUM_POSTS=config['general']['num_of_posts']
CHAIN=config['general']['chain']
JACCARD=config['keywords']['jaccard_simularity_thereshold']

# Get list of candidate posts from 139.162.108.149:1415/posts (chain)
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

#Play here


with open(output_path, 'w+') as outfile:
    outputJson={
        "status":200,
        "result":recommendation_json
    }

    json.dump(outputJson, outfile)