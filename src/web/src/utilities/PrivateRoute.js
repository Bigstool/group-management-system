import React from "react";
import {Route, Redirect} from "react-router-dom";
import {AuthContext} from "./AuthProvider";

export default class PrivateRoute extends React.PureComponent {
    static contextType = AuthContext;

    render() {
        const {children, ...rest} = this.props;
        return (
            <Route
                {...rest}
                render={(props) => {
                    return this.context.getUser() === null ?
                        <Redirect to={{
                            pathname: "/login",
                            state: {from: props.location}
                        }}/>
                        :
                      (children)
                }}
            />
        );
    }
}