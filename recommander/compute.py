import numpy as np
import sys
import json


from transformers import pipeline,AutoModelForSequenceClassification, AutoTokenizer

# Read cmdline parameters. We skip error checking in this simplified example.
##it only contain the words that the user liked
input_path = sys.argv[1]
labels_path = sys.argv[2]
models_path = sys.argv[4]
output_path = sys.argv[3]
openfile = open(input_path)
sequence_to_classify=[i for i in openfile.readlines()]
print(sequence_to_classify)
labelfile = open(labels_path).read()
candidate_labels=labelfile.split()
print(candidate_labels)

#candidate_labels = ['technology', 'cooking', 'dancing','blockchain','cosmos','festival','food','traveling']
final_result=np.zeros(len(candidate_labels))
token = models_path + "/tokenizer_config.json"
model = AutoModelForSequenceClassification.from_pretrained(models_path)
tokenizer = AutoTokenizer.from_pretrained(models_path)

#import model
classifier = pipeline("zero-shot-classification",model=model,tokenizer=tokenizer)

#compute every sentence
#classifier = pipeline("zero-shot-classification",
#model="facebook/bart-large-mnli")
for sentence in sequence_to_classify:
    #hardcoded for something
    result = classifier(sentence, candidate_labels)
    final_result=np.add(final_result,result['scores'])

#output the first element that the user most interested
max_iter = np.argmax(result['scores'])
print(candidate_labels[max_iter])
with open(output_path, 'w') as f:
    f.write(f"You are interest in {candidate_labels[max_iter]}!\n")

