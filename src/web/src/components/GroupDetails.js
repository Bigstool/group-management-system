import React, {Fragment} from 'react';
import './GroupDetails.scss';
import { PageHeader, Button, Tag, Row, Col, Divider, Comment, Avatar ,Form, Input, List } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import groupIcon from '../assets/group-icon.svg';

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class GroupDetails extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return(
      <>
        <PlaceholderHeader/>
        <div className={'head-margin'}/>
        <GroupBar/>
        <Title/>
        <ShortDescription/>
        <Proposal/>
        <CommentSection/>
        <Showcase/>
        <GroupMembers/>
        <div className={'bottom-margin'}/>
      </>
    );
  }
}

// #C
class PlaceholderHeader extends React.Component {
  render() {
    return (
      <PageHeader
        className="site-page-header"
        onBack={() => null}
        title="Title"
        subTitle="This is a subtitle"
      />
    );
  }
}

// #C
class GroupBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const icon = <img className={'icon'} src={groupIcon} alt="group icon"/>;
    const name = <p className={'name'} title={'Jaxzefalk'}>Jaxzefalk</p>;

    let apply = null, yourGroup = null;
    if (false) {
      apply = <Button className={'apply'} type={'primary'} shape={'round'} size={'small'}>Apply</Button>;
    } else {
      yourGroup = <Tag className={'your-group'} color="blue">Your group</Tag>;
    }

    let favorite = null;
    if (true) {
      favorite = <Button className={'favorite'} shape="circle" icon={<StarFilled style={{color: 'orange'}}/>}/>;
    } else {
      favorite = <Button className={'favorite'} shape="circle" icon={<StarOutlined style={{color: 'grey'}}/>}/>;
    }

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
  constructor(props) {
    super(props);
  }

  render() {
    const title = <h1>CPT202 Group Management System</h1>
    return (
      <div className={'group-title'}>
        {title}
      </div>
    );
  }
}

// #C
class ShortDescription extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const description = <p>A manage system for students to group together in CPT202</p>

    return (
      <div className={'group-short-description'}>
        {description}
      </div>
    );
  }
}

// #C
class Proposal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let late = null;
    if (true) {
      late = <Tag className={'tag'} color='red'>Late</Tag>;
    }

    let approved = null;
    if (true) {
      approved = <Tag className={'tag'} color='green'>Approved</Tag>;
    }
    
    let proposal = (
      <p className={'content'}>
        CPT202 Group Management System is a system for students and
        the teacher of CPT202 to manage grouping and proposal.<br/>
        <br/>
        Students can:<br/>
        * Browse groups<br/>
        * Create group<br/>
        * Join group<br/>
        * Submit proposal<br/>
        * Create project showcase<br/>
        etc.<br/>
        The teacher can:<br/>
        * Allocate students to groups<br/>
        * Edit or delete groups<br/>
        * Comment on proposals<br/>
        * Approve proposals<br/>
        etc.<br/>
      </p>
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

const { TextArea } = Input;

// #C
class CommentSection extends React.Component {
  // TODO: comment: to user profile
  constructor(props) {
    super(props);
    this.state = {
      newComment: ''
    };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(event) {
    this.setState({newComment: event.target.value});
  }

  onSubmit() {
    if (!this.state.value) return;
    this.setState({newComment: ''});
  }

  render() {
    let comments = (
      <React.Fragment>
        <Comment
          className={'comment'}
          author={<a>Soon Phei Tin</a>}
          avatar={
            <Avatar
              src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
              alt="Han Solo"
            />
          }
          content={
            <p>
              Please be more detailed.
            </p>
          }
        />
        <Divider className={'modified-since'} orientation="center" plain>
          Modified Since
        </Divider>
        <Comment
          className={'comment'}
          author={<a>Soon Phei Tin</a>}
          avatar={
            <Avatar
              src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
              alt="Han Solo"
            />
          }
          content={
            <p>
              Very good proposal.
            </p>
          }
        />
      </React.Fragment>
    );

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
                <TextArea rows={4} onChange={this.onChange} value={this.state.newComment} />
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
  constructor(prep) {
    super(prep);

    this.members = [
      {
        name: 'Example',
        role: 'Group owner',
        profile: '#',
      },
      {
        name: 'Foobar',
        role: 'Member',
        profile: '#',
      },
      {
        name: 'Test',
        role: 'Member',
        profile: '#',
      },
    ];
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
                avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/>}
                title={<a href={item.profile}>{item.name}</a>}
                description={item.role}
              />
            </List.Item>
          )}
        />
      </div>
    );
  }
}