import React from "react";
import {Button, Card, Input} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ApplyGroup.scss';
import {AuthContext} from "../utilities/AuthProvider";
import Avatar from "react-avatar";
import {Redirect} from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class ApplyGroup extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userUuid: this.context.getUser()['uuid'],
      userRole: this.context.getUser()['role'],
      comment: '',
      commentLimit: 300,
      // Group related
      groupUuid: this.props.match.params["uuid"],
      groupName: '',
      // Component related
      loading: true,
      error: false,
      redirect: '',
      push: false,
      // Event related
      saving: false,
    }
  }

  @boundMethod
  async componentDidMount() {
    // Check whether user has permission to access this page
    let isPermitted = await this.isPermitted();
    if (!isPermitted) {
      this.setState({
        'redirect': '/',
        'push': false,
      });
    }

    // Get the name of the group
    await this.getGroupName();

    this.setState({loading: false});
  }

  /**
   * Checks whether the user has the permission to access this page
   * @returns {Promise<boolean>} true if the user has the permission, false otherwise
   */
  @boundMethod
  async isPermitted() {
    // Check user: whether is in any group
    try {
      let res = await this.context.request({
        path: `/user/${this.state.userUuid}`,
        method: 'get'
      });
      let userProfile = res.data['data'];

      if (userProfile['created_group']) return false;
      if (userProfile['joined_group']) return false;
    } catch (error) {
      this.setState({
        'error': true
      });
    }

    // Check user: whether is applied to this group
    try {
      let res = await this.context.request({
        path: `/user/${this.state.userUuid}/application`,
        method: 'get'
      });
      let userApplications = res.data['data'];

      for (let i = 0; i < userApplications.length; i++) {
        if (userApplications[i]['group']['uuid'] === this.state.groupUuid) return false;
      }
    } catch (error) {
      this.setState({
        'error': true
      });
    }

    // Check role: whether is an admin
    if (this.state.userRole === 'ADMIN') return false;

    // Check system: whether after Grouping DDL
    let sysConfig = await this.context.getSysConfig();
    let groupingDDL = sysConfig["system_state"]["grouping_ddl"];
    if ((Date.now() / 1000) > groupingDDL) return false;

    // Check passed, user is permitted, return true
    return true;
  }

  /**
   * Gets the name of the group, updates state
   * @returns {Promise<void>}
   */
  @boundMethod
  async getGroupName() {
    try {
      let res = await this.context.request({
        path: `/group/${this.state.groupUuid}`,
        method: 'get'
      });
      let groupInfo = res.data['data'];

      this.setState({groupName: groupInfo['name']});
    } catch (error) {
      this.setState({
        'error': true
      });
    }
  }

  @boundMethod
  onCommentChange(event) {
    this.setState({comment: event.target.value});
  }

  @boundMethod
  async onApply() {
    this.setState({saving: true});
    try {
      await this.context.request({
        path: `/group/${this.state.groupUuid}/application`,
        method: "post",
        data: {
          comment: this.state.comment,
        }
      });
      // If success, back to Group Details
      this.setState({
        redirect: `/group/${this.state.groupUuid}`,
        push: false,
      });
    } catch (error) {  // If failed, set saving to false
      this.setState({saving: false});
    }
  }

  onCancel() {
    window.history.back();
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
    let appBar = <AppBar backTo={`/group/${this.state.groupUuid}`}/>;

    if (this.state.error) {
      return (
        <React.Fragment>
          {appBar}
          <ErrorMessage/>
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

    // Comment
    let comment = <div className={styles.EditItem}>
      <h1 className={styles.Title}>{`Applying to: ${this.state.groupName}`}</h1>
      <Input.TextArea showCount className={styles.Content} rows={8} onChange={this.onCommentChange}
                      value={this.state.comment} maxLength={this.state.commentLimit}
                      placeholder={`Application letter (optional)`}/>
      <div className={styles.Gap} />
    </div>;

    // Save
    let apply = <React.Fragment>
      <div className={styles.Gap} />
      <div className={styles.Gap} />
      <Button type={'primary'} block size={'large'}
              onClick={this.onApply} loading={this.state.saving}>
        Apply
      </Button>
    </React.Fragment>;

    // Cancel
    let cancel = <React.Fragment>
      <div className={styles.Gap} />
      <Button block size={'large'} onClick={this.onCancel}>Cancel</Button>
    </React.Fragment>;

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.ApplyGroup}>
          {comment}
          {apply}
          {cancel}
        </div>
      </React.Fragment>
    );
  }
}
