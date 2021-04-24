import React from 'react';
import './GroupList.scss';
import AppBar from "../components/AppBar";
import TabNav from "../components/TabNav";
import {Button, Result, Tabs} from "antd";
import * as PropTypes from "prop-types";
import {LoadingOutlined} from "@ant-design/icons";
import GroupCard from "../components/GroupCard";
import {AuthContext} from "../utilities/AuthProvider";

export default class GroupList extends React.PureComponent {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            groupList: null,
            error: null
        }
    }

    onRefreshButtonClicked() {
        location.reload();
    }

    async componentDidMount() {
        try {
            const res = await this.context.request({
                path: "/group",
                method: "get"
            });
            this.setState({
                groupList: res.data.data
            });
        } catch (e) {
            console.error(e);
            this.setState({
                error: e.response && e.response.data || true
            });
        } finally {
            this.setState({
                loading: false
            });
        }
    }

    render() {
        const errorMsg = <Result status={"error"}
                                 title={"Error completing your request"}
                                 extra={
                                     <Button type={"primary"} onClick={this.onRefreshButtonClicked}>Refresh</Button>
                                 }/>;
        return (
            <>
                <AppBar showBack={false}/>
                <Tabs defaultActiveKey="1"
                      centered={true}>
                    <Tabs.TabPane tab="Groups" key="1">
                        {this.state.loading ?
                            <LoadingOutlined/> :
                            this.state.groupList && this.state.groupList.map((groupItem) => (
                                <GroupCard key={groupItem.uuid} groupItem={groupItem}/>
                            ))
                        }
                        {this.state.error !== null && errorMsg}
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Favorites" key="2">
                        {this.state.loading ?
                            <LoadingOutlined/> :
                            this.state.groupList && this.state.groupList
                                .filter(groupItem => groupItem["favorite"])
                                .map((groupItem) => (
                                    <GroupCard key={groupItem.uuid} groupItem={groupItem}/>
                                ))
                        }
                        {this.state.error !== null && errorMsg}
                    </Tabs.TabPane>
                </Tabs>
                <TabNav active={"GROUP_LIST"}/>
            </>
        )
    }
}