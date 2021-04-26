import React from 'react';
import './GroupDetails.scss';
import {PageHeader, Button, Tag, Row, Col, Divider, Comment, Avatar, Form, Input, List} from 'antd';
import {StarOutlined, StarFilled, LoadingOutlined} from '@ant-design/icons';
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
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      'loading': true,
      'userUuid': this.context.getUser()["uuid"],
      'userProfile': null,  // obtained from context
      'userRole': this.context.getUser()['role'],
      'groupUuid': this.props.match.params["uuid"],
      'groupInfo': null,  // obtained in componentDidMount
      'sysConfig': null,  // obtained from context
      'error': false
    }
  }

  // returns true if user is the owner of the group
  @boundMethod
  isOwner() {
    if (!this.state.userProfile['created_group']) return false;
    return this.state.userProfile['created_group']['uuid'] === this.state.groupUuid;
  }

  // returns true if user is a member of the group
  @boundMethod
  isMember() {
    if (!this.state.userProfile['joined_group']) return false;
    return this.state.userProfile['joined_group']['uuid'] === this.state.groupUuid;
  }

  // request group info
  // NOTE: caller should be async and await as well
  @boundMethod
  async requestGroupInfo() {
    try {
      let res = await this.context.request({
        path: `/group/${this.state.groupUuid}`,
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
  }

  // Indicates an error has occurred
  @boundMethod
  error() {
    this.setState({
      'error': true
    });
  }

  async componentDidMount() {
    // get user profile
    let userProfile = await this.context.getUserProfile();
    let sysConfig = await this.context.getSysConfig();

    // get group info
    await this.requestGroupInfo();

    this.setState({
      'userProfile': userProfile,
      'sysConfig': sysConfig,
      'loading': false
    });
  }

  render() {
    let appBar = <AppBar/>;

    if (this.state.error) {
      return (
        <React.Fragment>
          {appBar}
          <h1>Oops, something went wrong</h1>
          <h2>Perhaps reload?</h2>
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

    // If the user is a member of the group, show the three-dot menu
    if (this.isOwner() || this.isMember() || this.userRole === 'ADMIN') {
      appBar = <AppBar dotMenuTarget={`/group/${this.state.groupUuid}/config`}/>;
    }

    return (
      <React.Fragment>
        {appBar}
        <GroupBar userUuid={this.state.userUuid} userProfile={this.state.userProfile}
                  userRole={this.state.userRole} groupUuid={this.state.groupUuid}
                  groupInfo={this.state.groupInfo} sysConfig={this.state.sysConfig}
                  isOwner={this.isOwner} isMember={this.isMember}
                  requestGroupInfo={this.requestGroupInfo} error={this.error}/>
        <Title groupInfo={this.state.groupInfo}/>
        <ShortDescription groupInfo={this.state.groupInfo}/>
        <Proposal groupInfo={this.state.groupInfo} sysConfig={this.state.sysConfig}/>
        <CommentSection userRole={this.state.userRole} groupUuid={this.state.groupUuid}
                        groupInfo={this.state.groupInfo} isOwner={this.isOwner}
                        isMember={this.isMember} requestGroupInfo={this.requestGroupInfo}/>
        <Showcase/>
        <GroupMembers groupInfo={this.state.groupInfo}/>
        <div className={'bottom-margin'}/>
      </React.Fragment>
    );
  }
}

// #C
class GroupBar extends React.Component {
  static propTypes = {
    // User related
    'userUuid': PropTypes.string.isRequired,
    'userProfile': PropTypes.object.isRequired,
    'userRole': PropTypes.string.isRequired,
    // Group related
    'groupUuid': PropTypes.string.isRequired,
    "groupInfo": PropTypes.object.isRequired,
    // System related
    'sysConfig': PropTypes.object.isRequired,
    // Functions
    'isOwner': PropTypes.func.isRequired,
    'isMember': PropTypes.func.isRequired,
    'requestGroupInfo': PropTypes.func.isRequired,
    'error': PropTypes.func.isRequired
  }
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      'isApplied': false,
      'applicationUuid': null,
      'applying': false,
      'favoriting': false,
    }
  }

  async componentDidMount() {
    // Check if user is applied to the group
    await this.checkApplied();
  }

  // checks if user is applied to the group
  // if yes, set state 'isApplied' to true, 'applicationUuid' to application uuid
  // if no, set state 'isApplied' to false, 'applicationUuid' to null
  @boundMethod
  async checkApplied() {
    try {
      // request user applications
      let res = await this.context.request({
        path: `/user/${this.props.userUuid}/application`,
        method: 'get'
      });

      // loop through user applications to see if applied to this group
      let userApplications = res.data['data'];
      let found = false;
      for (let i = 0; i < userApplications.length; i++) {
        if (userApplications[i]['group']['uuid'] === this.props.groupUuid) {
          this.setState({
            'isApplied': true,
            'applicationUuid': userApplications[i]['uuid'],
          });
          found = true;
          break;
        }
      }
      if (!found) {
        this.setState({
          'isApplied': false,
          'applicationUuid': null,
        });
      }
    } catch (error) {
      this.props.error();
    }
  }

  @boundMethod
  async onApplyButtonClicked() {
    this.setState({
      "applying": true,
    });

    // if not applied, apply
    if (this.state.isApplied === false) {
      try {
        await this.context.request({
          path: `/group/${this.props.groupUuid}/application`,
          method: "post",
          data: {
            comment: ""
          }
        });
      } catch (error) {}
    }
    // if applied, remove application
    else {
      try {
        await this.context.request({
          path: `/application/${this.state.applicationUuid}`,
          method: "delete",
        });
      } catch (error) {}
    }

    // finally, check if user is applied to the group again
    await this.checkApplied();
    this.setState({
      'applying': false
    });
  }

  @boundMethod
  async onFavoriteButtonClicked() {
    this.setState({'favoriting': true});

    // if not favorite, favorite
    if (!this.props.groupInfo['favorite']) {
      try {
        await this.context.request({
          path: `/group/${this.props.groupUuid}/favorite`,
          method: "post"
        });
      } catch (error) {}
    }
    // if favorite, remove favorite
    else {
      try {
        await this.context.request({
          path: `/group/${this.props.groupUuid}/favorite`,
          method: "delete"
        });
      } catch (error) {}
    }
    // finally, update group info
    await this.props.requestGroupInfo();
    this.setState({'favoriting': false});
  }

  render() {
    const icon = <img className={'icon'} src={groupIcon} alt="group icon"/>;
    const name = <p className={'name'} title={this.props.groupInfo['name']}>{this.props.groupInfo['name']}</p>;

    let apply = null, yourGroup = null, full = null;
    // check if the group is full, display if before grouping ddl
    if (this.props.sysConfig["system_state"]["grouping_ddl"] > Date.now() &&
      this.props.groupInfo['application_enabled'] === false) {
      full = <Tag className={'your-group'} color="grey">Full</Tag>;
    }
    // check if the group is your group
    if (this.props.isOwner() || this.props.isMember()) {
      yourGroup = <Tag className={'your-group'} color="blue">Your group</Tag>;
    }
    // check if the apply button is applicable: not admin, not in any group, before grouping ddl
    else if (this.props.sysConfig["system_state"]["grouping_ddl"] > Date.now() &&
      this.props.userProfile['created_group'] === null &&
      this.props.userProfile['joined_group'] === null &&
      this.props.userRole === 'USER') {
      // Apply & revoke
      apply = <Button className={'apply'} type={this.state.isApplied ? 'default' : 'primary'}
                      shape={'round'} size={'small'} onClick={this.onApplyButtonClicked}
                      loading={this.state.applying}>
        {this.state.isApplied ? 'Applied' : 'Apply'}
      </Button>;
    }

    // Favorite/remove favorite
    let favorite =
      <Button className={'favorite'} shape="circle"
              icon={this.props.groupInfo['favorite'] ?
                <StarFilled style={{color: 'orange'}}/> :
                <StarOutlined style={{color: 'grey'}}/>}
              loading={this.state.favoriting}
              onClick={this.onFavoriteButtonClicked}
      />;

    // let groupBarExample = null;
    // if (false) {
    //   groupBarExample = <PageHeader
    //     title="Jaxzefalk"
    //     className="group-bar"
    //     tags={<Tag color="blue">Your group</Tag>}
    //     extra={[
    //       <Button key="1">Favorite</Button>,
    //     ]}
    //     avatar={{src: 'https://avatars1.githubusercontent.com/u/8186664?s=460&v=4'}}
    //   />;
    // }

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
      </>
    );
  }
}

// #C
class Title extends React.Component {
  static propTypes = {
    "groupInfo": PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
  }

  render() {
    // TODO: get the title of the group (wait for backend implementation)
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
  static propTypes = {
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
  static propTypes = {
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
        {`Late: ${lateDays} ${lateDays > 1 ? 'Days' : 'Day'}`}
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

// #C
class CommentSection extends React.Component {
  static propTypes = {
    // User related
    'userRole': PropTypes.string.isRequired,
    // Group related
    'groupUuid': PropTypes.string.isRequired,
    "groupInfo": PropTypes.object.isRequired,
    // Functions
    'isOwner': PropTypes.func.isRequired,
    'isMember': PropTypes.func.isRequired,
    'requestGroupInfo': PropTypes.func.isRequired,
  }
  static contextType = AuthContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      newComment: '',
      submitting: false,
    };
  }

  @boundMethod
  onNewCommentChange(event) {
    this.setState({newComment: event.target.value});
  }

  @boundMethod
  onSubmit() {
    if (!this.state.value) return;
    this.setState({newComment: ''});
  }

  @boundMethod
  async onSubmitButtonClicked() {
    this.setState({'submitting': true});

    // send comment
    try {
      await this.context.request({
        path: `/group/${this.props.groupUuid}/comment`,
        method: "post",
        data: {
          content: this.state.newComment,
        }
      });
    } catch (error) {}

    // finally, update group info, clear new comment and set submitting to be false
    await this.props.requestGroupInfo();
    this.setState({
      'newComment': '',
      'submitting': false
    });
  }

  render() {
    // Comment list
    let proposal_update_time = this.props.groupInfo['proposal_update_time'];
    let comments_plain = this.props.groupInfo['comment'];
    comments_plain.sort((comment1, comment2) => {
      return comment1['creation_time'] - comment2['creation_time'];
    });
    let comments = [];
    let index = 0;
    while(index < comments_plain.length) {
      // insert the next comment
      // TODO: link avatar and title to user profile
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
          key={comments_plain[index]['creation_time'].toString()}
        />
      );

      // check whether to insert last modified
      // Only show last modified when: a) has comment; b) not approved; c) modified after the first comment.
      // a) checked by while loop
      if (this.props.groupInfo['proposal_state'] !== 'APPROVED' &&  // b)
        ((index === comments_plain.length - 1 && comments_plain[index]['creation_time'] <= proposal_update_time) ||
          (comments_plain[index]['creation_time'] <= proposal_update_time &&  // c)
            comments_plain[index + 1]['creation_time'] > proposal_update_time))) {
        comments.push(
          <Divider className={'modified-since'} orientation="center" plain key={'modified-since'}>
            Modified Since
          </Divider>
        );
      }

      // increase index
      index++;
    }

    // New comment
    let newComment = null;
    // allow comment only if user is the owner, a member, or a admin
    // TODO: link avatar and title to user profile
    if (this.props.userRole === 'ADMIN' || this.props.isOwner() || this.props.isMember()) {
      newComment = (
        <React.Fragment>
          <Comment
            className={'new-comment'}
            avatar={
              <Avatar
                src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
                alt="Han Solo"
              />
            }
            content={
              <>
                <Form.Item>
                  <Input.TextArea rows={4} onChange={this.onNewCommentChange} value={this.state.newComment}/>
                </Form.Item>
                <Form.Item>
                  <Button htmlType="submit" loading={this.state.submitting}
                          onClick={this.onSubmitButtonClicked} type="primary">
                    Add Comment
                  </Button>
                </Form.Item>
              </>
            }
          />
        </React.Fragment>
      )
    }


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
  // TODO: [DELAYED] Showcase
  render() {
    return null;
  }
}

// #C
class GroupMembers extends React.Component {
  static propTypes = {
    "groupInfo": PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
  }

  render() {
    let memberList = [];
    memberList.push(
      <List.Item>
        <List.Item.Meta
          // TODO: link avatar and title to user profile
          avatar={<Avatar
            src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/>}
          title={<a href={'#'}>{this.props.groupInfo['owner']['alias']}</a>}
          description={'Owner'}
          key={this.props.groupInfo['owner']['uuid']}
        />
      </List.Item>
    );
    for (let i = 0; i < this.props.groupInfo['member'].length; i++) {
      memberList.push(
        <List.Item>
          <List.Item.Meta
            // TODO: link avatar and title to user profile
            avatar={<Avatar
              src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/>}
            title={<a href={'#'}>{this.props.groupInfo['member'][i]['alias']}</a>}
            description={'Member'}
            key={this.props.groupInfo['member'][i]['uuid']}
          />
        </List.Item>
      );
    }

    return (
      <div className={'group-members'}>
        <h3>Group Members</h3>
        {memberList}
      </div>
    );
  }
}