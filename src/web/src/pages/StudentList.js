import React from "react";
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './StudentList.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import UserItem from "../components/UserItem";
import ErrorMessage from "../components/ErrorMessage";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class StudentList extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userRole: this.context.getUser()['role'],
      // Student related
      studentList: [],
      // Component related
      loading: true,
      error: false,
      redirect: '',
      push: false,
    }
  }

  async componentDidMount() {
    // Check permission
    if (this.state.userRole !== 'ADMIN') {
      this.setState({
        'redirect': '/',
        'push': false,
      });
    }
    // Retrieve Info
    await this.checkStudent();
    // Update state
    this.setState({loading: false,});
  }

  /**
   * Retrieves the student list
   * @returns {Promise<void>}
   */
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
        if (userList[i]['role'] === 'USER') studentList.push(userList[i]);
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

    let students = [];
    for (let i = 0; i < this.state.studentList.length; i++) {
      let userItem = <UserItem userObject={this.state.studentList[i]}
                               onItemClicked={this.onClick}
                               key={this.state.studentList[i]['uuid']}/>;
      students.push(userItem);
    }

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.StudentList}>
          {students}
        </div>
      </React.Fragment>
    );
  }
}