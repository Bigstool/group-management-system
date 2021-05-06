import React from "react";
import Storage from "./Storage";
import querystring from "querystring";
import SHA1 from "crypto-js/sha1";
import axios from "axios";
import {boundMethod} from "autobind-decorator";

const API_URL = "https://gms.bigstool.com/api";
const TOKEN_EXPIRE_MARGIN = 30; // seconds

export const AuthContext = React.createContext();

export class AuthProvider extends React.Component {

  constructor(props) {
    super(props);
    // get user from local storage
    this.state = {
      user: JSON.parse(Storage.getItem("user")),
      userProfile: null,
      systemConfig: null
    };
    if (this.state.user) {
      console.debug(`Auto login as ${this.state.user.role}: ${this.state.user.uuid}\n` +
        `accessTokenExp: ${new Date(this.state.user.accessTokenExp * 1000)}\n` +
        `refreshTokenExp: ${new Date(this.state.user.refreshTokenExp * 1000)}`);
    }
    // schedule task
    // this.checkUserToken();
    console.debug("AuthContext created");
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
  @boundMethod
  getUser() {
    return this.state.user;
  }

  /**
   * Get user profile
   * @typedef UserProfile
   * @type {object}
   * @property {string} email
   * @property {string} alias
   * @property {string} bio
   * @property {object|null} created_group
   * @property {object|null} joined_group
   *
   * @param useCache {boolean} true: use previously fetched state; false: force fetch from backend(will renew state)
   * @returns {Promise<null|UserProfile>}
   */
  @boundMethod
  async getUserProfile(useCache = true) {
    if (this.state.user === null) return null;
    if (useCache && this.state.userProfile !== null) return this.state.userProfile;
    const res = await this.request({
      path: `/user/${this.state.user.uuid}`,
      method: "get"
    });
    this.setState({
      userProfile: res.data.data
    });
    return res.data.data;
  }

  /**
   * Get system config
   * @typedef SysConfig
   * @type {object}
   * @property {Array} group_member_number
   * @property {object} system_state
   *
   * @param useCache true: use previously fetched state; false: force fetch from backend(will renew state)
   * @returns {Promise<null|SysConfig>}
   */
  @boundMethod
  async getSysConfig(useCache = true) {
    if (useCache && this.state.systemConfig !== null) return this.state.systemConfig;
    const res = await this.request({
      path: '/sysconfig',
      method: "get"
    });
    this.setState({
      systemConfig: res.data.data
    });
    return res.data.data;
  }

  /**
   * Check token expiration and refresh if needed
   */
  async checkUserToken() {
    const user = this.state.user;
    if (user && user.accessTokenExp < Date.now() / 1000 + TOKEN_EXPIRE_MARGIN) {  // access token expired
      if (user.refreshTokenExp > Date.now() / 1000) {  // refresh token not expired
        console.debug("Access token expired, refreshing");
        try {
          const res = await axios({
            url: API_URL + "/oauth2/refresh",
            method: "post",
            data: querystring.stringify({
              grant_type: "refresh",
              refresh_token: user["refreshToken"]
            })
          });
          this.saveUser(res, user["rememberMe"]);
          console.debug("Token refreshed");
        } catch (e) {
          console.error(e);
          console.debug("Failed refreshing token, logout");
          this.logout();
        }
      } else {    // refresh token expired
        console.debug("Refresh token expired, logout");
        this.logout();
      }
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
    const accessTokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
    const refreshTokenPayload = JSON.parse(atob(refreshToken.split(".")[1]));
    // get token expiration
    const accessTokenExp = accessTokenPayload["exp"];
    const refreshTokenExp = refreshTokenPayload["exp"];
    // construct user for context
    const user = {
      "uuid": accessTokenPayload["uuid"],
      "role": accessTokenPayload["role"],
      "accessToken": accessToken,
      "refreshToken": refreshToken,
      "accessTokenExp": accessTokenExp,
      "refreshTokenExp": refreshTokenExp,
      "rememberMe": remember
    };
    // persist data
    remember === true ?
      Storage.setLocalItem("user", JSON.stringify(user)) :
      Storage.setSessionItem("user", JSON.stringify(user));
    // update state
    this.setState({
      user: user
    });
  }

  /**
   * Send HTTP request
   * @param options {Object}
   * @returns {AxiosPromise<any>}
   */
  @boundMethod
  async request(options) {
    await this.checkUserToken();
    if (!options.path) throw "'path' is required in options";
    // prepend url
    options.url = API_URL + options.path;
    // append user token
    const user = this.getUser();
    if (user !== null) {
      options.headers = {
        ...options.headers,
        Authorization: "Bearer " + user["accessToken"]
      };
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
  @boundMethod
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
      });
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
  @boundMethod
  logout() {
    // remove login info from storage
    Storage.removeItem("user");
    this.setState({
      user: null
    });
    return true;
  };

  render() {
    return (
      <AuthContext.Provider value={{
        "getUser": this.getUser,
        "getUserProfile": this.getUserProfile,
        "getSysConfig": this.getSysConfig,
        "login": this.login,
        "logout": this.logout,
        "request": this.request
      }}>
        {this.props.children}
      </AuthContext.Provider>
    );
  }
}