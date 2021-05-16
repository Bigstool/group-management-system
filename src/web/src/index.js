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
import SemesterTools from './pages/SemesterTools';
import ChangePassword from "./pages/ChangePassword";
import ResetPassword from "./pages/ResetPassword";
import TransferGroupOwner from "./pages/TransferGroupOwner";
import StudentList from "./pages/StudentList";
import Reports from "./pages/Reports";
import GroupAllocation from "./pages/GroupAllocation";
import ArchiveList from "./pages/ArchiveList";
import ArchiveDetails from "./pages/ArchiveDetails";

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
                  <PrivateRoute exact path={"/user/password"} component={ChangePassword}/>
                  <PrivateRoute exact path={"/user/:uuid"} component={UserProfile}/>
                  <PrivateRoute exact path={"/user"} component={AccountPanel}/>
                  <Route exact path={"/login"} component={Login}/>
                  <PrivateRoute exact path={"/group/:uuid/apply"} component={ApplyGroup}/>
                  <PrivateRoute exact path={"/group/:uuid/config"} component={GroupConfig}/>
                  <PrivateRoute exact path={'/group/:uuid/edit'} component={EditGroupProfile}/>
                  <PrivateRoute exact path={'/group/:uuid/manage'} component={ManageMember}/>
                  <PrivateRoute exact path={'/group/:uuid/transfer'} component={TransferGroupOwner}/>
                  <PrivateRoute exact path={'/group/:uuid/applications'} component={ManageApplication}/>
                  <PrivateRoute exact path={'/group/:groupUuid/application/:applicationUuid'} component={ApplicationDetails}/>
                  <PrivateRoute exact path={"/group/:uuid"} component={GroupDetails}/>
                  <PrivateRoute exact path={"/create/group"} component={CreateGroup}/>
                  <PrivateRoute exact path={"/semester/archives"} component={ArchiveList}/>
                  <PrivateRoute exact path={"/semester/archive/:uuid"} component={ArchiveDetails}/>
                  <PrivateRoute exact path={"/semester/tools"} component={SemesterTools}/>
                  <PrivateRoute exact path={"/semester/students"} component={StudentList}/>
                  <PrivateRoute exact path={"/semester/reports"} component={Reports}/>
                  <PrivateRoute exact path={"/semester/allocate"} component={GroupAllocation}/>
                  <PrivateRoute exact path={"/admin/reset"} component={ResetPassword}/>
                  <Route path={"*"} component={NotFound}/>
              </Switch>
          </Router>
      </AuthProvider>
), document.getElementById(styles.ReactApp));