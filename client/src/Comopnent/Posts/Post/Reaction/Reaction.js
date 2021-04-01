import React, { Component } from 'react'
import './Reaction.css'
export default class Reaction extends Component {
    state={
        active:false
    }
    ToggleStateHandler=()=>{
        if (this.state.active===false){
            this.setState({
                active:true
            })
        }else{
            this.setState({
                active:false
            })
        }
    }
    render() {
        let showUser=null
        if (this.state.active===true){
            showUser= <div> <p className='Author'>{this.props.owner}</p> </div>
        }
        return (
            <div className="Reaction" onClick={this.ToggleStateHandler}>
                <p>{this.props.value}</p>
                {showUser}
            </div>
        )
    }
}
