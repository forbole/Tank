import React, { Component } from 'react'
import Reaction from './Reaction/Reaction'
import './Post.css'
export default class Post extends Component {
    render() {
        let key=0
        const uniqueKey = ()=>{
            key =key+1
            return key
        }
        let reactions =null
        if (this.props.post.reactions.length !==0){
        reactions=this.props.post.reactions.map((reaction)=>            
            <Reaction className="Reaction" value={reaction.value}
            owner={reaction.owner} key={reaction.owner+uniqueKey()}/>
        )
        }
        
        return (
            <div className="Post">
                <p className="Author">{this.props.post.creator}</p>
                <p>{this.props.post.message}</p>
                <div className='flex-container'>{reactions}</div>
                
                <button className="Button" onClick={()=>this.props.likeButton(this.props.post)} >Like</button>
            </div>
        )
    }
}
