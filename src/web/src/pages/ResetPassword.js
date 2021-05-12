import React from "react";
import {Button, Input} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ResetPassword.scss';
import {AuthContext} from "../utilities/AuthProvider";
import ErrorMessage from "../components/ErrorMessage";
import {Redirect} from "react-router-dom";
import SHA1 from "crypto-js/sha1";

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
      userList: [],
      studentEmail: '',
      newPassword: '',
      // Component related
      loading: true,
      error: false,
      redirect: '',
      push: false,
      // Event related
      resetting: false,
      wrongEmail: false,
    };
  }

  async componentDidMount() {
    // Check permission
    if (this.state.userRole !== 'ADMIN') {
      this.setState({
        redirect: '/',
        push: false,
      })
    }
    // Get user list
    try {
      let res = await this.context.request({
        path: `/user`,
        method: 'get'
      });

      this.setState({
        userList: res.data['data'],
      });
    } catch (error) {
      this.setState({
        'error': true
      });
    }
    // Set loading to false
    this.setState({loading: false});
  }

  generatePassword() {
    const length = 8;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let generated = '';
    for (let i = 0; i < length; i++) {
      generated += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    console.debug(generated);
    return generated;
  }

  @boundMethod
  onEmailChange(event) {
    this.setState({
      studentEmail: event.target.value,
      wrongEmail: false,
    });
  }

  @boundMethod
  async onReset() {
    this.setState({
      resetting: true,
      newPassword: '',
    });
    // Check the UUID of the user
    let uuid = '';
    for (let i = 0; i < this.state.userList.length; i++) {
      if (this.state.userList[i]['email'] === this.state.studentEmail) {
        uuid = this.state.userList[i]['uuid'];
        break;
      }
    }
    // If uuid is empty, the email is wrong, show warning
    if (!uuid) this.setState({wrongEmail: true});
    // Else, request to reset password
    else {
      let newPassword = this.generatePassword();
      try {
        await this.context.request({
          path: `/user/${uuid}/password`,
          method: 'patch',
          data: {
            new_password: SHA1(newPassword).toString(),
          },
        });
        this.setState({newPassword: newPassword});
      } catch (error) {}
    }
    this.setState({resetting: false});
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
    </p>;

    // Info
    let info = <p className={styles.Info}>
      Password reset successful<br/>
      {`The user's new password is: ${this.state.newPassword}`}
    </p>;

    // Email
    let email = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Reset password for a student</h1>
      <Input className={styles.Content} placeholder={'Student Email'}
             onChange={this.onEmailChange} value={this.state.studentEmail}/>
      {this.state.wrongEmail ? warning : null}
      {this.state.newPassword ? info : null}
    </div>;

    // Reset
    let reset = <React.Fragment>
      <div className={styles.Gap}/>
      <div className={styles.Button}>
        <Button type={'primary'} block size={'large'}
                onClick={this.onReset} loading={this.state.resetting}
                disabled={!this.state.studentEmail}>
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
