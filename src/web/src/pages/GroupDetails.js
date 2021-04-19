import React, {Fragment} from 'react';
import './GroupDetails.scss';
import {PageHeader, Button, Tag, Row, Col, Divider, Comment, Avatar, Form, Input, List} from 'antd';
import {StarOutlined, StarFilled} from '@ant-design/icons';
import groupIcon from '../assets/group-icon.svg';
import {AuthContext} from "../utilities/AuthProvider";
import PropTypes from "prop-types";
import AppBar from "../components/AppBar";
import {boundMethod} from "autobind-decorator";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class GroupDetails extends React.Component {
  static propType = {
    "groupUuid": PropTypes.string.isRequired,
    'userProfile': PropTypes.object.isRequired,
    'userApplications': PropTypes.array.isRequired,
    'sysConfig': PropTypes.object.isRequired
  }

  static contextType = AuthContext;

  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    // get user uuid
    this.setState({
      'loading': true,
      'userUuid': this.context.getUser()["uuid"],
      'userRole': this.context.getUser()['role'],
      'groupInfo': null,
    });

    // get group details
    try {
      let res = await this.context.request({
        url: `/group/${this.props.groupUuid}`,
        method: 'get'
      });

      this.setState({
        'groupInfo': res.data['data']
      });
    } catch (error) {
      this.setState({
        'error': true
      });
    }

    // get semester info
    // try {
    //   let res = await this.context.request({
    //     url: `/sysconfig`,
    //     method: `get`
    //   });
    //
    //   this.setState({
    //     'sysConfig': res.data['data']
    //   });
    // } catch (error) {
    //   this.setState({
    //     'error': true
    //   });
    // }

    this.setState({
      'loading': false
    });
  }

  render() {
    return (
      <>
        <AppBar/>
        <GroupBar groupInfo={this.state.groupInfo} groupUuid={this.props.groupUuid}
                  userProfile={this.props.userProfile} userApplications={this.props.userApplications}
                  userRole={this.state.userRole} sysConfig={this.props.sysConfig}/>
        <Title groupInfo={this.state.groupInfo}/>
        <ShortDescription groupInfo={this.state.groupInfo}/>
        <Proposal groupInfo={this.state.groupInfo} sysConfig={this.props.sysConfig}/>
        <CommentSection groupInfo={this.state.groupInfo}/>
        <Showcase/>
        <GroupMembers groupInfo={this.state.groupInfo}/>
        <div className={'bottom-margin'}/>
      </>
    );
  }
}

// #C
class GroupBar extends React.Component {
  static propType = {
    "groupInfo": PropTypes.object.isRequired,
    'groupUuid': PropTypes.string.isRequired,
    'userProfile': PropTypes.object.isRequired,
    'userApplications': PropTypes.array.isRequired,
    'userRole': PropTypes.string.isRequired,
    'sysConfig': PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
  }

// returns true if user is the owner of the group
  isOwner(userProfile, groupUuid) {
    return userProfile['created_group']['uuid'] === groupUuid;
  }

  // returns true if user is a member of the group
  isMember(userProfile, groupUuid) {
    return userProfile['joined_group']['uuid'] === groupUuid;
  }

  // returns true if the user is applied to the group
  isApplied(userApplications, groupUuid) {
    for (let i = 0; i < userApplications.length; i++) {
      if (userApplications[i]['uuid'] === groupUuid) return true;
    }
    return false;
  }

  render() {
    const icon = <img className={'icon'} src={groupIcon} alt="group icon"/>;
    const name = <p className={'name'} title={this.state.groupInfo['name']}>{this.state.groupInfo['name']}</p>;

    let apply = null, yourGroup = null, full = null;
    // check if the group is full, display if before grouping ddl
    if (this.props.sysConfig["system_state"]["grouping_ddl"] > Date.now() &&
      this.props.groupInfo['application_enabled'] === false) {
      full = <Tag className={'your-group'} color="grey">Full</Tag>;
    }
    // check if the group is your group
    if (this.isOwner(this.props.userProfile, this.props.groupUuid) ||
      this.isMember(this.props.userProfile, this.props.groupUuid)) {
      yourGroup = <Tag className={'your-group'} color="blue">Your group</Tag>;
    }
    // check if the apply button is applicable: not in any group, before grouping ddl
    else if (this.props.sysConfig["system_state"]["grouping_ddl"] > Date.now() &&
      this.props.userProfile['created_group'] === null &&
      this.props.userProfile['joined_group'] === null &&
      this.props.userRole === 'USER') {
      // TODO: apply & revoke
      let isApplied = this.isApplied(this.props.userApplications, this.props.groupUuid);
      apply = <Button className={'apply'} type={isApplied ? 'default' : 'primary'}
                      shape={'round'} size={'small'} onClick={null}>
        {isApplied ? 'Applied' : 'Apply'}
      </Button>;
    }

    // TODO: favorite/remove favorite
    let favorite =
      <Button className={'favorite'} shape="circle"
              icon={this.props.groupInfo['favorite'] ?
                <StarFilled style={{color: 'orange'}}/> :
                <StarOutlined style={{color: 'grey'}}/>
              } onClick={null}
      />;

    let groupBarExample = null;
    if (false) {
      groupBarExample = <PageHeader
        title="Jaxzefalk"
        className="group-bar"
        tags={<Tag color="blue">Your group</Tag>}
        extra={[
          <Button key="1">Favorite</Button>,
        ]}
        avatar={{src: 'https://avatars1.githubusercontent.com/u/8186664?s=460&v=4'}}
      />;
    }

    return (
      <>
        <Row className={'group-bar'}>
          <Col flex={"auto"}>
            {icon}
            {name}
            {apply}
            {yourGroup}
            {full}
          </Col>
          <Col flex={"32px"}>
            {favorite}
          </Col>
        </Row>
        {groupBarExample}
      </>
    );
  }
}

// #C
class Title extends React.Component {
  static propType = {
    "groupInfo": PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
  }

  render() {
    const title = <h1>{this.props.groupInfo['name']}</h1>
    return (
      <div className={'group-title'}>
        {title}
      </div>
    );
  }
}

// #C
class ShortDescription extends React.Component {
  static propType = {
    "groupInfo": PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
  }

  render() {
    const description = <p>{this.props.groupInfo['description']}</p>

    return (
      <div className={'group-short-description'}>
        {description}
      </div>
    );
  }
}

// #C
class Proposal extends React.Component {
  static propType = {
    "groupInfo": PropTypes.object.isRequired,
    'sysConfig': PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
  }

  render() {
    let late = null;
    // late if b) late submission; a) not submitted after grouping ddl
    if (this.props.groupInfo['proposal_late'] > 0) {  // case a)
      let lateDays = Math.ceil(this.props.groupInfo['proposal_late'] / 86400);
      late = <Tag className={'tag'} color='red'>
        {`Late: ${lateDays}${lateDays > 1 ? 'Days' : 'Day'}`}
      </Tag>;
    }
    else if (this.props.sysConfig["system_state"]["proposal_ddl"] < Date.now() &&  // case b)
      this.props.groupInfo['proposal_state'] === 'PENDING') {
      let lateDays = Math.ceil((Date.now() - this.props.sysConfig["system_state"]["proposal_ddl"]) / 86400);
      late = <Tag className={'tag'} color='red'>
        {`Late: ${lateDays}${lateDays > 1 ? 'Days' : 'Day'}`}
      </Tag>;
    }

    let approved = null;
    if (this.props.groupInfo['proposal_state'] === 'APPROVED') {
      approved = <Tag className={'tag'} color='green'>Approved</Tag>;
    }

    let proposal = (
      <p className={'content'}>{this.props.groupInfo['proposal']}</p>
    );

    return (
      <div className={'group-proposal'}>
        <Divider className={'start-divider'} orientation="left">
          Proposal
          {late}
          {approved}
        </Divider>
        {proposal}
        <Divider className={'end-divider'}/>
      </div>
    );
  }
}

const {TextArea} = Input;

// #C
class CommentSection extends React.Component {
  static propType = {
    "groupInfo": PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.state = {
      newComment: ''
    };
  }

  @boundMethod
  onChange(event) {
    this.setState({newComment: event.target.value});
  }

  @boundMethod
  onSubmit() {
    if (!this.state.value) return;
    this.setState({newComment: ''});
  }

  render() {
    let comments_plain = this.props.groupInfo['comment']
    let comments = [];
    let index = 0;
    // TODO: last modified (waiting for API support)
    // Do not show last modified if: a) no comment; b) approved
    while(index < comments_plain.length) {
      comments.push(
        <Comment
          className={'comment'}
          author={<a>{comments_plain[index]['author']['alias']}</a>}
          avatar={
            <Avatar
              src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
              alt="Han Solo"
            />
          }
          content={
            <p>{comments_plain[index]['content']}</p>
          }
        />
      )
      index++;
    }

    // TODO: submit
    let newComment = (
      <React.Fragment>
        <Comment
          avatar={
            <Avatar
              src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
              alt="Han Solo"
            />
          }
          content={
            <>
              <Form.Item>
                <TextArea rows={4} onChange={this.onChange} value={this.state.newComment}/>
              </Form.Item>
              <Form.Item>
                <Button htmlType="submit" loading={false} onClick={this.onSubmit} type="primary">
                  Add Comment
                </Button>
              </Form.Item>
            </>
          }
        />
      </React.Fragment>
    )

    return (
      <div className={'group-comment-section'}>
        {comments}
        {newComment}
      </div>
    );
  }
}

// #C
class Showcase extends React.Component {
  //TODO
  render() {
    return null;
  }
}

// #C
class GroupMembers extends React.Component {
  static propType = {
    "groupInfo": PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);

    this.ownerUuid = this.props.groupInfo['owner']['uuid']
    this.members = this.props.groupInfo['member'];
  }

  render() {
    return (
      <div className={'group-members'}>
        <h3>Group Members</h3>
        <List
          itemLayout="horizontal"
          split={false}
          dataSource={this.members}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                // TODO: link avatar and title to user profile
                avatar={<Avatar
                  src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/>}
                title={<a href={'#'}>{item.alias}</a>}
                description={item.uuid === this.ownerUuid ? 'Owner' : 'Member'}
              />
            </List.Item>
          )}
        />
      </div>
    );
  }
}