import React from 'react';
import { Button } from 'antd';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
// import "./Profile.scss";

export default class Profile extends React.PureComponent {
    render() {
        return (
            <>
                <div>
                    <Avatar size={64} icon={<UserOutlined/>}/>
                </div>
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
            </>
        );
    }
}