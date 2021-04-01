/**
 * MUST include "type":"module" in package.json
 */

import protoLoader from '@grpc/proto-loader';
import grpc from 'grpc';
import async from 'async';
import grpc_promise from 'grpc-promise' ;;

var PROTO_PATH = "/Users/apple/Forbole/FYP/server/src/recommend.proto"
//define server to be connected

var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var routeguide = grpc.loadPackageDefinition(packageDefinition).routeguide;
var client = new routeguide.RouteGuide('localhost:50051',
                                       grpc.credentials.createInsecure());

function TestGetRecommended(callback) {
    var parsephase = {
        parsePhase: "This is a test!",
        identity: "0xddbe5ae7e8bf58f24f8253fe9d3473392c61a8f1"
    }


    var returnStr=""
    function getRecommendCallback(err,words){
        if (err){
            console.log(err)
            callback(err)
            return
        }
        console.log("from client!")
        console.log(words.word)
    }

    
    
}

function TestSaveData(callback) {


    var returnStr=""
    function TestSaveDataCallback(err,words){
        if (err){
            callback(error)
            return
        }
        console.log(words.msg)
    }

    client.SaveData(parsephase,getRecommendCallback)
    call.end();
}

function main() {
    grpc_promise.promisifyAll(client);

    var userInfo = {
        identity: "0xddbe5ae7e8bf58f24f8253fe9d3473392c61a8f1"
    }

    var parsephase = {
        parsePhase: "Blockchain Blockchain",
        identity: "0xddbe5ae7e8bf58f24f8253fe9d3473392c61a8f1"
    }

    client.SaveData()
    .sendMessage(parsephase)
    .then(res=>{
        console.log(res)
    }).catch(
        err =>console.log(err)
    )

    client.GetRecommended()
    .sendMessage(userInfo)
    .then(res=>{
        console.log("res")
        console.log(res)})
    .catch(err=>console.log(err));
  }
  
main()