import React from "react";
import {Button, Card, Divider} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ApplicationDetails.scss';
import {AuthContext} from "../utilities/AuthProvider";
import Avatar from "react-avatar";
import {Redirect} from "react-router-dom";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class UserProfile extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userUuid: this.context.getUser()['uuid'],
      // Group related
      groupUuid: this.props.match.params['groupUuid'],
      // Application related
      applicationUuid: this.props.match.params['applicationUuid'],
      name: '',
      email: '',
      comment: '',
      // Component related
      loading: true,
      error: false,
      redirect: '',
      push: false,
      // Event related
      accepting: false,
      rejecting: false,
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
    await this.checkApplication();
    // Update state
    this.setState({loading: false,});
  }

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

  @boundMethod
  async checkApplication() {
    let applications;
    // Get the full list of applications
    try {
      let res = await this.context.request({
        path: `/group/${this.state.groupUuid}/application`,
        method: 'get'
      });
      applications = res.data['data'];
    } catch (error) {
      this.setState({
        error: true,
      });
      return;
    }
    // Search in the list
    let found = false;
    for (let i = 0; i < applications.length; i++) {
      if (applications[i]['uuid'] === this.state.applicationUuid) {
        found = true;
        this.setState({
          name: applications[i]['applicant']['alias'],
          email: applications[i]['applicant']['email'],
          comment: applications[i]['comment'],
        });
      }
    }
    // If not found, indicate error
    if (!found) this.setState({error: true,});
  }

  @boundMethod
  async onAccept() {
    this.setState({accepting: true});
    try {
      await this.context.request({
        path: `/application/accepted`,
        method: "post",
        data: {
          uuid: this.state.applicationUuid,
        }
      });
      this.setState({
        redirect: `/group/${this.state.groupUuid}/applications`,
        push: false,
      });
    } catch (error) {  // If failed, set saving to false
      this.setState({accepting: false});
    }
  }

  @boundMethod
  async onReject() {
    this.setState({rejecting: true});
    try {
      await this.context.request({
        path: `/application/rejected`,
        method: "post",
        data: {
          uuid: this.state.applicationUuid,
        }
      });
      this.setState({
        redirect: `/group/${this.state.groupUuid}/applications`,
        push: false,
      });
    } catch (error) {  // If failed, set saving to false
      this.setState({rejecting: false});
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

    // Title
    let title = <div className={styles.Title}>
      <Card.Meta avatar={<Avatar size={64} round={true} name={this.state.name}/>}
                 title={this.state.name} description={this.state.email}
                 className={styles.Card}/>
    </div>;

    // Comment
    let comment = <div className={styles.Comment}>
      <Divider orientation="left">Application Letter</Divider>
      <p className={styles.Content}>{this.state.comment}</p>
    </div>;

    // Accept
    let accept = <Button type={'primary'} block size={'large'}
                         className={styles.Accept} onClick={this.onAccept}
                         loading={this.state.accepting}>
      Accept
    </Button>;

    // Reject
    let reject = <Button block size={'large'} onClick={this.onReject}
                         loading={this.state.rejecting}>
      Reject
    </Button>;

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.ApplicationDetails}>
          {title}
          {comment}
          {accept}
          {reject}
        </div>
      </React.Fragment>
    );
  }
}