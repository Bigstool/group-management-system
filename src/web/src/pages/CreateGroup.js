import React from "react";
import PropTypes from "prop-types";
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import GroupProfileForm from "../components/GroupProfileForm";
import ErrorMessage from "../components/ErrorMessage";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class CreateGroup extends React.Component {
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
      // Group related
      name: '',
      title: '',
      description: '',
      proposal: '',
      // Component related
      loading: true,
      error: false,
      redirect: false,
      push: false,
      // Event related
      saving: false,
    }
  }

  async componentDidMount() {
    // Check whether user has permission to access this page
    let isPermitted = await this.isPermitted();
    if (!isPermitted) {
      this.setState({
        'redirect': '/',
        'push': false,
      });
    }

    this.setState({loading: false});
  }

  /**
   * Checks whether the user has the permission to access this page
   * @returns {Promise<boolean>} true if the user has the permission, false otherwise
   */
  @boundMethod
  async isPermitted() {
    // Check user: whether is in any group
    try {
      let res = await this.context.request({
        path: `/user/${this.state.userUuid}`,
        method: 'get'
      });
      let userProfile = res.data['data'];

      if (userProfile['created_group']) return false;
      if (userProfile['joined_group']) return false;
    } catch (error) {
      this.setState({
        'error': true
      });
    }

    // Check role: whether is an admin
    if (this.state.userRole === 'ADMIN') return false;

    // Check system: whether after Grouping DDL
    let sysConfig = await this.context.getSysConfig();
    let groupingDDL = sysConfig["system_state"]["grouping_ddl"];
    if ((Date.now() / 1000) > groupingDDL) return false;

    // Check passed, user is permitted, return true
    return true;
  }

  @boundMethod
  onNameChange(event) {
    this.setState({name: event.target.value});
  }

  @boundMethod
  onTitleChange(event) {
    this.setState({title: event.target.value});
  }

  @boundMethod
  onDescriptionChange(event) {
    this.setState({description: event.target.value});
  }

  @boundMethod
  onProposalChange(event) {
    this.setState({proposal: event.target.value});
  }

  @boundMethod
  async onSave() {
    this.setState({saving: true});
    try {
      await this.context.request({
        path: `/group`,
        method: "post",
        data: {
          name: this.state.name,
          title: this.state.title,
          description: this.state.description,
          proposal: this.state.proposal,
        }
      });
      // If success, redirect to Group Details
      let userProfile = await this.context.getUserProfile(false);
      this.setState({
        redirect: `/group/${userProfile['created_group']['uuid']}`,
        push: false,
      });
    } catch (error) {  // If failed, set saving to false
      this.setState({saving: false});
    }
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

    return (
      <React.Fragment>
        {appBar}
        <GroupProfileForm name={this.state.name} title={this.state.title}
                          description={this.state.description} proposal={this.state.proposal}
                          onNameChange={this.onNameChange} onTitleChange={this.onTitleChange}
                          onDescriptionChange={this.onDescriptionChange} onProposalChange={this.onProposalChange}
                          onSave={this.onSave} onCancel={this.onCancel}
                          saving={this.state.saving}
                          disableName={false}/>
      </React.Fragment>
    );
  }
}