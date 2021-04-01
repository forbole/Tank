FROM python:3.8

# Prepare work directory.
RUN mkdir /predict
WORKDIR /predict

# copy the dependencies file to the working directory
COPY requirements.txt .
# install dependencies
RUN pip install -r requirements.txt

# Add our python script.
COPY extraction.py .
COPY config.json .