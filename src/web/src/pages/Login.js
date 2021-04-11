import React from 'react';
import {Row, Col, Alert} from 'antd';
import {Form, Input, Button, Checkbox} from 'antd';
import {LockOutlined, MailOutlined} from '@ant-design/icons';
import {Card} from 'antd';
import './Login.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import {Helmet} from "react-helmet";

const ERROR = {
    WRONG_PASSWORD: 0,
    INTERNAL_ERROR: 1,
    NETWORK_ISSUE: 2
}

export default class Login extends React.PureComponent {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.onFinish = this.onFinish.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.state = {
            "login": false,
            "error": null
        }
    }

    async onFinish(values) {
        this.setState({
            "login": true,
            "error": null
        });
        try {
            await this.context.login(values.email, values.password, values.remember);
        } catch (e) {
            if (e.response && e.response.status === 403) {
                this.setState({
                    "error": ERROR.WRONG_PASSWORD
                });
            } else if (e.response && e.response.status >= 500) {
                this.setState({
                    "error": ERROR.INTERNAL_ERROR
                });
            } else {
                this.setState({
                    "error": ERROR.NETWORK_ISSUE
                });
            }
        } finally {
            this.setState({
                "login": false
            })
        }
    };

    onInputChange() {
        this.setState({
            "error": null
        })
    }

    render() {
        // redirect user if already logged in
        if (this.context.getUser() !== null) {
            return <Redirect to={{pathname: "/"}}/>
        }

        const error = this.state["error"]

        return (
            <>
                <Helmet>
                    <title>GMS - Login</title>
                </Helmet>
                <Row className={"LoginForm"}
                     align="middle"
                     justify="center">
                    <Col>
                        <Card title={"Login to GMS"}>
                            {error !== null &&
                            <>
                                <Alert message={
                                    error === ERROR.WRONG_PASSWORD && "Wrong username or password" ||
                                    error === ERROR.INTERNAL_ERROR && "Server error" ||
                                    error === ERROR.NETWORK_ISSUE && "Network problem"
                                } type="error" showIcon/>
                                <br/>
                            </>}
                            <Form
                                name="normal_login"
                                className="login-form"
                                initialValues={{remember: true}}
                                onFinish={this.onFinish}
                            >
                                <Form.Item
                                    name="email"
                                    rules={[{required: true, message: 'Please input your Username!'}]}
                                >
                                    <Input prefix={<MailOutlined/>}
                                           placeholder="Email"
                                           onChange={this.onInputChange}/>
                                </Form.Item>
                                <Form.Item
                                    name="password"
                                    rules={[{required: true, message: 'Please input your Password!'}]}
                                >
                                    <Input
                                        prefix={<LockOutlined/>}
                                        type="password"
                                        placeholder="Password"
                                        onChange={this.onInputChange}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Form.Item name="remember" valuePropName="checked" noStyle>
                                        <Checkbox>Remember me</Checkbox>
                                    </Form.Item>

                                    <a href=""
                                       hidden={true}>
                                        Forgot password
                                    </a>
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary"
                                            htmlType="submit"
                                            block={true}
                                            loading={this.state["login"]}>
                                        Log in
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    }
}