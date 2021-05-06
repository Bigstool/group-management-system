import {Button, Result} from "antd";
import React from "react";

export default class ErrorMessage extends React.PureComponent {
  onRefreshButtonClicked() {
    location.reload();
  }

  render() {
    return (
      <Result status={"500"}
              title={"Oops, something went wrong"}
              subTitle={"Perhaps refresh?"}
              extra={
                <Button type={"primary"} onClick={this.onRefreshButtonClicked}>Refresh</Button>
              }/>
    );
  }
}