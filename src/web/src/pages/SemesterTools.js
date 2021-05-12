import React from "react";
import {Space, Button, InputNumber, DatePicker, Input} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './SemesterTools.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import moment from 'moment';
import SHA1 from "crypto-js/sha1";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class SemesterTools extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userRole: this.context.getUser()['role'],
      // Students related
      isImported: false,
      // System related
      sizeLower: 0,
      sizeUpper: 0,
      groupingDDL: null,
      proposalDDL: null,
      afterGroupingDDL: false,
      afterProposalDDL: false,
      newSizeLower: 0,
      newSizeUpper: 0,
      newGroupingDDL: 0,
      newProposalDDL: 0,
      // Archive related
      archiveName: '',
      archiveNameLimit: 50,
      // Component related
      loading: true,
      error: false,
      redirect: false,
      push: false,
      // Event related
      importing: false,
      downloading: false,
      adjustingSize: false,
      adjustingGrouping: false,
      adjustingProposal: false,
      adjustingArchive: false,
      savingArchive: false,
      duplicateArchive: false,
    }
  }

  async componentDidMount() {
    await this.checkImport();
    await this.checkSystem();
    console.debug(this.state);
    this.setState({loading: false});
  }

  @boundMethod
  async checkImport() {
    // TODO: use sysConfig instead (wait for backend implementation)
    try {
      let res = await this.context.request({
        path: `/user`,
        method: 'get',
      });

      let userList = res.data['data'];
      if (userList.length === 0) this.setstate({isImported: false,});
      else this.setState({isImported: true});
    } catch (error) {
      this.setState({error: true,});
    }
  }

  @boundMethod
  async checkSystem() {
    let sysConfig = await this.context.getSysConfig();
    let groupingDDL = sysConfig['system_state']['grouping_ddl'];
    let proposalDDL = sysConfig['system_state']['proposal_ddl'];
    this.setState({
      sizeLower: sysConfig['group_member_number'][0],
      sizeUpper: sysConfig['group_member_number'][1],
      newSizeLower: sysConfig['group_member_number'][0],
      newSizeUpper: sysConfig['group_member_number'][1],
      groupingDDL: groupingDDL,
      proposalDDL: proposalDDL,
      afterGroupingDDL: groupingDDL ? (Date.now() / 1000) > groupingDDL : false,
      afterProposalDDL: proposalDDL ? (Date.now() / 1000) > proposalDDL: false,
      newGroupingDDL: groupingDDL ? groupingDDL : this.momentToTimestamp(moment().add(10, 'days')),
      newProposalDDL: proposalDDL ? proposalDDL : this.momentToTimestamp(moment().add(20, 'days')),
    });
  }

  /**
   * Convert a moment object to Unix timestamp
   * Seconds and milliseconds will be omitted
   * @param momentObj {moment} A moment object
   * @returns {number} Converted Unix timestamp
   */
  momentToTimestamp(momentObj) {
    momentObj.set({second: 0, millisecond: 0});
    return momentObj.unix();
  }

  /**
   * Convert a Unix timestamp to a moment object
   * @param timestamp {number} A Unix timestamp
   * @returns {moment} Converted moment object
   */
  timestampToMoment(timestamp) {
    return moment.unix(timestamp);
  }

  @boundMethod
  onSize() {
    this.setState({adjustingSize: !this.state.adjustingSize});
  }

  @boundMethod
  onLowerChange(event) {
    this.setState({newSizeLower: event});
  }

  @boundMethod
  onUpperChange(event) {
    this.setState({newSizeUpper: event});
  }

  @boundMethod
  onSaveSize() {
    // TODO
  }

  @boundMethod
  onGrouping() {
    this.setState({adjustingGrouping: !this.state.adjustingGrouping});
  }

  @boundMethod
  onGroupingChange(event) {
    this.setState({newGroupingDDL: this.momentToTimestamp(event)});
  }

  @boundMethod
  onSaveGrouping() {
    // TODO
  }

  @boundMethod
  onProposal() {
    this.setState({adjustingProposal: !this.state.adjustingProposal});
  }

  @boundMethod
  onProposalChange(event) {
    this.setState({newProposalDDL: this.momentToTimestamp(event)});
  }

  @boundMethod
  onSaveProposal() {
    // TODO
  }

  @boundMethod
  onArchive() {
    this.setState({adjustingArchive: !this.state.adjustingArchive});
  }

  @boundMethod
  onArchiveChange(event) {
    this.setState({
      duplicateArchive: false,
      archiveName: event.target.value,
    });
  }

  @boundMethod
  async onSaveArchive() {
    this.setState({savingArchive: true});
    try {
      await this.context.request({
        path: `/semester/archived`,
        method: 'post',
        data: {
          name: this.state.archiveName,
        },
      });
      // TODO: to archives
      window.history.back();
    } catch (error) {
      if (error.response.status === 409) this.setState({duplicateArchive: true});
    }
    this.setState({savingArchive: false});
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

    // Import Students (Before Import)/View Students (After Import)
    let studentsCheckDDL = !this.state.groupingDDL || !this.state.proposalDDL;
    let studentsButton = <Button type={'primary'} block size={'large'}
                                 disabled={studentsCheckDDL}
                                 onClick={null}>
      {this.state.isImported ? 'View Students' : 'Import Students'}
    </Button>;
    let studentsWarning = null;
    if (studentsCheckDDL) {
      studentsWarning = <p className={styles.Warning}>
        Please set the deadlines before importing<br/>You may change the deadlines later
      </p>;
    }
    let students = <div className={styles.ToolItem}>
      {studentsButton}
      {studentsWarning}
    </div>

    // Download Students List (After Import)
    let download = <Button block size={'large'} className={styles.ToolItem}
                           disabled={!this.state.isImported} onClick={null}>
      Download Student Credentials
    </Button>;

    // Group Size (?)
    let sizeButton = <Button block size={'large'}
                             disabled={this.state.afterGroupingDDL}
                             onClick={this.onSize}>
      {`Group Size: ${this.state.sizeLower} - ${this.state.sizeUpper}`}
    </Button>;
    let adjustSize = <div className={styles.Adjust}>
      <Space>
        <InputNumber min={1} max={this.state.newSizeUpper} value={this.state.newSizeLower}
                     onChange={this.onLowerChange}/>
        <p>-</p>
        <InputNumber min={this.state.newSizeLower} value={this.state.newSizeUpper}
                     onChange={this.onUpperChange}/>
        <Button type={'primary'} onClick={this.onSaveSize} className={styles.Save}
                disabled={(this.state.sizeLower === this.state.newSizeLower &&
                  this.state.sizeUpper === this.state.newSizeUpper) ||
                (this.state.newSizeLower < 1) || (this.state.newSizeLower > this.state.newSizeUpper)}>
          Save
        </Button>
      </Space>
    </div>;
    let size;
    if (!this.state.adjustingSize) {
      size = <div className={styles.ToolItem}>{sizeButton}</div>;
    } else {
      size = <div className={styles.ToolItem}>
        {sizeButton}
        {adjustSize}
      </div>
    }

    // Grouping DDL (Before Grouping DDL)
    let groupingButton = <Button block size={'large'}
                                 disabled={this.state.afterGroupingDDL}
                                 onClick={this.onGrouping}>
      {`Grouping DDL: ${!this.state.groupingDDL ? 'Not Set' : moment.unix(this.state.groupingDDL).format('YYYY-MM-DD HH:mm')}`}
    </Button>;
    let groupingCheckAfterNow = this.state.newGroupingDDL <= (Date.now() / 1000);
    let groupingCheckBeforeProposal = this.state.proposalDDL && this.state.newGroupingDDL >= this.state.proposalDDL;
    let adjustGrouping = <div className={styles.Adjust}>
      <Space>
        <DatePicker showTime showNow={false} format={'YYYY-MM-DD HH:mm'}
                    value={this.timestampToMoment(this.state.newGroupingDDL)}
                    onOk={this.onGroupingChange} allowClear={false}/>
        <Button type={'primary'} onClick={this.onSaveGrouping}
                disabled={(this.state.groupingDDL === this.state.newGroupingDDL) ||
                groupingCheckAfterNow || groupingCheckBeforeProposal}>
          Save
        </Button>
      </Space>
    </div>;
    let groupingWarning = null;
    if (groupingCheckAfterNow) {
      groupingWarning = <p className={styles.Warning}>
        The Grouping DDL must be after the current time
      </p>
    } else if (groupingCheckBeforeProposal) {
      groupingWarning = <p className={styles.Warning}>
        The Grouping DDL must be before the Proposal DDL
      </p>
    }
    let grouping;
    if (!this.state.adjustingGrouping) {
      grouping = <div className={styles.ToolItem}>{groupingButton}</div>;
    } else {
      grouping = <div className={styles.ToolItem}>
        {groupingButton}
        {adjustGrouping}
        {groupingWarning}
      </div>
    }

    // Proposal DDL (Before Proposal DDL)
    let proposalButton = <Button block size={'large'}
                                 disabled={this.state.afterProposalDDL}
                                 onClick={this.onProposal}>
      {`Proposal DDL: ${!this.state.proposalDDL ? 'Not Set' : moment.unix(this.state.proposalDDL).format('YYYY-MM-DD HH:mm')}`}
    </Button>;
    let proposalCheckAfterGrouping = this.state.groupingDDL && this.state.newProposalDDL <= this.state.groupingDDL;
    let adjustProposal = <div className={styles.Adjust}>
      <Space>
        <DatePicker showTime showNow={false} format={'YYYY-MM-DD HH:mm'}
                    value={this.timestampToMoment(this.state.newProposalDDL)}
                    onOk={this.onProposalChange} allowClear={false}/>
        <Button type={'primary'} onClick={this.onSaveProposal}
                disabled={(this.state.proposalDDL === this.state.newProposalDDL) ||
                proposalCheckAfterGrouping}>
          Save
        </Button>
      </Space>
    </div>;
    let proposalWarning = null;
    if (proposalCheckAfterGrouping) {
      proposalWarning = <p className={styles.Warning}>
        The Proposal DDL must be after the Grouping DDL
      </p>;
    }
    let proposal;
    if (!this.state.adjustingProposal) {
      proposal = <div className={styles.ToolItem}>{proposalButton}</div>;
    } else {
      proposal = <div className={styles.ToolItem}>
        {proposalButton}
        {adjustProposal}
        {proposalWarning}
      </div>;
    }

    // Group Allocation (After Grouping DDL and Before Proposal DDL)
    let allocation = <Button block size={'large'} className={styles.ToolItem}
                             disabled={!this.state.afterGroupingDDL || this.state.afterProposalDDL}
                             onClick={null}>
      Group Allocation
    </Button>;

    // Archive Semester (After Import)
    let archiveButton = <Button danger block size={'large'} onClick={this.onArchive}>
      Archive Semester
    </Button>;
    let adjustArchive = <div className={styles.Adjust}>
      <Space>
        <Input onChange={this.onArchiveChange} value={this.state.archiveName}
               maxLength={this.state.archiveNameLimit} placeholder={'Archive Name'}/>
        <Button type={'primary'} onClick={this.onSaveArchive}
                disabled={!this.state.archiveName} loading={this.state.savingArchive}>
          Save
        </Button>
      </Space>
    </div>;
    let archiveWarning = null;
    if (this.state.duplicateArchive) {
      archiveWarning = <p className={styles.Warning}>
        Duplicate archive name
      </p>;
    }
    let archive;
    if (!this.state.adjustingArchive) {
      archive = <div className={styles.ToolItem}>{archiveButton}</div>;
    } else {
      archive = <div className={styles.ToolItem}>
        {archiveButton}
        {adjustArchive}
        {archiveWarning}
      </div>;
    }

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.SemesterTools}>
          {students}
          {download}
          {size}
          {grouping}
          {proposal}
          {allocation}
          {archive}
        </div>
      </React.Fragment>
    );
  }
}
