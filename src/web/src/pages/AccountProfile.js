import React from "react";
import PropTypes from "prop-types";
import {Avatar, Button, Card, List} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import TabNav from "../components/TabNav";
import './AccountProfile.scss';
import {AuthContext} from "../utilities/AuthProvider";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class AccountProfile extends React.Component {
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
      'isJoined': false,
      'isAdmin': false,
      // System related
      'groupingDDL': 0,  // get from context
      'afterGroupingDDL': false,
    }
  }

  render() {
    // App Bar
    let appBar = <AppBar showBack={false}/>;
    // Tab Navigation
    let tabNav = <TabNav active={"USER_PROFILE"}/>

    // Title
    let title = <React.Fragment>
      <a href={'#'} className={'title'}>
        <Card.Meta avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" size={64}/>}
                   title={'Obi Wan'} description={'o.wan@test.com'}
                   className={'card'}/>
      </a>
      <div className={'gap'} />
      <div className={'gap'} />
    </React.Fragment>;

    // Edit Profile, Change Password (All Users) (All Stages)
    let editProfile = <React.Fragment>
      <div className={'gap'} />
      <Button type={'primary'} block size={'large'}>Edit Profile</Button>
    </React.Fragment>;
    let changePassword = <React.Fragment>
      <div className={'gap'} />
      <Button block size={'large'}>Change Password</Button>
    </React.Fragment>;

    // Create Group (Student) (Before Grouping DDL)
    let createGroup = null;
    if (!this.state.isJoined && !this.state.isAdmin && !this.state.afterGroupingDDL) {
      createGroup = <React.Fragment>
        <div className={'gap'} />
        <Button block size={'large'}>Create Group</Button>
      </React.Fragment>
    }

    // Semester Tools, Reports, Archives (Admin) (All Stages)
    let semesterTools = null, reports = null, archives = null;
    if (this.state.isAdmin) {
      semesterTools = <React.Fragment>
        <div className={'gap'} />
        <Button block size={'large'}>Semester Tools</Button>
      </React.Fragment>;
      reports = <React.Fragment>
        <div className={'gap'} />
        <Button block size={'large'}>Reports</Button>
      </React.Fragment>;
      archives = <React.Fragment>
        <div className={'gap'} />
        <Button block size={'large'}>Change Password</Button>
      </React.Fragment>;
    }

    return (
      <React.Fragment>
        {appBar}
        <div className={'account-profile'}>
          {title}
          {editProfile}
          {changePassword}
          {createGroup}
          {semesterTools}
          {reports}
          {archives}
        </div>
        {tabNav}
      </React.Fragment>
    );
  }
}