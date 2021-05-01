import React from "react";
import {PageHeader} from "antd";
import PropTypes from "prop-types";
import "./AppBar.scss";
import {Link} from "react-router-dom";
import {EllipsisOutlined} from "@ant-design/icons";
import {boundMethod} from "autobind-decorator";
import {withRouter} from 'react-router-dom';

class AppBar extends React.PureComponent {
    static propTypes = {
        backTo: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.number]),
        dotMenuTarget: PropTypes.string,    // example: `/group/${group_uuid}/config`
        title: PropTypes.string
    };

    static defaultProps = {
        backTo: true,
        dotMenuTarget: null,
        title: "GMS"
    };

    constructor(props) {
        super(props);
    }

    @boundMethod
    onBackClicked() {
        switch (typeof this.props.backTo) {
            case "string":
                this.props.history.push(this.props.backTo);
                break;
            case "number":
                this.props.history.go(this.props.backTo);
                break;
            default:
                this.props.history.goBack();
        }
    };

    render() {
        return (
            <>
                <PageHeader
                    className={"AppBar"}
                    onBack={this.props.backTo ? this.onBackClicked : null}
                    title={this.props.title}
                    extra={this.props.dotMenuTarget &&
                    <Link to={this.props.dotMenuTarget}>
                        <EllipsisOutlined className={"ThreeDot"}/>
                    </Link>}
                />
            </>
        );
    }
}

export default withRouter(AppBar);