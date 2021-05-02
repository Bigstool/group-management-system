import React from 'react';
import PropTypes from "prop-types";
import styles from "./GroupCard.scss";
import {Card, Tag} from "antd";
import {StarFilled, UsergroupAddOutlined} from "@ant-design/icons";
import {Link} from "react-router-dom";

export default class GroupCard extends React.PureComponent {
  static propTypes = {
    groupItem: PropTypes.object.isRequired,
    highlight: PropTypes.bool
  };

  static defaultProps = {
    highlight: false
  }

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Link to={`/group/${this.props.groupItem.uuid}`}>
        <Card className={`${styles.GroupCard} ${this.props.highlight && styles.Highlight}`} title={this.props.groupItem.title}
              extra={this.props.groupItem.favorite && <StarFilled style={{color: 'orange'}}/>}
        >
          <Card.Meta
            description={this.props.groupItem.description}
          />
          <div className={styles.GroupName}>
            <UsergroupAddOutlined/>
            <span className={styles.Name}>{this.props.groupItem.name}</span>
            {this.props.highlight &&
            <Tag className={styles.Tag} color={"processing"}>Your group</Tag>}
          </div>
        </Card>
      </Link>

    );
  }
}