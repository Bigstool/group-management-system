import React from "react";
import PropTypes from "prop-types";
import {Avatar, Card, Divider} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import './UserProfile.scss';
import {AuthContext} from "../utilities/AuthProvider";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class UserProfile extends React.Component {
  static propTypes = {
    // null
  }
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      // User related
      'userUuid': this.props.match.params["uuid"],
      'name': 'Obi Wan',
      'email': 'obi.wan@student.xjtlu.edu.cn',
      'bio': 'It is inevitable. It is inevitable. It is inevitable. It is inevitable. It is inevitable. It is inevitable. It is inevitable. It is inevitable.',
      // Component related
      'loading': true,
      'error': false,
    }
  }

  render() {
    // App Bar
    let appBar = <AppBar/>

    // Title
    let title = <div className={'title'}>
      <Card.Meta avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" size={64}/>}
                 title={this.state.name} description={this.state.email}
                 className={'card'}/>
    </div>;

    // Bio
    let bio = <div className={'bio'}>
      <Divider className={'divider'} orientation="left">Bio</Divider>
      <p className={'content'}>{this.state.bio}</p>
    </div>;

    return (
      <React.Fragment>
        {appBar}
        <div className={'user-profile'}>
          {title}
          {bio}
        </div>
      </React.Fragment>
    );
  }
}