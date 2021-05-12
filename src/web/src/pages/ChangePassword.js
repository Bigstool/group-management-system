import React from "react";
import {Button, Input} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ChangePassword.scss';
import {AuthContext} from "../utilities/AuthProvider";
import SHA1 from "crypto-js/sha1";
import ErrorMessage from "../components/ErrorMessage";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class ChangePassword extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userUuid: this.context.getUser()['uuid'],
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      // Component related
      loading: true,
      error: false,
      // Event related
      changing: false,
      wrongPassword: false,
      unmatchPassword: false,
    };
  }

  async componentDidMount() {
    this.setState({loading: false});
  }

  @boundMethod
  onCurrentChange(event) {
    this.setState({
      wrongPassword: false,
      currentPassword: event.target.value,
    });
  }

  @boundMethod
  onNewChange(event) {
    this.setState({
      unmatchPassword: false,
      newPassword: event.target.value,
    });
  }

  @boundMethod
  onConfirmChange(event) {
    this.setState({
      unmatchPassword: false,
      confirmPassword: event.target.value,
    });
  }

  @boundMethod
  async onChange() {
    this.setState({changing: true});
    // Check if new password matches confirm password
    if (this.state.newPassword !== this.state.confirmPassword) {
      this.setState({
        unmatchPassword: true,
        changing: false,
      });
      return;
    }
    // Submit changes
    try {
      await this.context.request({
        path: `/user/${this.state.userUuid}/password`,
        method: 'patch',
        data: {
          new_password:SHA1(this.state.newPassword).toString(),
          old_password: SHA1(this.state.currentPassword).toString(),
        },
      });
      window.history.back();
    } catch (error) {
      if (error.response.status === 403) this.setState({wrongPassword: true});
      else this.setState({'error': true});
      this.setState({changing: false});
    }
  }

  onCancel() {
    window.history.back();
  }

  render() {
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

    // Old Password
    let currentWarning = <p className={styles.Warning}>
      Incorrect password
    </p>;
    let currentPassword = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Current Password</h1>
      <Input.Password className={styles.Content} placeholder={'Current Password'}
                      onChange={this.onCurrentChange} value={this.state.currentPassword}/>
      {this.state.wrongPassword ? currentWarning : null}
    </div>;

    // New Password
    let newPassword = <div className={styles.EditItem}>
      <h1 className={styles.Title}>New Password</h1>
      <Input.Password className={styles.Content} placeholder={'New Password'}
                      onChange={this.onNewChange} value={this.state.newPassword}/>
    </div>;

    // Confirm Password
    let confirmWarning = <p className={styles.Warning}>
      Password does not match
    </p>;
    let confirmPassword = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Confirm Password</h1>
      <Input.Password className={styles.Content} placeholder={'Confirm Password'}
                      onChange={this.onConfirmChange} value={this.state.confirmPassword}/>
      {this.state.unmatchPassword ? confirmWarning : null}
    </div>;

    // Change Password
    let change = <React.Fragment>
      <div className={styles.Gap}/>
      <div className={styles.Button}>
        <Button type={'primary'} block size={'large'}
                onClick={this.onChange} loading={this.state.changing}
                disabled={!this.state.currentPassword || !this.state.newPassword || !this.state.confirmPassword}>
          Change Password
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
        <div className={styles.ChangePassword}>
          {currentPassword}
          {newPassword}
          {confirmPassword}
          {change}
          {cancel}
        </div>
      </React.Fragment>
    )
  }
}