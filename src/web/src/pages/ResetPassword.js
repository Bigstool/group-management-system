import React from "react";
import {Button, Input} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ResetPassword.scss';
import {AuthContext} from "../utilities/AuthProvider";
import ErrorMessage from "../components/ErrorMessage";
import {Redirect} from "react-router-dom";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class ResetPassword extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userRole: this.context.getUser()['role'],
      studentEmail: '',
      newPassword: '',
      // Component related
      loading: true,
      error: false,
      redirect: '',
      push: false,
      // Event related
      resetting: false,
      wrongEmail: false,  //TODO: when saved: set to false
      success: false,  // TODO: when saving: set to false
    };
  }

  async componentDidMount() {
    if (this.state.userRole !== 'ADMIN') {
      this.setState({
        redirect: '/',
        push: false,
      })
    }
    this.setState({loading: false});
  }

  @boundMethod
  onEmailChange(event) {
    this.setState({studentEmail: event.target.value});
  }

  @boundMethod
  onReset() {
    // TODO
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
    let appBar = <AppBar/>;

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

    // Warning
    let warning = <p className={styles.Warning}>
      Email not found, please try again
    </p>

    // Info
    let info = <p className={styles.Info}>
      Password reset successful<br/>
      {`The student's new password is: ${this.state.newPassword}`}
    </p>

    // Email
    let email = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Reset password for a student</h1>
      <Input className={styles.Content} placeholder={'Student Email'}
             onChange={this.onEmailChange} value={this.state.studentEmail}/>
      {this.state.wrongEmail ? warning : null}
      {this.state.success ? info : null}
    </div>;

    // Reset
    let reset = <React.Fragment>
      <div className={styles.Gap}/>
      <div className={styles.Button}>
        <Button type={'primary'} block size={'large'}
                onClick={this.onReset} loading={this.state.resetting}>
          Reset
        </Button>
      </div>
    </React.Fragment>;

    // Cancel
    let cancel = <div className={styles.Button}>
      <Button block size={'large'} onClick={this.onCancel}>Cancel</Button>
    </div>

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.ResetPassword}>
          {email}
          {reset}
          {cancel}
        </div>
      </React.Fragment>
    )
  }
}
