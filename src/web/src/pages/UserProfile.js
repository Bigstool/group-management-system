import React from "react";
import PropTypes from "prop-types";
import {Card, Divider} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './UserProfile.scss';
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
export default class UserProfile extends React.Component {
  static propTypes = {
    // null
  }
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      'userUuid': this.props.match.params["uuid"],
      'name': '',
      'email': '',
      'bio': '',
      // Component related
      'loading': true,
      'error': false,
    }
  }

  async componentDidMount() {
    await this.checkUserProfile();
    this.setState({'loading': false});
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
        'bio': userProfile['bio'],
      })
    } catch (error) {
      this.setState({
        'error': true
      });
    }
  }

  render() {
    // App Bar
    let appBar = <AppBar/>

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

    // Title
    let title = <div className={styles.Title}>
      <Card.Meta avatar={<Avatar size={64} round={true} name={this.state.name}/>}
                 title={this.state.name} description={this.state.email}
                 className={styles.Card}/>
    </div>;

    // Bio
    let bio = <div className={styles.Bio}>
      <Divider orientation="left">Bio</Divider>
      <p className={styles.Content}>{this.state.bio}</p>
    </div>;

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.UserProfile}>
          {title}
          {bio}
        </div>
      </React.Fragment>
    );
  }
}