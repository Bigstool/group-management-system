import React from 'react';
import {Row, Col} from 'antd';
import {Form, Input, Button, Checkbox} from 'antd';
import {Card} from 'antd';
import './Login.scss';
import {AuthContext} from "../utilities/AuthProvider";
import {Redirect} from "react-router-dom";

export default class Login extends React.PureComponent {
    static contextType = AuthContext;

    render() {
        // TODO redirect user if already logged in
        if (this.context.user) {
            return <Redirect to={{pathname: "/"}}/>
        }

        const onFinish = (values) => {
            let login_success = this.context.login();
            console.log('Success:', values);
        };

        const onFinishFailed = (errorInfo) => {
            console.log('Failed:', errorInfo);
        };

        return (
            <Row className={"LoginForm"}
                 align="middle"
                 justify="center">
                <Col>
                    <Card title={"Login"}>
                        <Form labelCol={{span: 8}}
                              wrapperCol={{span: 16}}
                              name="basic"
                              initialValues={{remember: true}}
                              onFinish={onFinish}
                              onFinishFailed={onFinishFailed}
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
        );
    }
}