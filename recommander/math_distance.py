from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import euclidean_distances
from sklearn.preprocessing import normalize
import numpy as np
from sentence_transformers import SentenceTransformer,util


model = SentenceTransformer('paraphrase-distilroberta-base-v1')
# https://link.springer.com/chapter/10.1007/978-981-13-1280-9_9#Fig3

def getPosts(user_interest_posts,candidate_post,thereshold=0.5):
    #[[1,2][3,4][][][][]]
    #user_vectors=getVectorForPost(user_interest_posts) 
    user_vectors=model.encode(user_interest_posts)

    #[[1,2][3,4][][][][]]
    candidate_message=[post['message']for post in candidate_post]
    candidate_vectors=model.encode(candidate_message)
    #candidate_vectors=getVectorForPost(candidate_message) 
    #[[]
    user_vectors=normalize(user_vectors)
    candidate_vectors=normalize(candidate_vectors)

    a=euclidean_distances(user_vectors,candidate_vectors)
    print(f"euclidean_distances:{a}")
    position=np.argwhere(abs(a)<thereshold)
    print(position)
    position=np.unique(position[:,1])
    selected=[candidate_post[i] for i in position]
    print(selected)
    return selected
    
def itemitem(user_interest_posts,candidate_post,thereshold=0.5):
    user_vectors=model.encode(user_interest_posts)
    candidate_message=[post['message']for post in candidate_post]
    candidate_vectors=model.encode(candidate_message)
    #for each user vector find its optimal cosine distance vector by decending order
    search=util.semantic_search(user_vectors,candidate_vectors)
    sentence=[candidate_message[n['corpus_id']]for i in search for n in i if n['score']>thereshold]
    return list(set(sentence))
