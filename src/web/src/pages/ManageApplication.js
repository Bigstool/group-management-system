import React from "react";
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import styles from './ManageApplication.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import UserItem from "../components/UserItem";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class ManageApplication extends React.Component {
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      userUuid: this.context.getUser()['uuid'],
      // Group related
      groupUuid: '',  // TODO: this.props.match.params["uuid"],
      ownerUuid: '',
      applications: null,
      // Component related
      loading: true,
      error: false,
      redirect: '',
      push: false,
      // Event related
      deleting: false,
    }
  }

  componentDidMount() {
    this.setState({
      applications: [
        {
          alias: 'Tom',
          email: 'tom@xjtlu.edu.cn',
          uuid: '16fc2db7-cac0-46c2-a0e3-2da6cec54abb',
        },
        {
          alias: 'Bob',
          email: 'bob@xjtlu.edu.cn',
          uuid: '17fc2db7-cac0-46c2-a0e3-2da6cec54abb',
        },
        {
          alias: 'Nah',
          email: 'nah@xjtlu.edu.cn',
          uuid: '18fc2db7-cac0-46c2-a0e3-2da6cec54abb',
        },
      ],
      loading: false,
    });
  }

  /**
   * Click handler
   * @param userObject {Object} the user object
   */
  @boundMethod
  onClick(userObject) {

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

    let applications = [];
    for (let i = 0; i < this.state.applications.length; i++) {
      let userItem = <UserItem userObject={this.state.applications[i]}
                               onItemClicked={this.onClick}
                               onDeleteClicked={this.onDelete}
                               key={this.state.applications[i]['uuid']}/>;
      applications.push(userItem);
    }

    return (
      <React.Fragment>
        {appBar}
        <div className={styles.ManageApplication}>
          {applications}
        </div>
      </React.Fragment>
    );
  }
}