import React from "react";
import PropTypes from "prop-types";
import {Button, Tag, Row, Col, Divider, Comment, Avatar, Form, Input, List} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import './EditGroupProfile.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class AccountProfile extends React.Component {
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
      // TODO: If success, redirect to Group Details (Wait for app bar support)
      // this.setState({
      //   redirect: `/group/${this.state.groupUuid}`,
      //   push: false,
      // });
      // TODO: Remove. (Currently redirecting to Group Config)
      window.history.back();
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

    // Name (Group Owner) (Before Grouping DDL) or (Admin) (All Stages)
    let name = <React.Fragment>
      <div className={'edit-item'}>
        <h1 className={'title'}>Group Name<span className={'required'}>*</span></h1>
        <Input className={'content'} onChange={this.onNameChange}
               value={this.state.name} maxLength={this.state.nameLimit}
               disabled={this.state.isOwner && this.state.afterGroupingDDL}/>
      </div>
    </React.Fragment>

    // Title (Group Owner or Admin) (All Stages)
    let title = <React.Fragment>
      <div className={'edit-item'}>
        <h1 className={'title'}>Title<span className={'required'}>*</span></h1>
        <Input className={'content'} onChange={this.onTitleChange}
               value={this.state.title} maxLength={this.state.titleLimit}/>
      </div>
    </React.Fragment>

    // Description (Group Owner or Admin) (All Stages)
    let description = <div className={'edit-item'}>
      <h1 className={'title'}>Short description<span className={'required'}>*</span></h1>
      <p className={'description'}>
        Briefly describe your project in 1-2 sentences.
        This will be shown on the home page.
      </p>
      <Input.TextArea showCount className={'content'} rows={2} onChange={this.onDescriptionChange}
                      value={this.state.description} maxLength={this.state.descriptionLimit}/>
      <div className={'gap'} />
    </div>

    // Proposal (Group Owner or Admin) (All Stages)
    let proposal = <div className={'edit-item'}>
      <h1 className={'title'}>Proposal</h1>
      <Input.TextArea showCount className={'content'} rows={5} onChange={this.onProposalChange}
                      value={this.state.proposal} maxLength={this.state.proposalLimit}/>
      <div className={'gap'} />
    </div>

    let Save = <React.Fragment>
      <div className={'gap'} />
      <div className={'gap'} />
      <Button type={'primary'} block size={'large'} onClick={this.onSave}
              disabled={!this.state.name || !this.state.title || !this.state.description}>
        Save
      </Button>
    </React.Fragment>;

    let Cancel = <React.Fragment>
      <div className={'gap'} />
      <Button block size={'large'} onClick={this.onCancel}>Cancel</Button>
    </React.Fragment>;

    return (
      <React.Fragment>
        {appBar}
        <div className={'edit-group-profile'}>
          {name}
          {title}
          {description}
          {proposal}
          {Save}
          {Cancel}
        </div>
      </React.Fragment>
    );
  }
}