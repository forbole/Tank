import express from "express";

import * as action from './action'
var app = express()
import fs from 'fs'

// logging
const uploadLog = './log/upload.csv'
const downloadLog = './log/downlod.csv'
const computeLog = './log/compute.csv'

function checkLogFileExist(path,header) {
  fs.access(path, error => {
    if (!error) {
      // The check succeeded
      console.log(path+"exist")
    } else {
      // The check failed
      fs.writeFile(path, header,{ flag: 'a+' }, function (err) {
        if (err) {
          console.log("Cannot write file!")
        }
      })
    }
  });
}

checkLogFileExist(uploadLog, "Upload \n")
checkLogFileExist(downloadLog, "Download \n")
checkLogFileExist(computeLog, "Upload,Compute,Total \n")



//json stuff
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(50051, () => {
 console.log("Server running on port 50051");
});

app.get("/url", (req, res, next) => {
  res.json(["Tony","Lisa","Michael","Ginger","Food"]);
 });

 /* {
   identity:"....."
 }
  */
//getRecommendation
app.post('/recommand', (req, res) => {
  action.compute(req.body.identity)
    .then(result => {
      return res.send(
        {
          status:200,
          result: result
        }
      );
    })
    .catch(err => {
      return res.send(
        {
          status:err,
          result: ""
        }
      );
    })
});

//getRecommendation
app.get('/train-collaborative', (req, res) => {
  action.buildCollaborativeModel()
    .then(result => {
      //console.log("res", res)
      return res.send(
        {
          status:200,
          result: result
        }
      );
    })
    .catch(err => {
      return res.send(
        {
          status:err,
          result: ""
        }
      );
    })
});

//upload
app.post('/upload', (req, res) => {
  console.log("Endpoint /upload is hit!")
  console.log("Identity=" + req.body.identity)
  console.log("Parsephase="+req.body.parsephase)
  action.uploads(req.body.identity,req.body.parsephase)
    .then(result => {
      return res.send(
        {
          status:200,
          result: result
        }
      );
    })
    .catch(err => {
      return res.send(
        {
          status:500,
          result: err
        }
      );
    })
});

app.post('/get_collaborative_result', (req, res) => {
  action.getUserData(req.body.identity,req.body.type)
    .then(r => {
      //console.log("res", res)
      return res.send(
        {
          status:200,
          result: r
        }
      );
    })
    .catch(err => {
      return res.send(
        {
          status:err,
          result: ""
        }
      );
    })
});

