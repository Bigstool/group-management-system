import React from "react";
import Storage from "./Storage";
import querystring from "querystring";
import SHA1 from "crypto-js/sha1";
import axios from "axios";

const API_URL = "https://gms.bigstool.com/api";
const TOKEN_EXPIRE_MARGIN = 60; // seconds
const TOKEN_CHECK_INTERVAL = 10;    // seconds

export const AuthContext = React.createContext();

export class AuthProvider extends React.Component {

    constructor(props) {
        super(props);
        // get user from local storage
        this.state = {
            user: JSON.parse(Storage.getItem("user"))
        };
        this.saveUser = this.saveUser.bind(this);
        this.checkUserToken = this.checkUserToken.bind(this);
        this.getUser = this.getUser.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.request = this.request.bind(this);
        // schedule task
        this.checkUserToken()
    }

    /**
     * Get user object
     * @typedef User
     * @type {object}
     * @property {string} uuid
     * @property {string} role
     * @property {string} accessToken
     * @property {number} accessTokenExp
     * @property {string} refreshToken
     * @property {number} refreshTokenExp
     *
     * @returns {User|null} if user logged in, return user object, else return null
     */
    getUser() {
        return this.state.user;
    }

    /**
     * Check token expiration and refresh if needed
     * Scheduled loop function
     */
    checkUserToken() {
        let dispatched = false; // avoid set duplicate timeout
        const user = this.state.user;
        if (user && user["accessTokenExp"] < Date.now() / 1000 - TOKEN_EXPIRE_MARGIN) {  // access token expired
            if (user["refreshTokenExp"] > Date.now() / 1000) {  // refresh token not expired
                dispatched = true;
                axios({
                    url: API_URL + "/oauth2/refresh",
                    methods: "post",
                    data: querystring.stringify({
                        grant_type: "refresh",
                        refresh_token: user["refreshToken"],
                    })
                }).then((res) => {
                    this.saveUser(res, user["rememberMe"]);
                }).catch(e => {
                    console.error(e);
                    this.logout();
                }).finally(() => {
                    setTimeout(this.checkUserToken, TOKEN_CHECK_INTERVAL * 1000);
                });
            } else {    // refresh token expired
                this.logout();
            }
        }
        if (!dispatched) {
            setTimeout(this.checkUserToken, TOKEN_CHECK_INTERVAL * 1000);
        }
    }

    /**
     * Persist user object
     * Parse token and save user object, update react component state
     * @param res Axios response object
     * @param remember {boolean} remember user across session
     */
    saveUser(res, remember) {
        // extract token
        const accessToken = res.data["data"]["access_token"];
        const refreshToken = res.data["data"]["refresh_token"];
        // get user uuid, role
        const accessTokenPayload = JSON.parse(atob(accessToken.split(".")[1]))
        const refreshTokenPayload = JSON.parse(atob(refreshToken.split(".")[1]))
        // get token expiration
        const accessTokenExp = accessTokenPayload["exp"];
        const refreshTokenExp = refreshTokenPayload["exp"];
        // construct user for context
        const user = {
            "uuid": accessTokenPayload["uuid"],
            "role": accessTokenPayload["operator_type"],
            "accessToken": accessToken,
            "refreshToken": refreshToken,
            "accessTokenExp": accessTokenExp,
            "refreshTokenExp": refreshTokenExp,
            "rememberMe": remember
        }
        // persist data
        remember === true ?
            Storage.setLocalItem("user", JSON.stringify(user)) :
            Storage.setSessionItem("user", JSON.stringify(user));
        // update state
        this.setState({
            user: user
        })
    }

    /**
     * Send HTTP request
     * @param options {Object}
     * @returns {AxiosPromise<any>}
     */
    async request(options) {
        // prepend url
        options.url = API_URL + options.path;
        // append user token
        const user = this.getUser()
        if (user) {
            options.header = {
                ...options.header,
                Authorization: "Bearer " + user["accessToken"]
            }
        }
        return axios(options);
    }

    /**
     * User login
     * @param username {string} username (email)
     * @param password {string} password (plaintext)
     * @param remember {boolean} remember login across sessions
     * @returns {boolean} true if login successful, false if failed
     */
    async login(username, password, remember) {
        // call login api
        let passwordHash = SHA1(password).toString();
        let res;
        try {
            res = await axios({
                url: API_URL + "/oauth2/token",
                method: "post",
                data: querystring.stringify({
                    grant_type: "password",
                    password: passwordHash,
                    username: username
                })
            })
        } catch (e) {
            console.error(e);
            throw e;
        }
        this.saveUser(res, remember);
        return true;
    };

    /**
     * User logout
     * @returns {boolean} true if successful
     */
    logout() {
        // remove login info from storage
        Storage.removeItem("user")
        this.setState({
            user: null
        })
        return true;
    };

    render() {
        return (
            <AuthContext.Provider value={{
                "getUser": this.getUser,
                "login": this.login,
                "logout": this.logout,
                "request": this.request
            }}>
                {this.props.children}
            </AuthContext.Provider>
        )
    }
}