import React from "react";
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import {Button} from 'antd';
import AppBar from "../components/AppBar";
import styles from './GroupAllocation.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import UserItem from "../components/UserItem";
import ErrorMessage from "../components/ErrorMessage";
import moment from "moment";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class GroupAllocation extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userRole: this.context.getUser()['role'],
      // Student related
      studentList: [],
      studentSelected: [],
      // Component related
      loading: true,
      error: false,
      redirect: '',
      push: false,
      // Event related
      allocating: false,
    }
  }

  async componentDidMount() {
    // Check permission
    await this.checkPermission();
    // Check student
    await this.checkStudent();
    // Stop loading
    this.setState({loading: false,});
  }

  @boundMethod
  async checkPermission() {
    let isPermitted = true;
    // Check user: whether is admin
    if (this.state.userRole !== 'ADMIN') isPermitted = false;
    // Check system: whether is between Grouping DDL and Proposal DDL
    let sysConfig = await this.context.getSysConfig();
    let groupingDDL = sysConfig['system_state']['grouping_ddl'];
    let proposalDDL = sysConfig['system_state']['proposal_ddl'];
    let afterGroupingDDL = groupingDDL ? (Date.now() / 1000) > groupingDDL : false;
    let afterProposalDDL = proposalDDL ? (Date.now() / 1000) > proposalDDL : false;
    if (!afterGroupingDDL || afterProposalDDL) isPermitted = false;
    // Check complete, redirect if not permitted
    if (!isPermitted) {
      this.setState({
        redirect: '/',
        push: false,
      });
    }
  }

  @boundMethod
  async checkStudent() {
    try {
      let res = await this.context.request({
        path: `/user`,
        method: 'get'
      });
      let userList = res.data['data'];
      let studentList = [];
      for (let i = 0; i < userList.length; i++) {
        if (userList[i]['role'] === 'USER' && userList[i]['orphan']) studentList.push(userList[i]);
      }
      this.setState({
        studentList: studentList,
      });
    } catch (error) {
      this.setState({
        error: true,
      });
    }
  }

  @boundMethod
  async onAllocate() {
    this.setState({allocating: true});
    let studentSelected = this.state.studentSelected;
    let ownerUuid = studentSelected.shift();
    try {
      await this.context.request({
        path: `/group/assigned`,
        method: 'post',
        data: {
          description: 'Not set',
          member_uuid: studentSelected,
          name: `Allocated Group ${ownerUuid.split('-')[0]}`,
          owner_uuid: ownerUuid,
          title: 'Not set',
        }
      });
      studentSelected = [];
      this.setState({
        studentSelected: studentSelected,
      });
      await this.checkStudent();
    } catch (error) {}
    this.setState({allocating: false});
  }

  @boundMethod
  onCheck(userObject, checked) {
    let newStudentSelected = this.state.studentSelected;
    // If checked, push into studentSelected
    if (checked) {
      newStudentSelected.push(userObject['uuid']);
    } else {
      for (let i = 0; i < newStudentSelected.length; i++) {
        if (newStudentSelected[i] === userObject['uuid']) {
          newStudentSelected.splice(i, 1);
        }
      }
    }
    this.setState({studentSelected: newStudentSelected});
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
    let appBar = <AppBar backTo={`/semester/tools`}/>;

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

    let allocate = <Button type={'primary'} block size={'large'}
                           disabled={this.state.studentSelected.length === 0}
                           onClick={this.onAllocate}>
      Allocate
    </Button>;

    let students = [];
    for (let i = 0; i < this.state.studentList.length; i++) {
      let userItem = <UserItem userObject={this.state.studentList[i]}
                               onCheckboxChanged={this.onCheck}
                               key={this.state.studentList[i]['uuid']}/>;
      students.push(userItem);
    }

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.GroupAllocation}>
          {allocate}
          {students}
        </div>
      </React.Fragment>
    );
  }
}