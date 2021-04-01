import React, { Component } from 'react'
import Post from "./Post/Post"
import jwt_decode from "jwt-decode";
import Oidc from 'oidc-client'
import config from '../../Container/MainPage/config.js'



export default class Posts extends Component {
    state={
        posts:[],
        userid:"",
        location:null
    }

    
    async componentDidMount(){
        const website="http://gentle-mountain-40311.herokuapp.com/http://lcd.morpheus.desmos.network:1317/posts"
        //let website="http://localhost:1317/posts?sort_by=created&sort_order=descending"
        //website="http://gentle-mountain-40311.herokuapp.com/"+website
        fetch(website)
        .then(res => res.json())
        .then((data) => {
            const d=data.result.slice(95).map((res)=>{
                return {
                    ...res,
                    key:res.post_id
                }
            })
            this.setState({ posts: d })
          })
        .catch((err)=>console.log(err))


        Oidc.Log.logger = console;
        Oidc.Log.level = Oidc.Log.DEBUG;
        const oidcClient = new Oidc.OidcClient(config);
        let userid=""
            try {
              const response = await oidcClient.processSigninResponse(window.location.href);
              const IDToken = response.id_token;
              const decoded = jwt_decode(IDToken);
              const address = decoded.sub;
              console.log(`ID token:\n${JSON.stringify(decoded, null, '')}`);
              userid = `${address}`;
              this.setState({userid:userid})
              /* document.getElementById('grant-access-oasis').addEventListener('click', function () {
                location.assign(grantUrl(address));
              }); */
            } catch (error) {
              console.log(error);
            }

           const getlocation=(loc)=>{
            this.setState({location:loc});
           }

            if ("geolocation" in navigator) {
                  console.log("Available");
                  navigator.geolocation.getCurrentPosition((position)=> {
                    getlocation(position.coords);
                  });
            } else {
                  console.log("Not Available");
            }
            
            
    }

    
    LikeButtonHandler = (message)=>{
        const time=new Date()
        const now=time.toISOString()
        console.log(this.state.location)
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
              },
            body: JSON.stringify({
                identity:this.state.userid,
                parsephase: {
                    payload:{'source':'desmos/post',
                            'message':message},
                    timestamp:now,
                    latitude:this.state.location===null ? null : this.state.location.latitude,
                    longitude:this.state.location===null ? null : this.state.location.longitude,
                }
            }),
        };

        console.log(requestOptions.body)
    
        fetch('http://localhost:50051/upload', requestOptions)
        .then(response => response.json())
        .then(res=>{
            console.log(res)
            //append the states
        })
        .catch(err=>{console.log("oops",err)})
    }

    CommentButtonHandler=(message)=>{
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
              },
            body: JSON.stringify({
                identity:this.state.userid,
                parsephase:message
            }),
        };
    
        fetch('http://localhost:50051/upload', requestOptions)
        .then(response => response.json())
        .then(res=>{
            console.log(res)
            //append the states
        })
        .catch(err=>{console.log("oops",err)})
    }

    RecommandButtonHandler=()=>{
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
              },
            body: JSON.stringify({
                identity:this.state.userid
            }),
        };
    
        fetch('http://localhost:50051/recommand', requestOptions)
        .then(response => response.json())
        .then(res=>{
            console.log(res)
            //append the states
            const newPosts=res["result"]["result"]
            const d=newPosts.map((res)=>{
                return {
                    ...res,
                    key:res.post_id
                }
            })
            this.setState({
                posts:[...this.state.posts,...d]
            })
        })
        .catch(err=>{console.log("oops",err)})
    }
    render() {
        console.log(this.state)
        const posts=this.state.posts.map((post)=><Post post={post} key={post.key} likeButton={this.LikeButtonHandler} commentButton={this.CommentButtonHandler}/>)
        return (
            <div>
                {posts}
                <p className="Button">You are login as {this.state.userid}</p>
                <button className="Button" onClick={this.RecommandButtonHandler}>Get More News base on Your Interest!</button>
            </div>
        )
    }
}

