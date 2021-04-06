import './global';
import "antd/dist/antd.css";
import React from 'react';
import ReactDOM from 'react-dom';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from "./pages/404";
import {AuthProvider} from "./utilities/AuthProvider";
import PrivateRoute from "./utilities/PrivateRoute";

const app = document.createElement("div");
document.body.appendChild(app);
ReactDOM.render((
    <AuthProvider>
        <Router>
            <Switch>
                <PrivateRoute exact path="/">
                    <Home/>
                </PrivateRoute>
                <Route path="/login">
                    <Login/>
                </Route>
                <Route path="*">
                    <NotFound/>
                </Route>
            </Switch>
        </Router>
    </AuthProvider>
), app);