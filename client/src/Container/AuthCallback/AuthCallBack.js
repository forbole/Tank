import React, { Component } from 'react'
import jwt_decode from "jwt-decode";
import Oidc from 'oidc-client'
import config from '../MainPage/config.js'
import Posts from '../../Comopnent/Posts/Posts'

export default class AuthCallBack extends Component {
    state={
        userid:""
    }
    async componentDidMount(){
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
        }
        


    render() {
        return (
            <div>
                <Posts userid={this.state.userid} />
            </div>
        )
    }
}
