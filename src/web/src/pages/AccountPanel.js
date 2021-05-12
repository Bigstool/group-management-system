import React from "react";
import PropTypes from "prop-types";
import {Button, Card} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import TabNav from "../components/TabNav";
import styles from './AccountPanel.scss';
import {AuthContext} from "../utilities/AuthProvider";
import PageContainer from "../components/PageContainer";
import {Redirect, Link} from "react-router-dom";
import Avatar from "react-avatar";
import ErrorMessage from "../components/ErrorMessage";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class AccountPanel extends React.Component {
  static propTypes = {
    // null
  }
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      'userUuid': this.context.getUser()['uuid'],
      'userRole': this.context.getUser()['role'],
      'name': '',
      'email': '',
      'isJoined': false,
      'isAdmin': false,
      // System related
      'groupingDDL': 0,  // get from context
      'afterGroupingDDL': false,
      // Component related
      'loading': true,
      'error': false,
      'redirect': false,
      'push': false,
    }
  }

  async componentDidMount() {
    await this.checkSysConfig();
    await this.checkUserProfile();
    this.setState({'loading': false});
  }

  // Retrieves system config and updates this.state
  @boundMethod
  async checkSysConfig() {
    let sysConfig = await this.context.getSysConfig();
    this.setState({
      'groupingDDL': sysConfig["system_state"]["grouping_ddl"],
    });
    // update afterGroupingDDL
    if ((Date.now() / 1000) > this.state.groupingDDL) this.setState({'afterGroupingDDL': true});
    else this.setState({'afterGroupingDDL': false});
  }

  // Retrieves user profile and updates this.state
  @boundMethod
  async checkUserProfile() {
    try {
      let res = await this.context.request({
        path: `/user/${this.state.userUuid}`,
        method: 'get'
      });
      let userProfile = res.data['data'];

      // update name and email
      this.setState({
        'name': userProfile['alias'],
        'email': userProfile['email'],
      })

      // update isJoined
      if (userProfile['created_group'] || userProfile['joined_group']) this.setState({'isJoined': true});
      else this.setState({'isJoined': false});

      // update isAdmin
      if (this.state.userRole === 'ADMIN') this.setState({'isAdmin': true});
      else this.setState({'isAdmin': false});
    } catch (error) {
      this.setState({
        'error': true
      });
    }
  }

  @boundMethod
  onEditProfile() {
    this.setState({
      'redirect': `/user/edit`,
      'push': true,
    });
  }

  @boundMethod
  onChangePassword() {
    this.setState({
      'redirect': `/user/password`,
      'push': true,
    });
  }

  @boundMethod
  onCreateGroup() {
    this.setState({
      'redirect': `/create/group`,
      'push': true,
    });
  }

  @boundMethod
  onResetPassword() {
    this.setState({
      'redirect': `/admin/reset`,
      'push': true,
    });
  }

  @boundMethod
  onSemesterTools() {
    this.setState({
      'redirect': `/semester/tools`,
      'push': true,
    });
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
    let appBar = <AppBar backTo={false}/>;
    // Tab Navigation
    let tabNav = <TabNav active={"USER_PROFILE"}/>

    if (this.state.error) {
      return (
        <React.Fragment>
          {appBar}
          <ErrorMessage/>
          {tabNav}
        </React.Fragment>
      );
    }

    if (this.state.loading) {
      return (
        <React.Fragment>
          {appBar}
          <LoadingOutlined/>
          {tabNav}
        </React.Fragment>
      );
    }

    // Title
    let title = <React.Fragment>
      <Link to={`/user/${this.state.userUuid}`} className={styles.Title}>
        <Card.Meta avatar={<Avatar size={64} round={true} name={this.state.name}/>}
                   title={this.state.name} description={this.state.email}
                   className={'card'}/>
      </Link>
      <div className={styles.Gap} />
      <div className={styles.Gap} />
    </React.Fragment>;

    const logout = <>
      <div className={styles.Gap} />
      <Button danger block size={'large'}
              onClick={this.context.logout}>
        Logout
      </Button>
    </>

    // Edit Profile, Change Password (All Users) (All Stages)
    let editProfile = <React.Fragment>
      <div className={styles.Gap} />
      <Button type={'primary'} block size={'large'}
              onClick={this.onEditProfile}>
        Edit Profile
      </Button>
    </React.Fragment>;
    let changePassword = <React.Fragment>
      <div className={styles.Gap} />
      <Button block size={'large'} onClick={this.onChangePassword}>
        Change Password
      </Button>
    </React.Fragment>;

    // Create Group (Student) (Before Grouping DDL)
    let createGroup = null;
    if (!this.state.isJoined && !this.state.isAdmin && !this.state.afterGroupingDDL) {
      createGroup = <React.Fragment>
        <div className={styles.Gap} />
        <Button block size={'large'}
                onClick={this.onCreateGroup}>
          Create Group
        </Button>
      </React.Fragment>
    }

    // Reset Password, Semester Tools, Reports, Archives (Admin) (All Stages)
    let resetPassword = null, semesterTools = null, reports = null, archives = null;
    if (this.state.isAdmin) {
      resetPassword = <React.Fragment>
        <div className={styles.Gap} />
        <Button block size={'large'} onClick={this.onResetPassword}>
          Reset Password For A User
        </Button>
      </React.Fragment>;
      semesterTools = <React.Fragment>
        <div className={styles.Gap} />
        <Button block size={'large'}
                onClick={this.onSemesterTools}>
          Semester Tools
        </Button>
      </React.Fragment>;
      reports = <React.Fragment>
        <div className={styles.Gap} />
        <Button block size={'large'}>Reports</Button>
      </React.Fragment>;
      archives = <React.Fragment>
        <div className={styles.Gap} />
        <Button block size={'large'}>Archives</Button>
      </React.Fragment>;
    }

    return (
      <React.Fragment>
        <PageContainer header={appBar} footer={tabNav}>
          <div className={styles.AccountProfile}>
            {title}
            {editProfile}
            {changePassword}
            {createGroup}
            {resetPassword}
            {semesterTools}
            {reports}
            {archives}
            {logout}
          </div>
        </PageContainer>
      </React.Fragment>
    );
  }
}