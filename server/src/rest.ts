import express from "express";
import dotenv from 'dotenv'
dotenv.config()
import * as action from './action'
var app = express()

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
          status:err,
          result: ""
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
