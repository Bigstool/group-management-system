import React from "react";
import {PageHeader} from "antd";
import PropTypes from "prop-types";
import "./AppBar.scss";

export default class AppBar extends React.PureComponent {
    static propTypes = {
        "showBack": PropTypes.bool,
        "title": PropTypes.string
    }

    static defaultProps = {
        "showBack": true,
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
                    onBack={this.props["showBack"] ? this.onBackClicked : null}
                    title={this.props["title"]}
                />
            </>
        )
    }
}