import React from 'react'
import {Route} from 'react-router-dom'
import Posts from '../../Comopnent/Posts/Posts'
import { AuthProvider } from 'oidc-react';
import oidcConfig from './config'
import {Switch} from 'react-router'
import Dashboard from '../../Comopnent/Dashboard/Dashboard'
import Auth from '../../Comopnent/Auth/Auth'
import AuthCallBack from '../AuthCallback/AuthCallBack'


export default function MainPage (){

           return (
               <div>
                   <div>
                   <h1>Tank Demonstration</h1>
<h2>Social media recommendation powered by blockchains</h2>
<p>This is a demonstration of how users can the posts interested that stored on Desmos chain base on user interests that stored on Oasis Parcel SDK.</p>
<p>This demonstration do not require Desmos address - only thing you need is a Google account.</p>
<p>Please complete the feedback form at the bottom after you try this out!</p>
                   </div>
                   <Auth/>
                   <Switch>
                        <Route exact path="/" component={Dashboard}>
                        </Route>
                        <Route path='/posts' component={AuthCallBack}>
                        </Route>
                    </Switch>
               </div>
                    
           )   
    }

/* {/*  } */