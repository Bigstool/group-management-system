import React from "react";
import styles from "./PageContainer.scss";
import PropTypes from "prop-types";

export default class PageContainer extends React.PureComponent {
  static propTypes = {
    header: PropTypes.node,
    footer: PropTypes.node
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <>
        <div className={styles.PageContainer}>
          <div className={styles.PageContent}>
            {this.props.header &&
            this.props.header}
            {this.props.children}
          </div>
          {this.props.footer &&
          <footer>
            {this.props.footer}
          </footer>}
        </div>
      </>
    );
  }
}
