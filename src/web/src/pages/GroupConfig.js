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
    this.state = {
      // User related
      'userUuid': this.context.getUser()['uuid'],
      'userRole': this.context.getUser()['role'],
      'isMember': false,
      'isOwner': false,
      'isAdmin': false,
      // System related
      'groupingDDL': 0,  // get from context
      'proposalDDL': 0,  // get from context
      'afterGroupingDDL': false,
      'afterProposalDDL': false,
      // Group related
      'groupUuid': this.props.match.params["uuid"],
      'isApproved': false,
      'isRejected': false,
      'isSubmitted': false,
      'isFull': false,
      // Component related
      'loading': true,
      'error': false,
      // Event related
      'leaving': false,
      'fulling': false,
      'submitting': false,
      'approving': false,
      'rejecting': false,
      'dismissing': false,
    }
  }

  async componentDidMount() {
    await this.checkSysConfig();
    await this.checkGroupInfo();
    this.setState({'loading': false});
  }

  // Retrieves system config and updates this.state
  @boundMethod
  async checkSysConfig() {
    let sysConfig = await this.context.getSysConfig();
    this.setState({
      'groupingDDL': sysConfig["system_state"]["grouping_ddl"],
      'proposalDDL': sysConfig["system_state"]["proposal_ddl"],
    });
    // update afterGroupingDDL
    if (Date.now() > this.state.groupingDDL) this.setState({'afterGroupingDDL': true});
    else this.setState({'afterGroupingDDL': false});

    // update afterProposalDDL
    if (Date.now() > this.state.proposalDDL) this.setState({'afterProposalDDL': true});
    else this.setState({'afterProposalDDL': false});
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

      // update isMember
      let found = false;
      for (let i = 0; i < groupInfo['member'].length; i++) {
        if (groupInfo['member'][i]['uuid'] === this.state.userUuid) {
          found = true;
          break;
        }
      }
      if (found) this.setState({'isMember': true});
      else this.setState({'isMember': false});

      // update isOwner
      if (groupInfo['owner']['uuid'] === this.state.userUuid) this.setState({'isOwner': true});
      else this.setState({'isOwner': false});

      // update isAdmin
      if (this.state.userRole === 'ADMIN') this.setState({'isAdmin': true});
      else this.setState({'isAdmin': false});

      // update isApproved
      if (groupInfo['proposal_state'] === 'APPROVED') this.setState({'isApproved': true});
      else this.setState({'isApproved': false});

      // update isRejected
      if (groupInfo['proposal_state'] === 'REJECT') this.setState({'isRejected': true});
      else this.setState({'isRejected': false});

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

  // On Leave Group button clicked
  @boundMethod
  async onLeave() {
    this.setState({'leaving': true});

    try {
      await this.context.request({
        path: `/group/${this.state.groupUuid}/member/${this.state.userUuid}`,
        method: "delete",
      });
    } catch (error) {}

    // Route to GroupList
    window.location.replace('/');
  }

  // On Full button clicked
  @boundMethod
  async onFull() {
    this.setState({'fulling': true});

    // if not full, mark as full
    if (!this.state.isFull) {
      try {
        await this.context.request({
          path: `/group/${this.state.groupUuid}`,
          method: "patch",
          data: {
            application_enabled: false,
          }
        });
      } catch (error) {}
    }
    // if full, mark as not full
    else {
      try {
        await this.context.request({
          path: `/group/${this.state.groupUuid}`,
          method: "patch",
          data: {
            application_enabled: true,
          }
        });
      } catch (error) {}
    }
    // finally, update groupInfo and set fulling to false
    await this.checkGroupInfo();
    this.setState({'fulling': false});
  }

  // On Submit button clicked
  @boundMethod
  async onSubmit() {
    this.setState({'submitting': true});

    // if not submitted, submit
    if (!this.state.isSubmitted) {
      try {
        await this.context.request({
          path: `/group/${this.state.groupUuid}`,
          method: "patch",
          data: {
            proposal_state: 'SUBMITTED',
          }
        });
      } catch (error) {}
    }
    // if submitted, revert submission
    else {
      try {
        await this.context.request({
          path: `/group/${this.state.groupUuid}`,
          method: "patch",
          data: {
            proposal_state: 'PENDING',
          }
        });
      } catch (error) {}
    }
    // finally, update groupInfo and set submitting to false
    await this.checkGroupInfo();
    this.setState({'submitting': false});
  }

  // On Approve button clicked
  @boundMethod
  async onApprove() {
    this.setState({'approving': true});
    // Send approve request
    try {
      await this.context.request({
        path: `/group/${this.state.groupUuid}`,
        method: "patch",
        data: {
          proposal_state: 'APPROVED',
        }
      });
    } catch (error) {}
    // Update groupInfo
    await this.checkGroupInfo();
    this.setState({'approving': false});
    // If approved, return to Group Details
    if (this.state.isApproved === true) {
      window.location.assign(`/group/${this.state.groupUuid}`);
    }
  }

  // On Reject button clicked
  @boundMethod
  async onReject() {
    this.setState({'rejecting': true});
    // Send reject request
    try {
      await this.context.request({
        path: `/group/${this.state.groupUuid}`,
        method: "patch",
        data: {
          proposal_state: 'REJECT',
        }
      });
    } catch (error) {}
    // Update groupInfo
    await this.checkGroupInfo();
    this.setState({'rejecting': false});
    // If rejected, return to Group Details
    if (this.state.isRejected === true) {
      window.location.assign(`/group/${this.state.groupUuid}`);
    }
  }

  // On Dismiss button clicked
  @boundMethod
  async onDismiss() {
    this.setState({'dismissing': true});

    try {
      await this.context.request({
        path: `/group/${this.state.groupUuid}`,
        method: "delete",
      });
    } catch (error) {}

    // Route to GroupList
    window.location.replace('/');
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

    // All Set (Member) (After Grouping DDL)
    // TODO: remove !this.state.isOwner (Wait for Issue #55 to be fixed)
    if (!this.state.isOwner && this.state.isMember && this.state.afterGroupingDDL) return (
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
        <Button type={'primary'} block size={'large'}
                disabled={this.state.isAdmin ? false : (this.state.isSubmitted || this.state.isApproved)}>
          Edit Group Profile
        </Button>
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
        <Button danger block size={'large'} key={'leave-group'}
                onClick={this.onLeave} loading={this.state.leaving}>
          Leave Group
        </Button>
      );
    }
    // Full (Group Owner) (Before Grouping DDL)
    if (this.state.isOwner && !this.state.afterGroupingDDL) {
      cautionZone.push(
        <Button danger block size={'large'} key={'full'}
                onClick={this.onFull} loading={this.state.fulling}>
          {this.isFull ? `Enable Join Application` : `Disable Join Application`}
        </Button>
      );
    }
    // Submit (Group Owner) (After Grouping DDL) (Before Approve)
    if (this.state.isOwner && this.state.afterGroupingDDL && !this.state.isApproved) {
      cautionZone.push(
        <Button danger block size={'large'} key={'submit'}
                onClick={this.onSubmit} loading={this.state.submitting}>
          {this.isSubmitted ? 'Revert Submission' : 'Submit Project for Approval'}
        </Button>
      );
    }
    // Approve (Admin) (After Proposal DDL) (Submitted)
    if (this.state.isAdmin && this.state.afterProposalDDL && this.state.isSubmitted) {
      cautionZone.push(
        <Button danger block size={'large'} key={'approve'}
                onClick={this.onApprove} loading={this.state.approving}>
          Approve Proposal
        </Button>
      );
    }
    // Reject (Admin) (After Proposal DDL) (Submitted)
    if (this.state.isAdmin && this.state.afterProposalDDL && this.state.isSubmitted) {
      cautionZone.push(
        <Button danger block size={'large'} key={'reject'}
                onClick={this.onReject} loading={this.state.rejecting}>
          Reject Proposal
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
        <Button danger block size={'large'} key={'dismiss-group'}
                onClick={this.onDismiss} loading={this.state.dismissing}>
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