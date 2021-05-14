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
import ErrorMessage from "../components/ErrorMessage";

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
      isSubmitted: false,
      isApproved: false,
      name: '',
      title: '',
      description: '',
      proposal: '',
      newName: '',
      newTitle: '',
      newDescription: '',
      newProposal: '',
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
    if ((!this.state.isOwner && !this.state.isAdmin) ||
      (this.state.isOwner && (this.state.isApproved || this.state.isSubmitted))) {
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
    if ((Date.now() / 1000) > this.state.groupingDDL) this.setState({afterGroupingDDL: true});
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
        isSubmitted: groupInfo['proposal_state'] === 'SUBMITTED',
        isApproved: groupInfo['proposal_state'] === 'APPROVED',
        name: groupInfo['name'],
        title: groupInfo['title'],
        description: groupInfo['description'],
        proposal: groupInfo['proposal'],
        newName: groupInfo['name'],
        newTitle: groupInfo['title'],
        newDescription: groupInfo['description'],
        newProposal: groupInfo['proposal'],
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
    this.setState({newName: event.target.value});
  }

  @boundMethod
  onTitleChange(event) {
    this.setState({newTitle: event.target.value});
  }

  @boundMethod
  onDescriptionChange(event) {
    this.setState({newDescription: event.target.value});
  }

  @boundMethod
  onProposalChange(event) {
    this.setState({newProposal: event.target.value});
  }

  @boundMethod
  async onSave() {
    this.setState({saving: true});
    let data = {};
    if (!(this.state.isOwner && this.state.afterGroupingDDL) && this.state.name !== this.state.newName)
      data['name'] = this.state.newName;
    if (this.state.title !== this.state.newTitle) data['title'] = this.state.newTitle;
    if (this.state.description !== this.state.newDescription) data['description'] = this.state.newDescription;
    if (this.state.proposal !== this.state.newProposal) data['proposal'] = this.state.newProposal;
    try {
      await this.context.request({
        path: `/group/${this.state.groupUuid}`,
        method: "patch",
        data: data,
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
    let appBar = <AppBar backTo={`/group/${this.state.groupUuid}/config`}/>;

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
        <GroupProfileForm name={this.state.newName} title={this.state.newTitle}
                          description={this.state.newDescription} proposal={this.state.newProposal}
                          onNameChange={this.onNameChange} onTitleChange={this.onTitleChange}
                          onDescriptionChange={this.onDescriptionChange} onProposalChange={this.onProposalChange}
                          onSave={this.onSave} onCancel={this.onCancel}
                          saving={this.state.saving}
                          disableSave={this.state.name === this.state.newName &&
                          this.state.title === this.state.newTitle &&
                          this.state.description === this.state.newDescription &&
                          this.state.proposal === this.state.newProposal}
                          disableName={this.state.isOwner && this.state.afterGroupingDDL}/>
      </React.Fragment>
    );
  }
}