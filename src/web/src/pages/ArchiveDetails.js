import React from "react";
import {Button, Input, Space} from "antd";
import {LoadingOutlined, FolderOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ArchiveDetails.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class ArchiveDetails extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userRole: this.context.getUser()['role'],
      // Archive related
      archiveUuid: this.props.match.params["uuid"],
      archiveName: '',
      archiveNewName: '',
      archiveLimit: 50,
      // Component related
      loading: true,
      error: false,
      redirect: '',
      push: false,
      // Event related
      adjustingName: false,
      renaming: false,
      warning: false,
    }
  }

  async componentDidMount() {
    // Check Permission
    if (this.state.userRole !== 'ADMIN') {
      this.setState({
        redirect: '/',
        push: false,
      });
    }
    // Check Archive
    await this.checkArchive();
    // Stop loading
    this.setState({loading: false,});
  }

  @boundMethod
  async checkArchive() {
    try {
      let res = await this.context.request({
        path: `/semester`,
        method: 'get'
      });
      let archiveList = res.data['data'];
      let found = false;
      for (let i = 0; i < archiveList.length; i++) {
        if (archiveList[i]['uuid'] === this.state.archiveUuid) {
          found = true;
          this.setState({
            archiveName: archiveList[i]['name'],
            archiveNewName: archiveList[i]['name'],
          });
          break;
        }
      }
      if (!found) this.setState({error: true,});
    } catch (error) {
      this.setState({
        error: true,
      });
    }
  }

  @boundMethod
  async onRename() {
    if (!this.state.adjustingName) {
      this.setState({adjustingName: true,});
    } else {
      this.setState({renaming: true});
      try {
        await this.context.request({
          path: `/semester/${this.state.archiveUuid}`,
          method: 'patch',
          data: {
            name: this.state.archiveNewName,
          },
        });
      } catch (error) {
        if (error.response.status === 409) this.setState({warning: true});
      }
      await this.checkArchive();
      this.setState({
        renaming: false,
        adjustingName: false,
      })
    }
  }

  @boundMethod
  onRenameChange(event) {
    this.setState({
      archiveNewName: event.target.value,
      warning: false,
    });
  }

  @boundMethod
  onCancel() {
    this.setState({
      adjustingName: false,
      warning: false,
    });
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
    let appBar = <AppBar backTo={`/semester/archives`}/>;

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

    // Info Panel
    let info = <div className={styles.InfoPanel}>
      <div className={styles.IconContainer}>
        <FolderOutlined className={styles.Icon}/>
      </div>
      <Space className={styles.NameContainer}>
        {this.state.adjustingName ?
          <Input value={this.state.archiveNewName} onChange={this.onRenameChange}
                 size={'large'} maxLength={this.state.archiveLimit}/> :
          <p>{this.state.archiveName}</p>}
      </Space>
    </div>;

    // Duplicate Warning
    let warning = null;
    if (this.state.warning) {
      warning = <p className={styles.Warning}>
        Duplicate archive name
      </p>;
    }

    // Rename
    let rename = <Button type={'primary'} block size={'large'} className={styles.Rename}
                       onClick={this.onRename} loading={this.state.renaming}
                       disabled={this.state.adjustingName &&
                       (!this.state.archiveNewName || this.state.archiveNewName === this.state.archiveName)}>
      {this.state.adjustingName ? 'Save' : 'Rename'}
    </Button>;

    // Cancel
    let cancel = null;
    if (this.state.adjustingName) {
      cancel = <Button className={styles.Cancel} block size={'large'}
                       onClick={this.onCancel}>
        Cancel
      </Button>;
    }

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.ArchiveDetails}>
          {info}
          {warning}
          {rename}
          {cancel}
        </div>
      </React.Fragment>
    )
  }
}