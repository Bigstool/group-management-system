import React from 'react';
import "./TabNav.scss";
import {UnorderedListOutlined, UserOutlined} from "@ant-design/icons";
import PropTypes from "prop-types";
import {boundMethod} from "autobind-decorator";
import {Col, Row} from "antd";
import {Redirect} from "react-router-dom";

export default class TabNav extends React.Component {
    static propTypes = {
        "active": PropTypes.oneOf(["GROUP_LIST", "USER_PROFILE"])
    }

    constructor(props) {
        super(props);
        this.state = {
            "redirect": null
        }
    }

    @boundMethod
    onGroupListClicked() {
        this.setState({
            "redirect": "/"
        });
    }

    @boundMethod
    onUserProfileClicked() {
        this.setState({
            "redirect": "/user"
        });
    }

    render() {
        const redirect = this.state["redirect"]
        if (redirect) {
            return (<Redirect to={redirect}/>)
        }

        return (
            <>
                <div className={"TabNav"}>
                    <Row>
                        <Col span={12}
                             className={"ButtonCol"}
                             onClick={this.props.active !== "GROUP_LIST" ? this.onGroupListClicked : null}>
                            <UnorderedListOutlined
                                className={`Button ${this.props.active === "GROUP_LIST" && 'Active'}`}/>
                        </Col>
                        <Col span={12}
                             className={"ButtonCol"}
                             onClick={this.props.active !== "USER_PROFILE" ? this.onUserProfileClicked : null}>
                            <UserOutlined className={`Button ${this.props.active === "USER_PROFILE" && 'Active'}`}/>
                        </Col>
                    </Row>
                </div>
            </>
        )
    }
}