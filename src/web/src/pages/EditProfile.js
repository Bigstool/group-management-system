import React from "react";
import PropTypes from "prop-types";
import {Button, Card, Input} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './EditProfile.scss';
import {AuthContext} from "../utilities/AuthProvider";
import Avatar from "react-avatar";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class EditProfile extends React.Component {
  static propTypes = {
    // null
  }
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userUuid: this.context.getUser()['uuid'],
      userRole: this.context.getUser()['role'],
      isAdmin: false,
      name: '',
      email: '',
      bio: '',
      nameLimit: 50,
      emailLimit: 75,
      bioLimit: 300,
      // Component related
      loading: true,
      error: false,
      // Event related
      saving: false,
    }
  }

  async componentDidMount() {
    await this.checkUser();
    this.setState({loading: false});
  }

  // Retrieves user profile and updates this.state
  @boundMethod
  async checkUser() {
    try {
      let res = await this.context.request({
        path: `/user/${this.state.userUuid}`,
        method: 'get'
      });
      let userProfile = res.data['data'];

      // update name, title, description, proposal
      this.setState({
        name: userProfile['alias'],
        email: userProfile['email'],
        bio: userProfile['bio'],
      })

      // update isAdmin
      if (this.state.userRole === 'ADMIN') this.setState({isAdmin: true});
      else this.setState({isAdmin: false});

    } catch (error) {
      this.setState({
        'error': true
      });
    }
  }

  @boundMethod
  onNameChange(event) {
    this.setState({name: event.target.value});
  }

  @boundMethod
  onEmailChange(event) {
    this.setState({email: event.target.value});
  }

  @boundMethod
  onBioChange(event) {
    this.setState({bio: event.target.value});
  }

  @boundMethod
  async onSave() {
    this.setState({saving: true});
    let data;
    if (this.state.isAdmin) {
      data = {
        alias: this.state.name,
        email: this.state.email,
        bio: this.state.bio,
      };
    } else {
      data = {
        bio: this.state.bio,
      };
    }
    try {
      await this.context.request({
        path: `/user/${this.state.userUuid}`,
        method: "patch",
        data: data,
      });

      window.history.back();
    } catch (error) {  // If failed, set saving to false
      this.setState({saving: false});
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

    // Photo
    let photo = <div>
      <Card.Meta avatar={<Avatar size={64} round={true} name={this.state.name}/>}/>
      <div className={styles.Gap}/>
    </div>;

    // Name
    let name = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Name</h1>
      <Input className={styles.Content} onChange={this.onNameChange}
             value={this.state.name} maxLength={this.state.nameLimit}
             disabled={!this.state.isAdmin}/>
    </div>;

    // Email
    let email = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Email</h1>
      <Input className={styles.Content} onChange={this.onEmailChange}
             value={this.state.email} maxLength={this.state.emailLimit}
             disabled={!this.state.isAdmin}/>
    </div>

    // Bio
    let bio = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Bio</h1>
      <Input.TextArea showCount className={styles.Content} rows={5} onChange={this.onBioChange}
                      value={this.state.bio} maxLength={this.state.bioLimit}/>
      <div className={styles.Gap} />
    </div>;

    // Save
    let save = <React.Fragment>
      <div className={styles.Gap} />
      <div className={styles.Gap} />
      <Button type={'primary'} block size={'large'} onClick={this.onSave}>
        Save
      </Button>
    </React.Fragment>;

    // Cancel
    let cancel = <React.Fragment>
      <div className={styles.Gap} />
      <Button block size={'large'} onClick={this.onCancel}>Cancel</Button>
    </React.Fragment>;

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.EditProfile}>
          <div>
            {photo}
            {name}
          </div>
          {email}
          {bio}
          {save}
          {cancel}
        </div>
      </React.Fragment>
    );
  }
}