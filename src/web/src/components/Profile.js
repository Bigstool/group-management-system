import React from 'react';
import {Button, Avatar, PageHeader, Tag, Row, Col} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import "./Profile.scss";

//Root
export default class Profile extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <>
                <PlaceholderHeader/>
                <div className={'profilePage'}>
                    <UserInfoBar/>
                    <div className={'head-margin'}/>
                    <Row className={'ProfileInfo'} align="middle" justify="center">
                        <div className={'Buttons'}>
                            <Button id='editProfile' type='primary'>
                                Edit Profile
                            </Button>
                            <Button id='changePassword' type='primary'>
                                Change Password
                            </Button>
                            <Button id='createGroup' type='primary'>
                                Create Group
                            </Button>
                            <Button id='semesterTools' type='primary'>
                                Semester Tools
                            </Button>
                            <Button id='reports' type='primary'>
                                Reports
                            </Button>
                            <Button id='archives' type='primary'>
                                Archives
                            </Button>
                        </div>
                    </Row>
                    <div className={'bottom-margin'}/>
                </div>
            </>
        );
    }
}

//Component
class PlaceholderHeader extends React.Component {
    render() {
        return (
            <PageHeader
                className="site-page-header"
                title="Title"
                subTitle="This is a subtitle"
            />
        );
    }
}

//Component
class UserInfoBar extends React.Component{
    constructor(props) {
        super(props);
    }
    render() {
        const userName = <p className={'userName'} title={'Will Smith'}>Will Smith</p>;
        const email = <p className={'email'} title={'will.smith@student.xjtlu.edu.cn'}>will.smith@student.xjtlu.edu.cn</p>;
        const bio = <p className={'bio'} title={'ics programme, proficient in java'}>ics programme, proficient in java</p>;

        let infoBarExample = null;
        if (false) {
            infoBarExample = <PageHeader

            />;
        }

        return(
            <>
                <Row className={'ProfileInfo'} align="middle" justify="center">
                    <Avatar size={64} icon={<UserOutlined />} />
                    <span>
                        {userName}
                        {email}
                        {bio}
                    </span>
                </Row>
                {infoBarExample}
            </>
        );
    }
}