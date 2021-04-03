import './global';
import "antd/dist/antd.css";
import React from 'react';
import ReactDOM from 'react-dom';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import App from './pages/App';
import Login from './pages/Login';
import NotFound from "./pages/404";
import Admin from "./pages/Admin";


ReactDOM.render((
    <Router>
        {/*
          A <Switch> looks through all its children <Route>
          elements and renders the first one whose path
          matches the current URL. Use a <Switch> any time
          you have multiple routes, but you want only one
          of them to render at a time
        */}
        <Switch>
            <Route exact path="/">
                <App/>
            </Route>
            <Route path="/lemon">
                <Admin/>
            </Route>
            <Route path="/login">
                <Login/>
            </Route>
            <Route path="*">
                <NotFound/>
            </Route>
        </Switch>
    </Router>
), document.body);