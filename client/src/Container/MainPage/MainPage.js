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