import React, { Component } from 'react'

export default class Script extends Component {
    appendScript = (scriptToAppend) => {
        const script = document.createElement("script");
        script.src = scriptToAppend;
        script.async = true;
        document.body.appendChild(script);
    }

    componentDidMount(){
        this.appendScript("https://cdn.jsdelivr.net/gh/IdentityModel/oidc-client-js@1.10.1/dist/oidc-client.js")
        this.appendScript("https://cdn.jsdelivr.net/gh/auth0/jwt-decode@2.2.0/build/jwt-decode.js")
        //this.appendScript("../../Comopnent/Auth/config.js")
        console.log("Script loaded")
    }
    render() {
        return (
            <div>
                <p>Component Loaded</p>
            </div>
        )
    }
}
