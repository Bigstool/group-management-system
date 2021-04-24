import React from "react";
import PropTypes from "prop-types";
import {Button, Divider} from 'antd';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import './GroupConfig.scss';

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class GroupConfig extends React.Component {
  static propType = {
    // user list
    'userList': PropTypes.array,  // TODO: isRequired
  }

  constructor(props) {
    super(props);
    this.state = {
      // TODO: initial state
    }

  }

  render() {
    let isMember = false, isOwner = true, isAdmin = false;
    let afterGroupingDDL = false, afterProposalDDL = false;
    let isApproved = false, isSubmitted = false, isFull = true;

    // All Set (Member) (After Grouping DDL)
    if (isMember && afterGroupingDDL) return (
      <React.Fragment>
        <AppBar/>
        <h1>You're all set!</h1>
        <h3>Good luck with your project :)</h3>
      </React.Fragment>
    );

    // Group Profile (Group Owner and Admin) (All stages)
    let profile = null;
    if (isOwner || isAdmin) {
      profile = <React.Fragment>
        <Button type={'primary'} block size={'large'}>Edit Group Profile</Button>
        <br/>
        <br/>
      </React.Fragment>;
    }

    // Member Management (Group Owner) (Before Grouping DDL)
    let memberManagement = null;
    if (isOwner && !afterGroupingDDL) {
      memberManagement = <React.Fragment>
        <Button block size={'large'}>Manage Group Members</Button>
        <Button block size={'large'}>Manage Join Applications</Button>
        <br/>
        <br/>
      </React.Fragment>;
    }


    // DELAYED: Showcase (Group Owner) (After Proposal DDL)
    let showcase = null;
    if (isOwner && afterProposalDDL) {
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
    if (isMember && !afterGroupingDDL) {
      cautionZone.push(
        <Button danger block size={'large'} key={'leave-group'}>
          Leave Group
        </Button>
      );
    }
    // Full (Group Owner) (Before Grouping DDL) (Available when Member Limits Reached)
    // TODO: disable the button when not enough group members
    if (isOwner && !afterGroupingDDL) {
      cautionZone.push(
        <Button danger block size={'large'} key={'full'}>
          {isFull ? `Unmark Group as Full` : `Mark Group as Full`}
        </Button>
      );
    }
    // Submit (Group Owner) (After Grouping DDL) (Before Approve)
    if (isOwner && afterGroupingDDL && !isApproved) {
      cautionZone.push(
        <Button danger block size={'large'} key={'submit'}>
          {isSubmitted ? 'Revert Submission' : 'Submit Project for Approval'}
        </Button>
      );
    }
    // Approve (Admin) (After Proposal DDL) (Submitted)
    if (isAdmin && afterProposalDDL && isSubmitted) {
      cautionZone.push(
        <Button danger block size={'large'} key={'approve'}>
          Approve Proposal
        </Button>
      );
    }
    // Transfer Ownership (Group Owner or Admin) (All stages)
    if (isOwner || isAdmin) {
      cautionZone.push(<Button danger block size={'large'} key={'transfer-ownership'}>
        Transfer Group Owner
      </Button>);
    }
    // Dismiss Group (Group Owner) (Before Grouping DDL) or (Admin) (Before Proposal DDL)
    if ((isOwner && !afterGroupingDDL) || (isAdmin && !afterProposalDDL)) {
      cautionZone.push(
        <Button danger block size={'large'} key={'dismiss-group'}>
          Dismiss Group
        </Button>
      );
    }

    return (
      <React.Fragment>
        <AppBar/>
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