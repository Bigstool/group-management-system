import React from "react";
import {Button} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './Reports.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class Reports extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userRole: 'ADMIN', // TODO: this.context.getUser()['role'],
      // Component related
      loading: true,
      error: false,
      redirect: false,
      push: false,
      // Event related
      reportingStudent: false,
      reportingGroup: false,
    }
  }

  async componentDidMount() {
    // Check permission
    if (this.state.userRole !== 'ADMIN') {
      this.setState({
        redirect: '/',
        push: false,
      });
    }
    // Complete loading
    this.setState({loading: false});
  }

  @boundMethod
  onStudent() {
    this.setState({reportingStudent: true,});
    let text = `"Name","Email","Grouped",\n`;
    // TODO: get /user, extract text
    text += `"Tom","tom@test.com","yes",\n"Bob","bob@test.com","no",\n`;
    const fileType = 'text/csv';
    const fileName = 'Student Report.csv';
    let blob = new Blob([text], {type : fileType});
    let a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.click();
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
    this.setState({reportingStudent: false,});
  }

  @boundMethod
  onGroup() {
    this.setState({reportingGroup: true,});
    let text = `"Name","Proposal State",\n`;
    // TODO: get /group, extract text
    text += `"Team A","Not Submitted",\n"Team B","Submitted",\n"Team C","Approved",\n"Team D","Rejected",\n`;
    const fileType = 'text/csv';
    const fileName = 'Group Report.csv';
    let blob = new Blob([text], {type : fileType});
    let a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.click();
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
    this.setState({reportingGroup: false,});
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
    let appBar = <AppBar backTo={`/user`}/>;

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

    // Student Report
    let student = <Button type={'primary'} block size={'large'}
                          onClick={this.onStudent}>
      Download Student Report
    </Button>;

    let group = <Button block size={'large'}
                        onClick={this.onGroup}>
      Download Group Report
    </Button>;

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.Reports}>
          {student}
          {group}
        </div>
      </React.Fragment>
    );
  }
}