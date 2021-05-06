import React from "react";
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ManageMember.scss';
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
export default class ManageMember extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userUuid: this.context.getUser()['uuid'],
      // Group related
      groupUuid: this.props.match.params["uuid"],
      members: null,
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
    // Get group info
    let groupInfo = await this.getGroupInfo();
    // Check permission
    let isPermitted = this.isPermitted(groupInfo);
    if (!isPermitted) {
      this.setState({
        'redirect': '/',
        'push': false,
      });
    }
    // Update state
    this.setState({loading: false,});
  }

  /**
   * Retrieves the group info
   * @returns {Promise<Object>} group info
   */
  @boundMethod
  async getGroupInfo() {
    try {
      let res = await this.context.request({
        path: `/group/${this.state.groupUuid}`,
        method: 'get'
      });
      let groupInfo = res.data['data'];
      this.setState({members: groupInfo['member']});
      return groupInfo;
    } catch (error) {
      this.setState({
        error: true,
      });
    }
    return null;
  }

  /**
   * Checks whether the user has the permission to access this page
   * @param groupInfo {Object} the info of the group
   * @returns {Promise<boolean>} true if the user has the permission, false otherwise
   */
  @boundMethod
  async isPermitted(groupInfo) {
    // Check user: whether is not the group owner
    if (this.state.userUuid !== groupInfo['owner']['uuid']) return false;
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
    this.setState({
      'redirect': `/user/${userObject['uuid']}`,
      'push': true,
    });
  }

  /**
   * Delete handler
   * @param userObject {Object} the user object
   */
  @boundMethod
  async onDelete(userObject) {
    this.setState({deleting: true});
    try {
      await this.context.request({
        path: `/group/${this.state.groupUuid}/member/${userObject['uuid']}`,
        method: 'delete'
      });
      await this.getGroupInfo();
    } catch (error) {
      this.setState({
        deleting: false,
      });
    }
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

    let members = [];
    for (let i = 0; i < this.state.members.length; i++) {
      let userItem = <UserItem userObject={this.state.members[i]}
                               onItemClicked={this.onClick}
                               onDeleteClicked={this.onDelete}
                               key={this.state.members[i]['uuid']}/>;
      members.push(userItem);
    }

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.ManageMember}>
          {members}
        </div>
      </React.Fragment>
    );
  }
}