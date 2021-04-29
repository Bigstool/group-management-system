import React from "react";
import PropTypes from "prop-types";
import {Button, Tag, Row, Col, Divider, Comment, Avatar, Form, Input, List} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import './EditGroupProfile.scss';
import {AuthContext} from "../utilities/AuthProvider";

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
      isAdmin: false,
      // Group related
      groupUuid: '',  // TODO: this.props.match.params["uuid"]
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

  // TODO: check whether user has permission to access this page: role and stage
  render() {
    // App Bar
    let appBar = <AppBar/>;

    // Name (Group Owner) (Before Grouping DDL) or (Admin) (All Stages)
    let name = <React.Fragment>
      <div className={'edit-item'}>
        <h1 className={'title'}>Group Name<span className={'required'}>*</span></h1>
        <Input className={'content'} onChange={this.onNameChange}
               value={this.state.name} maxLength={this.state.nameLimit}
               disabled={!this.state.isAdmin && this.state.afterGroupingDDL}/>
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
      <h1 className={'title'}>Short description</h1>
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
      <Button type={'primary'} block size={'large'}
              disabled={!this.state.name || !this.state.title}>
        Save
      </Button>
    </React.Fragment>;

    let Cancel = <React.Fragment>
      <div className={'gap'} />
      <Button block size={'large'}>Cancel</Button>
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