import React from 'react';
import styles from './GroupList.scss';
import AppBar from "../components/AppBar";
import TabNav from "../components/TabNav";
import {Button, Result, Tabs} from "antd";
import * as PropTypes from "prop-types";
import {LoadingOutlined} from "@ant-design/icons";
import GroupCard from "../components/GroupCard";
import {AuthContext} from "../utilities/AuthProvider";
import PageContainer from "../components/PageContainer";

export default class GroupList extends React.PureComponent {
  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      groupList: null,
      applicationList: null,
      topGroupUuid: null,
      error: null
    };
  }

  onRefreshButtonClicked() {
    location.reload();
  }

  async componentDidMount() {
    try {
      const resGroup = await this.context.request({
        path: "/group",
        method: "get"
      });
      const resApplication = await this.context.request({
        path: `/user/${this.context.getUser().uuid}/application`,
        method: "get"
      });
      const userProfile = await this.context.getUserProfile(false);
      const topGroupUuid = userProfile.joined_group?.uuid || userProfile.created_group?.uuid;
      this.setState({
        groupList: resGroup.data.data,
        applicationList: resApplication.data.data,
        topGroupUuid: topGroupUuid,
        loading: false
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: e.response && e.response.data || true,
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
        <PageContainer
          header={<AppBar backTo={false}/>}
          footer={<TabNav active={"GROUP_LIST"}/>}>
          <Tabs defaultActiveKey="1"
                centered={true}>
            <Tabs.TabPane tab="Groups" key="1">
              {this.state.loading && <LoadingOutlined/>}
              {this.state.loading || this.state.groupList && this.state.topGroupUuid &&
              <GroupCard highlight={true}
                         groupItem={this.state.groupList.find(item => (item.uuid === this.state.topGroupUuid))}/>
              }
              {this.state.loading || this.state.groupList && this.state.groupList
                .filter(item => (item.favorite && item.uuid !== this.state.topGroupUuid))
                .map(item => (
                  <GroupCard key={item.uuid} groupItem={item}/>
                ))
              }
              {this.state.loading || this.state.groupList && this.state.groupList
                .filter(item => (!item.favorite && item.uuid !== this.state.topGroupUuid))
                .map(item => (
                  <GroupCard key={item.uuid} groupItem={item}/>
                ))
              }
              {this.state.error !== null && errorMsg}
            </Tabs.TabPane>
            {this.state.loading || this.state.topGroupUuid || this.context.getUser().role === "ADMIN" ||
            <Tabs.TabPane tab="Applied" key="2">
              {this.state.applicationList && this.state.applicationList
                .map(item => (
                  <GroupCard key={item.uuid} groupItem={item.group}/>
                ))
              }
              {this.state.error !== null && errorMsg}
            </Tabs.TabPane>
            }
          </Tabs>
        </PageContainer>
      </>
    );
  }
}