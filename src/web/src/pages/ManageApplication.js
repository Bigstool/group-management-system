import React from "react";
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ManageApplication.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import UserItem from "../components/UserItem";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class ManageApplication extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userUuid: this.context.getUser()['uuid'],
      // Group related
      groupUuid: this.props.match.params["uuid"],
      // Application related
      applications: null,
      // Component related
      loading: true,
      error: false,
      redirect: '',
      push: false,
      // Event related
      deleting: false,
    }
  }

  async componentDidMount() {
    // Check permission
    let isPermitted = await this.isPermitted();
    if (!isPermitted) {
      this.setState({
        'redirect': '/',
        'push': false,
      });
    }
    // Retrieve application info
    await this.checkApplications();
    // Update state
    this.setState({loading: false,});
  }

  /**
   * Retrieves the applications
   * @returns {Promise<void>}
   */
  @boundMethod
  async checkApplications() {
    try {
      let res = await this.context.request({
        path: `/group/${this.state.groupUuid}/application`,
        method: 'get'
      });
      let applications = res.data['data'];
      this.setState({
        applications: applications,
      });
    } catch (error) {
      this.setState({
        error: true,
      });
    }
  }

  /**
   * Checks whether the user has the permission to access this page
   * @returns {Promise<boolean>} true if the user has the permission, false otherwise
   */
  @boundMethod
  async isPermitted() {
    // Check user: whether is not the group owner
    try {
      let res = await this.context.request({
        path: `/group/${this.state.groupUuid}`,
        method: 'get'
      });
      let groupInfo = res.data['data'];
      if (this.state.userUuid !== groupInfo['owner']['uuid']) return false;
    } catch (error) {
      this.setState({
        error: true,
      });
    }
    // Check system: whether is after Grouping DDL
    let sysConfig = await this.context.getSysConfig();
    let groupingDDL = sysConfig["system_state"]["grouping_ddl"];
    if ((Date.now() / 1000) > groupingDDL) return false;
    // Check passed, user is permitted, return true
    return true;
  }

  /**
   * Click handler
   * @param userObject {Object} the user object
   */
  @boundMethod
  onClick(userObject) {

  }

  render() {
    // Check if redirect is needed
    if (this.state.redirect) {
      if (this.state.push) {
        return (
          <Redirect push to={this.state.redirect}/>
        );
      } else {
        return (
          <Redirect to={this.state.redirect}/>
        );
      }
    }

    // App Bar
    let appBar = <AppBar/>;

    if (this.state.error) {
      return (
        <React.Fragment>
          {appBar}
          <h1>Oops, something went wrong</h1>
          <h3>Perhaps reload?</h3>
        </React.Fragment>
      );
    }

    if (this.state.loading) {
      return (
        <React.Fragment>
          {appBar}
          <LoadingOutlined/>
        </React.Fragment>
      );
    }

    let applications = [];
    for (let i = 0; i < this.state.applications.length; i++) {
      let userItem = <UserItem userObject={this.state.applications[i]['applicant']}
                               onItemClicked={this.onClick}
                               key={this.state.applications[i]['applicant']['uuid']}/>;
      applications.push(userItem);
    }

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.ManageApplication}>
          {applications}
        </div>
      </React.Fragment>
    );
  }
}