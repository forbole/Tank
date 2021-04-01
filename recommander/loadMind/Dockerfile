FROM python:3.8

RUN mkdir /predict
WORKDIR /predict

ADD https://mind201910small.blob.core.windows.net/release/MINDsmall_train.zip MINDsmall_train.zip 
ADD https://mind201910small.blob.core.windows.net/release/MINDsmall_dev.zip MINDsmall_dev.zip 

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY loadMind.py .