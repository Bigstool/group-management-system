import React from 'react';
import './GroupList.scss';
import AppBar from "../components/AppBar";
import TabNav from "../components/TabNav";

export default class GroupList extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render() {

        return (
            <>
                <AppBar showBack={false}/>
                <div className={"MainTitle"}>Group list</div>
                <TabNav active={"GROUP_LIST"}/>
            </>
        )
    }
}