import React from 'react';
import './Home.scss';
import {Tabs} from "antd";
const { TabPane } = Tabs;

export default class Home extends React.PureComponent {
    render() {

        return (
            <>
                <div className={"MainTitle"}>The main app after login</div>
                <Tabs defaultActiveKey="1">
                    <TabPane tab="Tab 1" key="1">
                        Content of Tab Pane 1
                    </TabPane>
                    <TabPane tab="Tab 2" key="2">
                        Content of Tab Pane 2
                    </TabPane>
                    <TabPane tab="Tab 3" key="3">
                        Content of Tab Pane 3
                    </TabPane>
                </Tabs>
            </>
        )
    }
}