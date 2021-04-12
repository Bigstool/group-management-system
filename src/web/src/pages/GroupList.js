import React from 'react';
import './GroupList.scss';
import AppBar from "../components/AppBar";
import TabNav from "../components/TabNav";
import {Tabs} from "antd";
import * as PropTypes from "prop-types";
import {LoadingOutlined} from "@ant-design/icons";
import GroupCard from "../components/GroupCard";

export default class GroupList extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            groupList: null,
            error: null
        }
        setTimeout(() => {
            this.setState({
                groupList: [
                    {
                        "application_enable": true,
                        "creation_time": 1617189103,
                        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.",
                        "favorite": false,
                        "member_count": 4,
                        "name": "Jaxzefalk",
                        "owner": {
                            "alias": "Ming Li",
                            "email": "Ming.Li@example.com"
                        },
                        "uuid": "b86a6406-14ca-4459-80ea-c0190fc43bd3"
                    },
                    {
                        "application_enable": true,
                        "creation_time": 1617189103,
                        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.",
                        "favorite": false,
                        "member_count": 4,
                        "name": "Jaxzefalk",
                        "owner": {
                            "alias": "Ming Li",
                            "email": "Ming.Li@example.com"
                        },
                        "uuid": "b86a6406-14ca-4459-80ea-c0190fc43bd3"
                    },
                    {
                        "application_enable": true,
                        "creation_time": 1617189103,
                        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.",
                        "favorite": false,
                        "member_count": 4,
                        "name": "Jaxzefalk",
                        "owner": {
                            "alias": "Ming Li",
                            "email": "Ming.Li@example.com"
                        },
                        "uuid": "b86a6406-14ca-4459-80ea-c0190fc43bd3"
                    },
                    {
                        "application_enable": true,
                        "creation_time": 1617189103,
                        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.",
                        "favorite": true,
                        "member_count": 4,
                        "name": "Jaxzefalk",
                        "owner": {
                            "alias": "Ming Li",
                            "email": "Ming.Li@example.com"
                        },
                        "uuid": "b86a6406-14ca-4459-80ea-c0190fc43bd3"
                    }
                ],
                loading: false
            })
        }, 3000)
    }

    render() {

        return (
            <>
                <AppBar showBack={false}/>
                <Tabs defaultActiveKey="1"
                      centered={true}>
                    <Tabs.TabPane tab="Groups" key="1">
                        {this.state["loading"] ?
                            <LoadingOutlined/> :
                            this.state["groupList"].map((groupItem) => (
                                <GroupCard groupItem={groupItem}/>
                            ))
                        }
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Favorites" key="2">
                        {this.state["loading"] ?
                            <LoadingOutlined/> :
                            this.state["groupList"]
                                .filter(groupItem => groupItem["favorite"])
                                .map((groupItem) => (
                                    <GroupCard groupItem={groupItem}/>
                                ))
                        }
                    </Tabs.TabPane>
                </Tabs>
                <TabNav active={"GROUP_LIST"}/>
            </>
        )
    }
}