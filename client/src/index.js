import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Router} from 'react-router'
import { createBrowserHistory } from "history";
import { usePromiseTracker } from "react-promise-tracker";

const history = createBrowserHistory();

const LoadingIndicator = props => {
  const { promiseInProgress } = usePromiseTracker();
  return (
    promiseInProgress && 
    <h1 className="loader">Hey some async call in progress ! </h1>
 );  
 }

ReactDOM.render(
  <Router history={history}>
    <LoadingIndicator/>
     <App />
    </Router>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
