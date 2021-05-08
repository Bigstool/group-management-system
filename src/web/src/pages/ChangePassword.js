import React from "react";
import {Button, Input} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ChangePassword.scss';
import {AuthContext} from "../utilities/AuthProvider";
import Avatar from "react-avatar";
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
    this.setState({currentPassword: event.target.value});
  }

  @boundMethod
  onNewChange(event) {
    this.setState({newPassword: event.target.value});
  }

  @boundMethod
  onConfirmChange(event) {
    this.setState({confirmPassword: event.target.value});
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
                onClick={this.onChange} loading={this.state.changing}>
          Save
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