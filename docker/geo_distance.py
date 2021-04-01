import vincenty from geopy.distance

def calculate_distance(coords_1,coords_2):
    coords_1 = (52.2296756, 21.0122287)
    coords_2 = (52.406374, 16.9251681)

    print geopy.distance.vincenty(coords_1, coords_2).km:

def getPosts(user_location,candidate_post,thereshold=0.0005):
    vincenty(user_location,candidate_post)