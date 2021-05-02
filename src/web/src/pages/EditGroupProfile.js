import React from "react";
import PropTypes from "prop-types";
import {Button, Input} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './EditGroupProfile.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import GroupProfileForm from "../components/GroupProfileForm";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class EditGroupProfile extends React.Component {
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
      isOwner: false,
      isAdmin: false,
      // Group related
      groupUuid: this.props.match.params["uuid"],
      name: '',
      title: '',
      description: '',
      proposal: '',
      nameLimit: 20,
      titleLimit: 80,
      descriptionLimit: 150,
      proposalLimit: 300,
      // System related
      groupingDDL: 0,  // get from context
      afterGroupingDDL: false,
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
    await this.checkSysConfig();
    await this.checkGroupInfo();
    // Check whether user has permission to access this page
    if (!this.state.isOwner && !this.state.isAdmin) {
      this.setState({
        'redirect': '/',
        'push': false,
      });
    }
    this.setState({loading: false});
  }

  // Retrieves system config and updates this.state
  @boundMethod
  async checkSysConfig() {
    let sysConfig = await this.context.getSysConfig();
    this.setState({
      groupingDDL: sysConfig["system_state"]["grouping_ddl"],
    });
    // update afterGroupingDDL
    if (Date.now() > this.state.groupingDDL) this.setState({afterGroupingDDL: true});
    else this.setState({afterGroupingDDL: false});
  }

  // Retrieves group info and updates this.state
  @boundMethod
  async checkGroupInfo() {
    try {
      let res = await this.context.request({
        path: `/group/${this.state.groupUuid}`,
        method: 'get'
      });
      let groupInfo = res.data['data'];

      // update name, title, description, proposal
      this.setState({
        name: groupInfo['name'],
        title: groupInfo['title'],
        description: groupInfo['description'],
        proposal: groupInfo['proposal'],
      })

      // update isOwner
      if (groupInfo['owner']['uuid'] === this.state.userUuid) this.setState({isOwner: true});
      else this.setState({isOwner: false});

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
        path: `/group/${this.state.groupUuid}`,
        method: "patch",
        data: {
          name: this.state.name,
          title: this.state.title,
          description: this.state.description,
          proposal: this.state.proposal,
        }
      });
      // If success, redirect to Group Details (Wait for app bar support)
      this.setState({
        redirect: `/group/${this.state.groupUuid}`,
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

    return (
      <React.Fragment>
        {appBar}
        <GroupProfileForm name={this.state.name} title={this.state.title}
                          description={this.state.description} proposal={this.state.proposal}
                          onNameChange={this.onNameChange} onTitleChange={this.onTitleChange}
                          onDescriptionChange={this.onDescriptionChange} onProposalChange={this.onProposalChange}
                          onSave={this.onSave} onCancel={this.onCancel}
                          saving={this.state.saving}
                          disableName={this.state.isOwner && this.state.afterGroupingDDL}/>
      </React.Fragment>
    );
  }
}