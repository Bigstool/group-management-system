import React from "react";

export const AuthContext = React.createContext();

export class AuthProvider extends React.Component {
    constructor(props) {
        super(props);
        // TODO: get user from local storage
        this.state = { user: null };
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
    }

    /**
     * User login
     * @param username {string} username (email)
     * @param password {string} password (plaintext)
     * @param remember {boolean} remember login across sessions
     * @returns {boolean} true if login successful, false if failed
     */
    login(username, password, remember) {
        // TODO: calc password sha1
        // TODO: call login api
        // TODO: extract token
        // TODO: get user role
        this.setState({
            user: {
                "uuid": "",
                "role": ""
            }
        })
        return true;
    };

    /**
     * User logout
     * @returns {boolean} true if successful
     */
    logout() {
        // TODO: remove login info from storage
        this.setState({
            user: null
        })
        return true;
    };

    render() {
        return (
            <AuthContext.Provider value={{
                "user": this.state.user,
                "login": this.login,
                "logout": this.logout
            }}>
                {this.props.children}
            </AuthContext.Provider>
        )
    }
}