export default class Storage {
    // localStorage: saved forever
    // sessionStorage: saved until browser closed

    static getItem = (key) => (window.sessionStorage.getItem(key) || window.localStorage.getItem(key));
    static setLocalItem = (k, v) => window.localStorage.setItem(k, v);
    static setSessionItem = (k, v) => window.sessionStorage.setItem(k, v);
    static removeItem = (key) => (window.sessionStorage.removeItem(key) || window.localStorage.removeItem(key))
}