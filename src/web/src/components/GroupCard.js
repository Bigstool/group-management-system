import React from 'react';
import PropTypes from "prop-types";
import {Card} from "antd";
import {UsergroupAddOutlined} from "@ant-design/icons";

export default class GroupCard extends React.PureComponent {
    static propTypes = {
        groupItem: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Card>
                <Card.Meta
                    title={this.props["groupItem"]["name"]}
                    description={this.props["groupItem"]["description"]}
                />
            </Card>
        )
    }
}