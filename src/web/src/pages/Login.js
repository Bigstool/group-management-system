import React from 'react';
import {Row, Col} from 'antd';
import {Form, Input, Button, Checkbox} from 'antd';
import {Card} from 'antd';
import './Login.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";
import {Helmet} from "react-helmet";

export default class Login extends React.PureComponent {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.onFinish = this.onFinish.bind(this);
        this.onFinishFailed = this.onFinishFailed.bind(this);
    }

    onFinish(values) {
        try {
            this.context.login(values.email, values.password, values.remember);
        } catch (e) {
            // TODO
        }
    };

    onFinishFailed(errorInfo) {
        console.log('Failed:', errorInfo);
    };

    render() {
        // redirect user if already logged in
        if (this.context.getUser() !== null) {
            return <Redirect to={{pathname: "/"}}/>
        }

        return (
            <>
                <Helmet>
                    <title>GMS - Login</title>
                </Helmet>
                <Row className={"LoginForm"}
                     align="middle"
                     justify="center">
                    <Col>
                        <Card title={"Login"}>
                            <Form labelCol={{span: 8}}
                                  wrapperCol={{span: 16}}
                                  name="basic"
                                  initialValues={{remember: true}}
                                  onFinish={this.onFinish}
                                  onFinishFailed={this.onFinishFailed}
                            >
                                <Form.Item label="E-mail"
                                           name="email"
                                           rules={[{required: true, message: 'Please input your e-mail!'}]}
                                >
                                    <Input/>
                                </Form.Item>

                                <Form.Item label="Password"
                                           name="password"
                                           rules={[{required: true, message: 'Please input your password!'}]}
                                >
                                    <Input.Password/>
                                </Form.Item>

                                <Form.Item wrapperCol={{offset: 8, span: 16}}
                                           name="remember"
                                           valuePropName="checked">
                                    <Checkbox>Remember me</Checkbox>
                                </Form.Item>

                                <Form.Item wrapperCol={{offset: 8, span: 16}}>
                                    <Button
                                        type="primary"
                                        htmlType="submit">
                                        Login
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