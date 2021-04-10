import React from "react";
import {PageHeader} from "antd";

export default class AppBar extends React.PureComponent {
    constructor(props) {
        super(props);
        this.onBackClicked = this.onBackClicked.bind(this);
    }

    onBackClicked = () => {
        // TODO
    }

    render() {
        return (
            <PageHeader
                className="site-page-header"
                onBack={this.onBackClicked}
                title={"GMS"}
            />
        )
    }
}