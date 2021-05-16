import React from "react";
import AppBar from "../components/AppBar";
import {Empty, List} from "antd";
import {FolderOutlined, LoadingOutlined} from "@ant-design/icons";
import {AuthContext} from "../utilities/AuthProvider";
import ErrorMessage from "../components/ErrorMessage";
import {Link} from "react-router-dom";

export default class ArchiveList extends React.PureComponent {
  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      archiveList: null,
      error: null
    };
  }

  async componentDidMount() {
    try {
      const resSemester = await this.context.request({
        path: "/semester",
        method: "get"
      });
      this.setState({
        archiveList: resSemester.data.data,
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
    return (
      <>
          <AppBar backTo={'/user'}/>
          {this.state.loading && <LoadingOutlined/>}
          {this.state.error !== null && <ErrorMessage/>}
          {this.state.loading || this.state.archiveList &&
          <List>
            {this.state.archiveList.length === 0 && <Empty/>}
            {this.state.archiveList.map(item => (
              <Link to={`/semester/archive/${item.uuid}`}>
                <List.Item>
                  <List.Item.Meta
                    avatar={<FolderOutlined/>}
                    title={item.name}
                  />
                </List.Item>
              </Link>

            ))}
          </List>
          }
      </>
    );
  }

}