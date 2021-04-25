import React from "react";
import PropTypes from "prop-types";
import {Button, Divider} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import './GroupConfig.scss';
import {AuthContext} from "../utilities/AuthProvider";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class GroupConfig extends React.Component {
  static propTypes = {
    // null
  }
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.userUuid = this.context.getUser()['uuid'];
    this.userRole = this.context.getUser()['role'];
    this.groupingDDL = 1618054160  // TODO: get from context (wait for implementation)
    this.proposalDDL = 1618054160  // TODO: get from context (wait for implementation)
    this.state = {
      // User related
      'isMember': false,
      'isOwner': false,
      'isAdmin': false,
      // System related
      'afterGroupingDDL': false,
      'afterProposalDDL': false,
      // Group related
      'isApproved': false,
      'isSubmitted': false,
      'isFull': false,
      // Component related
      'loading': true,
      'error': false
    }
  }

  async componentDidMount() {
    await this.checkGroupInfo();
    this.setState({'loading': false});
  }

  // Retrieves group info and updates this.state
  @boundMethod
  async checkGroupInfo() {
    try {
      let res = await this.context.request({
        url: `/group/${this.props.match.params["uuid"]}`,
        method: 'get'
      });
      let groupInfo = res.data['data'];

      // update isMember
      let found = false;
      for (let i = 0; i < groupInfo['member'].length; i++) {
        if (groupInfo['member'][i]['uuid'] === this.userUuid) {
          found = true;
          break;
        }
      }
      if (found) this.setState({'isMember': true});
      else this.setState({'isMember': false});

      // update isOwner
      if (groupInfo['owner']['uuid'] === this.userUuid) this.setState({'isOwner': true});
      else this.setState({'isOwner': false});

      // update isAdmin
      if (this.userRole === 'ADMIN') this.setState({'isAdmin': true});
      else this.setState({'isAdmin': false});

      // update afterGroupingDDL
      if (Date.now() > this.groupingDDL) this.setState({'afterGroupingDDL': true});
      else this.setState({'afterGroupingDDL': false});

      // update afterProposalDDL
      if (Date.now() > this.proposalDDL) this.setState({'afterProposalDDL': true});
      else this.setState({'afterProposalDDL': false});

      // update isApproved
      if (groupInfo['proposal_state'] === 'APPROVED') this.setState({'isApproved': true});
      else this.setState({'isApproved': false});

      // update isSubmitted
      if (groupInfo['proposal_state'] === 'SUBMITTED') this.setState({'isSubmitted': true});
      else this.setState({'isSubmitted': false});

      // update isFull
      if (!groupInfo['application_enabled']) this.setState({'isFull': true});
      else this.setState({'isFull': false});

    } catch (error) {
      this.setState({
        'error': true
      });
    }
  }

  render() {
    // App Bar
    let appBar = <AppBar/>;

    // TODO: loading and error handling
    if (this.state.error) {
      return (
        <React.Fragment>
          {appBar}
          <h1>Oops, something went wrong</h1>
          <h3>Please try reloading</h3>
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

    // All Set (Member) (After Grouping DDL)
    if (this.state.isMember && this.state.afterGroupingDDL) return (
      <React.Fragment>
        {appBar}
        <h1>You're all set!</h1>
        <h3>Good luck with your project :)</h3>
      </React.Fragment>
    );

    // Group Profile (Group Owner and Admin) (All stages)
    let profile = null;
    if (this.state.isOwner || this.state.isAdmin) {
      profile = <React.Fragment>
        <Button type={'primary'} block size={'large'}>Edit Group Profile</Button>
        <br/>
        <br/>
      </React.Fragment>;
    }

    // Member Management (Group Owner) (Before Grouping DDL)
    let memberManagement = null;
    if (this.state.isOwner && !this.state.afterGroupingDDL) {
      memberManagement = <React.Fragment>
        <Button block size={'large'}>Manage Group Members</Button>
        <Button block size={'large'}>Manage Join Applications</Button>
        <br/>
        <br/>
      </React.Fragment>;
    }


    // DELAYED: Showcase (Group Owner) (After Proposal DDL)
    let showcase = null;
    if (this.state.isOwner && this.state.afterProposalDDL) {
      showcase = <React.Fragment>
        <Button block size={'large'}>Manage Showcase</Button>
        <br/>
        <br/>
      </React.Fragment>;
    }

    // Caution Zone
    let cautionZone = [];
    cautionZone.push(
      <Divider className={'caution-zone'} orientation="center" plain key={'divider'}>
        Caution Zone
      </Divider>
    );
    // Leave Group (Member) (Before Grouping DDL)
    if (this.state.isMember && !this.state.afterGroupingDDL) {
      cautionZone.push(
        <Button danger block size={'large'} key={'leave-group'}>
          Leave Group
        </Button>
      );
    }
    // Full (Group Owner) (Before Grouping DDL) (Available when Member Limits Reached)
    // TODO: disable the button when not enough group members
    if (this.state.isOwner && !this.state.afterGroupingDDL) {
      cautionZone.push(
        <Button danger block size={'large'} key={'full'}>
          {this.isFull ? `Unmark Group as Full` : `Mark Group as Full`}
        </Button>
      );
    }
    // Submit (Group Owner) (After Grouping DDL) (Before Approve)
    if (this.state.isOwner && this.state.afterGroupingDDL && !this.state.isApproved) {
      cautionZone.push(
        <Button danger block size={'large'} key={'submit'}>
          {this.isSubmitted ? 'Revert Submission' : 'Submit Project for Approval'}
        </Button>
      );
    }
    // Approve (Admin) (After Proposal DDL) (Submitted)
    if (this.state.isAdmin && this.state.afterProposalDDL && this.state.isSubmitted) {
      cautionZone.push(
        <Button danger block size={'large'} key={'approve'}>
          Approve Proposal
        </Button>
      );
    }
    // Transfer Ownership (Group Owner or Admin) (All stages)
    if (this.state.isOwner || this.state.isAdmin) {
      cautionZone.push(<Button danger block size={'large'} key={'transfer-ownership'}>
        Transfer Group Owner
      </Button>);
    }
    // Dismiss Group (Group Owner) (Before Grouping DDL) or (Admin) (Before Proposal DDL)
    if ((this.state.isOwner && !this.state.afterGroupingDDL) || (this.state.isAdmin && !this.state.afterProposalDDL)) {
      cautionZone.push(
        <Button danger block size={'large'} key={'dismiss-group'}>
          Dismiss Group
        </Button>
      );
    }

    return (
      <React.Fragment>
        {appBar}
        <div className={'group-config'}>
          {profile}
          {memberManagement}
          {showcase}
          {cautionZone}
        </div>
      </React.Fragment>
    );
  }
}