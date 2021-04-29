import './global.scss';
import "antd/dist/antd.css";
import React from 'react';
import ReactDOM from 'react-dom';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import GroupList from './pages/GroupList';
import Login from './pages/Login';
import NotFound from "./pages/404";
import {AuthProvider} from "./utilities/AuthProvider";
import PrivateRoute from "./utilities/PrivateRoute";
import HtmlHead from "./components/HtmlHead";
import GroupDetails from "./pages/GroupDetails";
import EditGroupProfile from './pages/EditGroupProfile';
import AccountProfile from "./pages/AccountProfile";
import GroupConfig from "./pages/GroupConfig";

ReactDOM.render((
    <AuthProvider>
        <HtmlHead/>
        <Router>
            <Switch>
                <PrivateRoute exact path={"/"} component={GroupList}/>
                <PrivateRoute path={"/user"} component={AccountProfile}/>
                <Route path={"/login"} component={Login}/>
                <PrivateRoute path={"/group/:uuid/config"} component={GroupConfig}/>
                <PrivateRoute path={'/group/:uuid/edit'} component={EditGroupProfile}/>
                <PrivateRoute path={"/group/:uuid"} component={GroupDetails}/>
                <Route path={"*"} component={NotFound}/>
            </Switch>
        </Router>
    </AuthProvider>
), document.getElementById("react-app"));