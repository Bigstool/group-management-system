import React from "react";
import PropTypes from "prop-types";
import {Button, Card, Tag, Row, Col, Divider, Comment, Avatar, Form, Input, List} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {boundMethod} from "autobind-decorator";
import AppBar from "../components/AppBar";
import './EditProfile.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class EditProfile extends React.Component {
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
      name: 'Obi Wan',
      email: 'obi.wan@xjtlu.edu.cn',
      bio: `418 I'm a teapot. 418 I'm a teapot. 418 I'm a teapot. 418 I'm a teapot. 418 I'm a teapot. 418 I'm a teapot. 418 I'm a teapot. 418 I'm a teapot. 418 I'm a teapot. 418 I'm a teapot. 418 I'm a teapot.`,
      nameLimit: 50,
      emailLimit: 75,
      bioLimit: 300,
      // Component related
      loading: true,
      error: false,
      redirect: false,
      push: false,
      // Event related
      saving: false,
    }
  }

  render() {
    // App Bar
    let appBar = <AppBar/>;

    // Photo
    let photo = <div className={'photo'}>
      <Card.Meta avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" size={64}/>}
                 className={'card'}/>
      <div className={'gap'}/>
    </div>;

    // Name
    let name = <div className={'edit-item'}>
      <h1 className={'title'}>Name</h1>
      <Input className={'content'} onChange={null}
             value={this.state.name} maxLength={this.state.nameLimit}
             disabled={false}/>
    </div>;

    // Email
    let email = <div className={'edit-item'}>
      <h1 className={'title'}>Email</h1>
      <Input className={'content'} onChange={null}
             value={this.state.email} maxLength={this.state.emailLimit}
             disabled={false}/>
    </div>

    // Bio
    let bio = <div className={'edit-item'}>
      <h1 className={'title'}>Bio</h1>
      <Input.TextArea showCount className={'content'} rows={5} onChange={null}
                      value={this.state.bio} maxLength={this.state.bioLimit}/>
      <div className={'gap'} />
    </div>;

    // Save
    let save = <React.Fragment>
      <div className={'gap'} />
      <div className={'gap'} />
      <Button type={'primary'} block size={'large'} onClick={null}
              disabled={false}>
        Save
      </Button>
    </React.Fragment>;

    // Cancel
    let cancel = <React.Fragment>
      <div className={'gap'} />
      <Button block size={'large'} onClick={null}>Cancel</Button>
    </React.Fragment>;

    return (
      <React.Fragment>
        {appBar}
        <div className={'edit-profile'}>
          <div className={'photo-frame'}>
            {photo}
            {name}
          </div>
          {email}
          {bio}
          {save}
          {cancel}
        </div>
      </React.Fragment>
    );
  }
}