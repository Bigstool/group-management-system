import React from "react";
import PropTypes from "prop-types";
import {List, Checkbox} from 'antd';
import Avatar from 'react-avatar';
import styles from './UserItem.scss';
import {boundMethod} from "autobind-decorator";
import {CloseOutlined} from "@ant-design/icons";

export default class UserItem extends React.Component {
  static propTypes = {
    userObject: PropTypes.object.isRequired,
    description: PropTypes.string,
    onItemClicked: PropTypes.func,  // params: this.props.userObject
    onCheckboxChanged: PropTypes.func,  // params: this.props.userObject, isChecked
    onDeleteClicked: PropTypes.func  // params: this.props.userObject
  };

  constructor(props) {
    super(props);
  }

  @boundMethod
  onItemClicked(e) {
    this.props.onItemClicked(this.props.userObject);
  }

  @boundMethod
  onCheckboxChanged(e) {
    this.props.onCheckboxChanged(this.props.userObject, e.target.checked);
  }

  @boundMethod
  onDeleteClicked(e) {
    this.props.onDeleteClicked(this.props.userObject);
  }


  render() {
    return (
      <List.Item
        className={styles.UserItem}
        actions={[
          this.props.onCheckboxChanged && <Checkbox onChange={this.onCheckboxChanged}/> ||
          this.props.onDeleteClicked && <CloseOutlined onClick={this.onDeleteClicked}/>
        ]}>
        <List.Item.Meta
          avatar={<Avatar size={32} round={true} name={this.props.userObject.alias}/>}
          title={this.props.userObject.alias}
          description={this.props.description}
          onClick={this.props.onItemClicked && this.onItemClicked}
        />
      </List.Item>
    );
  }
}