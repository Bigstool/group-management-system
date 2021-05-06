import styles from './global.scss';
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
import ApplyGroup from "./pages/ApplyGroup";
import EditGroupProfile from './pages/EditGroupProfile';
import AccountPanel from "./pages/AccountPanel";
import EditProfile from "./pages/EditProfile";
import GroupConfig from "./pages/GroupConfig";
import UserProfile from "./pages/UserProfile";
import CreateGroup from "./pages/CreateGroup";
import ManageMember from "./pages/ManageMember";
import ManageApplication from "./pages/ManageApplication";
import ApplicationDetails from './pages/ApplicationDetails';

const app = document.createElement("div");
app.id = styles.ReactApp;
document.body.appendChild(app)

ReactDOM.render((
      <AuthProvider>
          <HtmlHead/>
          <Router>
              <Switch>
                  <PrivateRoute exact path={"/"} component={GroupList}/>
                  <PrivateRoute exact path={"/user/edit"} component={EditProfile}/>
                  <PrivateRoute path={"/user/:uuid"} component={UserProfile}/>
                  <PrivateRoute exact path={"/user"} component={AccountPanel}/>
                  <Route exact path={"/login"} component={Login}/>
                  <PrivateRoute path={"/group/:uuid/apply"} component={ApplyGroup}/>
                  <PrivateRoute path={"/group/:uuid/config"} component={GroupConfig}/>
                  <PrivateRoute path={'/group/:uuid/edit'} component={EditGroupProfile}/>
                  <PrivateRoute path={'/group/:uuid/manage'} component={ManageMember}/>
                  <PrivateRoute path={'/group/:uuid/applications'} component={ManageApplication}/>
                  <PrivateRoute path={'/group/:groupUuid/application/:applicationUuid'} component={ApplicationDetails}/>
                  <PrivateRoute path={"/group/:uuid"} component={GroupDetails}/>
                  <PrivateRoute exact path={"/create/group"} component={CreateGroup}/>
                  <Route path={"*"} component={NotFound}/>
              </Switch>
          </Router>
      </AuthProvider>
), document.getElementById(styles.ReactApp));