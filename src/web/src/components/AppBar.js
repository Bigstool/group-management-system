import React from "react";
import {PageHeader} from "antd";
import PropTypes from "prop-types";
import "./AppBar.scss";
import {Link} from "react-router-dom";
import {EllipsisOutlined} from "@ant-design/icons";

export default class AppBar extends React.PureComponent {
    static propTypes = {
        "showBack": PropTypes.bool,
        "dotMenuTarget": PropTypes.string,    // example: `/group/${group_uuid}/config`
        "title": PropTypes.string
    }

    static defaultProps = {
        "showBack": true,
        "dotMenuTarget": null,
        "title": "GMS"
    }

    constructor(props) {
        super(props);
    }

    onBackClicked = () => {
        window.history.back();
    }

    render() {
        return (
            <>
                <PageHeader
                    className={"AppBar"}
                    onBack={this.props.showBack ? this.onBackClicked : null}
                    title={this.props.title}
                    extra={this.props.dotMenuTarget &&
                    <Link to={this.props.dotMenuTarget}>
                        <EllipsisOutlined className={"ThreeDot"}/>
                    </Link>}
                />
            </>
        )
    }
}