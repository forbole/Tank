import requests
import json
import sys
import glob
import os
#import math_distance
#from sentence_transformers import SentenceTransformer,util
import tensorflow as tf
import numpy as np
import pickle
import pandas as pd
import sys
sys.path.append("../../")
import os
import papermill as pm
import keras

from reco_utils.common.timer import Timer
from reco_utils.dataset import movielens
from reco_utils.dataset.split_utils import min_rating_filter_pandas
from reco_utils.dataset.python_splitters import numpy_stratified_split
from reco_utils.evaluation.python_evaluation import map_at_k, ndcg_at_k, precision_at_k, recall_at_k

from reco_utils.dataset.sparse import AffinityMatrix
from reco_utils.common.python_utils import binarize
from reco_utils.recommender.vae.standard_vae import StandardVAE

from tempfile import TemporaryDirectory

import json

#https://github.com/microsoft/recommenders/blob/main/examples/02_model_collaborative_filtering/standard_vae_deep_dive.ipynb
print("System version: {}".format(sys.version))
print("Pandas version: {}".format(pd.__version__))
print("Tensorflow version: {}".format(tf.__version__))
print("Keras version: {}".format(keras.__version__))

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
#{"userID":,"itemID","rating":1,"timestamp":"lag":,"log"}
def walk_through_files(path, file_extension='.json'):
    post={"userID":[],"itemID":[],"rating":[]}
    for (dirpath, dirnames, filenames) in os.walk(path):
        dirname=os.path.basename(os.path.normpath(dirpath))
        for filename in filenames:
            f=open(f"{dirpath}/{filename}")
            if filename.endswith(file_extension): 
                if post=={}:
                    j=json.load(f)
                    post["userID"]=[dirname]
                    post["itemID"]=[j['payload']['message']['post_id']]
                    post["rating"]=[1]
                else:
                    j=json.load(f)
                    post["userID"].append(dirname)
                    post["itemID"].append(j['payload']['message']['post_id'])
                    post["rating"].append(1)
    
    return pd.DataFrame(post)

#/parcel/data/in/<username>/<userhistory>.json
input_dir = "/parcel/data/in/"
#/parcel/data/out/output.json
output_path = "/parcel/data/out/"
config_path = "config.json"
df=walk_through_files(input_dir)
print(df)

recommendation_json=[]
outputJson={"status":"Great"}

with open(config_path) as json_file:
    config = json.load(json_file)

DEGREE_DEPTH=config['keywords']['degree_depth']
NUM_POSTS=config['general']['num_of_posts']
CHAIN=config['general']['chain']
JACCARD=config['keywords']['jaccard_simularity_thereshold']

# top k items to recommend
TOP_K = NUM_POSTS

# Select MovieLens data size: 100k, 1m, 10m, or 20m
MOVIELENS_DATA_SIZE = '1m'

# Model parameters
HELDOUT_USERS = config['learning']["HELDOUT_USERS"] # CHANGE FOR DIFFERENT DATASIZE
INTERMEDIATE_DIM = config['learning']["INTERMEDIATE_DIM"]
LATENT_DIM = config['learning']["LATENT_DIM"]
EPOCHS = config['learning']["EPOCHS"]
BATCH_SIZE = config['learning']["BATCH_SIZE"]

# temporary Path to save the optimal model's weights
tmp_dir = "/parcel/data/out/"
WEIGHTS_PATH = os.path.join(tmp_dir, "mvae_weights.hdf5")

SEED = 98765


# Obtain both usercount and itemcount after filtering
usercount = df[['userID']].groupby('userID', as_index = False).size()
itemcount = df[['itemID']].groupby('itemID', as_index = False).size()

# Compute sparsity after filtering
sparsity = 1. * df.shape[0] / (usercount.shape[0] * itemcount.shape[0])

print("After filtering, there are %d watching events from %d users and %d movies (sparsity: %.3f%%)" % 
      (df.shape[0], usercount.shape[0], itemcount.shape[0], sparsity * 100))

unique_users = sorted(df.userID.unique())
np.random.seed(SEED)
unique_users = np.random.permutation(unique_users)

n_users = len(unique_users)
print("Number of unique users:", n_users)

train_users = unique_users[:(n_users - HELDOUT_USERS * 2)]
print("\nNumber of training users:", len(train_users))

val_users = unique_users[(n_users - HELDOUT_USERS * 2) : (n_users - HELDOUT_USERS)]
print("\nNumber of validation users:", len(val_users))

test_users = unique_users[(n_users - HELDOUT_USERS):]
print("\nNumber of test users:", len(test_users))

train_set = df.loc[df['userID'].isin(train_users)]
print("Number of training observations: ", train_set.shape[0])

# For validation set keep only users that are in val_users list
val_set = df.loc[df['userID'].isin(val_users)]
print("\nNumber of validation observations: ", val_set.shape[0])

# For test set keep only users that are in test_users list
test_set = df.loc[df['userID'].isin(test_users)]
print("\nNumber of test observations: ", test_set.shape[0])

# train_set/val_set/test_set contain user - movie interactions with rating 4 or 5
unique_train_items = pd.unique(train_set['itemID'])
print("Number of unique movies that rated in training set", unique_train_items.size)


# For validation set keep only movies that used in training set
val_set = val_set.loc[val_set['itemID'].isin(unique_train_items)]
print("Number of validation observations after filtering: ", val_set.shape[0])

# For test set keep only movies that used in training set
test_set = test_set.loc[test_set['itemID'].isin(unique_train_items)]
print("\nNumber of test observations after filtering: ", test_set.shape[0])

am_train = AffinityMatrix(DF=train_set, items_list=unique_train_items)

am_val = AffinityMatrix(DF=val_set, items_list=unique_train_items)

am_test = AffinityMatrix(DF=test_set, items_list=unique_train_items)

train_data, _, _ = am_train.gen_affinity_matrix()
print(train_data.shape)

val_data, val_map_users, val_map_items = am_val.gen_affinity_matrix()
print(val_data.shape)

test_data, test_map_users, test_map_items = am_test.gen_affinity_matrix()
print(test_data.shape)

val_data_tr, val_data_te = numpy_stratified_split(val_data, ratio=0.75, seed=SEED)
test_data_tr, test_data_te = numpy_stratified_split(test_data, ratio=0.75, seed=SEED)


# Binarize train, validation and test data
train_data = binarize(a=train_data, threshold=3.5)
val_data = binarize(a=val_data, threshold=3.5)
test_data = binarize(a=test_data, threshold=3.5)


# Binarize validation data: training part  
val_data_tr = binarize(a=val_data_tr, threshold=3.5)

# Binarize validation data: testing part (save non-binary version in the separate object, will be used for calculating NDCG)
val_data_te_ratings = val_data_te.copy()
val_data_te = binarize(a=val_data_te, threshold=3.5)

# Binarize test data: training part 
test_data_tr = binarize(a=test_data_tr, threshold=3.5)

# Binarize test data: testing part (save non-binary version in the separate object, will be used for calculating NDCG)
test_data_te_ratings = test_data_te.copy()
test_data_te = binarize(a=test_data_te, threshold=3.5)


test_data_te_ratings=pd.DataFrame(test_data_te_ratings)
val_data_te_ratings=pd.DataFrame(val_data_te_ratings)

# Binarize the data (only keep ratings >= 4)
df_preferred = df[df['rating'] > 0]
print (df_preferred.shape)
df_low_rating = df[df['rating'] <= 1]


# df.head()
df_preferred.head(10)

for index,i in df_low_rating.iterrows():
  user_old= i['userID'] # old value 
  item_old=i['itemID'] # old value 

  if (test_map_users.get(user_old) is not None)  and (test_map_items.get(item_old) is not None) :
      user_new=test_map_users.get(user_old) # new value 
      item_new=test_map_items.get(item_old) # new value 
      rating=i['rating'] 
      test_data_te_ratings.at[user_new,item_new]= rating   

  if (val_map_users.get(user_old) is not None)  and (val_map_items.get(item_old) is not None) :
      user_new=val_map_users.get(user_old) # new value 
      item_new=val_map_items.get(item_old) # new value 
      rating=i['rating'] 
      val_data_te_ratings.at[user_new,item_new]= rating   


val_data_te_ratings=val_data_te_ratings.to_numpy()    
test_data_te_ratings=test_data_te_ratings.to_numpy()    
# test_data_te_ratings

# Get optimal beta 
model_with_anneal = StandardVAE(n_users=train_data.shape[0], # Number of unique users in the training set
                                original_dim=train_data.shape[1], # Number of unique items in the training set
                                intermediate_dim=INTERMEDIATE_DIM, 
                                latent_dim=LATENT_DIM, 
                                n_epochs=EPOCHS, 
                                batch_size=BATCH_SIZE, 
                                k=TOP_K,
                                verbose=0,
                                seed=SEED,
                                save_path=WEIGHTS_PATH,
                                drop_encoder=0.5,
                                drop_decoder=0.5,
                                annealing=True,
                                anneal_cap=1.0
                                )


with Timer() as t:
    model_with_anneal.fit(x_train=train_data, 
                          x_valid=val_data, 
                          x_val_tr=val_data_tr, 
                          x_val_te=val_data_te_ratings, #  with the original ratings
                          mapper=am_val
                          )
print("Took {} seconds for training.".format(t))

ndcg_val_with_anneal = model_with_anneal.ndcg_per_epoch()
optimal_beta = model_with_anneal.get_optimal_beta()
print( "The optimal beta is: ", optimal_beta)
model_optimal_beta = StandardVAE(n_users=train_data.shape[0], # Number of unique users in the training set
                              original_dim=train_data.shape[1], # Number of unique items in the training set
                              intermediate_dim=INTERMEDIATE_DIM,
                              latent_dim=LATENT_DIM,
                              n_epochs=EPOCHS,
                              batch_size=BATCH_SIZE,
                              k=TOP_K,
                              verbose=0,
                              seed=SEED,
                              save_path=WEIGHTS_PATH,
                              drop_encoder=0.5,
                              drop_decoder=0.5,
                              annealing=True,
                              anneal_cap=optimal_beta,  
                              )

with Timer() as t:
    model_optimal_beta.fit(x_train=train_data, 
                           x_valid=val_data, 
                           x_val_tr=val_data_tr, 
                           x_val_te=val_data_te_ratings, 
                           mapper=am_val
                           )
    
print("Took {} seconds for training.".format(t))



# Predict recommendation
# Use k = 10
with Timer() as t:
    # Model prediction on the training part of test set 
    top_k =  model_optimal_beta.recommend_k_items(x=test_data_tr,
                                                  k=1
                                                  )

    # Convert sparse matrix back to df
    top_k_df = am_test.map_back_sparse(top_k, kind='prediction')
    test_df = am_test.map_back_sparse(test_data_te_ratings, kind='ratings') # use test_data_te_, with the original ratings

print(top_k)
print(top_k_df)# return the top k item for each user and the user-item pair
print(test_df)# return the record that the user is good for reaction.
print("Took {} seconds for prediction.".format(t))

# take item from user id
# when user require for recommendation, just take the answer...
for user in top_k_df["userID"].unique():
    items=top_k_df[top_k_df["userID"] == user]
    out=(f"{output_path}/{user}.json")
    result=[]
    for item in items["itemID"]:
        response = requests.get(f"{CHAIN}/posts/{item}")
        if response.status_code !=200:
            print("oops")
        result.append(response.json()['result'])

    with open(out, 'w+') as outfile:
        outputJson={
            "status":200,
            "result":result
        }
        json.dump(outputJson, outfile)

exit()
# Use the ranking metrics for evaluation
eval_map_3 = map_at_k(test_df, top_k_df, col_prediction='prediction', k=10)
eval_ndcg_3 = ndcg_at_k(test_df, top_k_df, col_prediction='prediction', k=10)
eval_precision_3 = precision_at_k(test_df, top_k_df, col_prediction='prediction', k=10)
eval_recall_3 = recall_at_k(test_df, top_k_df, col_prediction='prediction', k=10)

print("MAP@10:\t\t%f" % eval_map_3,
      "NDCG@10:\t%f" % eval_ndcg_3,
      "Precision@10:\t%f" % eval_precision_3,
      "Recall@10: \t%f" % eval_recall_3, sep='\n')