import {Helmet} from "react-helmet";
import React from "react";

export default class HtmlHead extends React.PureComponent {
    render() {
        return (
            <Helmet>
                <meta charSet="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>GMS - Home</title>
            </Helmet>
        )
    }
}