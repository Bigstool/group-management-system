import React from "react";
import PropTypes from "prop-types";
import {List, Avatar} from 'antd';
import {boundMethod} from "autobind-decorator";

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

const userList = [
  {
    alias: 'Example',
    bio: 'I write O(1/n) algorithms',
    email: 'example@example.com'
  },
  {
    alias: 'Foo',
    bio: 'I write O(n) algorithms',
    email: 'example@example.com'
  },
  {
    alias: 'Bar',
    bio: 'I write O(logn) algorithms',
    email: 'example@example.com'
  },
  {
    alias: 'Bruce',
    bio: 'I write O(1) algorithms',
    email: 'example@example.com'
  },
]

// #T
export default class GroupDetails extends React.Component {
  static propType = {
    // user list
    'userList': PropTypes.array,  // TODO: isRequired
    // handle clicks to the user card
    'onClick': PropTypes.func,
    // handle clicks to the delete button on the right of the user card, will show the delete button from hidden
    'onDelete': PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = {
      // TODO: initial state
    }
  }

  onClick() {
    alert(`I'm being clicked!`);
  }

  render() {
    return (
      <React.Fragment>
        <List
          itemLayout="horizontal"
          dataSource={userList}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                title={<a href="https://ant.design">{item.alias}</a>}
                onClick={this.onClick}
              />
            </List.Item>
          )}
        />
      </React.Fragment>
    );
  }
}