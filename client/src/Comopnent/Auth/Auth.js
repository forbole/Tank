import React, { Component,useState } from 'react'
import Oidc from 'oidc-client'
import config from '../../Container/MainPage/config.js'
import './Auth.css'


export default class Auth extends Component {
    constructor(props) {
        super(props);
        this.state={
            need_auth:true,
            user:{}
        }
      }

    render() {
        
        Oidc.Log.logger = console;
        Oidc.Log.level = Oidc.Log.DEBUG;
        const oidcClient = new Oidc.UserManager(config);

        async function obtainIdToken() {
          const request = await oidcClient.createSigninRequest();
          console.log("requst"+request.url)
          window.location.assign(request.url);
         

        }
        //this.state.useState({user:}).bind(this)

        let element=null
        if (this.state.need_auth){
            element = <button className="Button" onClick={obtainIdToken} data-cy="sign-up-oasis">Getting Started with Google Auth!</button>
        }

        return (
            <div>
               {element}
            </div>
        )
    }
}
