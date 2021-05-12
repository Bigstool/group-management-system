import React from "react";
import PropTypes from "prop-types";
import {Button, Input} from 'antd';
import styles from './GroupProfileForm.scss';

/* Bigstool's class notations
*  #T: Top-level component
*  #C: Sub-component of #T
*  #CC: Sub-component of #C
*  etc.
*/

// #T
export default class GroupProfileForm extends React.Component {
  static propTypes = {
    // Variables
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    proposal: PropTypes.string.isRequired,
    // Event handlers
    onNameChange: PropTypes.func.isRequired,
    onTitleChange: PropTypes.func.isRequired,
    onDescriptionChange: PropTypes.func.isRequired,
    onProposalChange: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    // Event
    saving: PropTypes.bool.isRequired,
    // Option
    disableSave: PropTypes.bool,
    disableName: PropTypes.bool,
  };

  static defaultProps = {
    disableSave: false,
    disableName: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      // Group related
      nameLimit: 20,
      titleLimit: 80,
      descriptionLimit: 150,
      proposalLimit: 300,
    }
  }

  render() {
    // Name (Group Owner) (Before Grouping DDL) or (Admin) (All Stages)
    let name = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Group Name<span className={styles.Required}>*</span></h1>
      <Input className={styles.Content} onChange={this.props.onNameChange}
             value={this.props.name} maxLength={this.state.nameLimit}
             disabled={this.props.disableName}/>
    </div>;

    // Title (Group Owner or Admin) (All Stages)
    let title = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Title<span className={styles.Required}>*</span></h1>
      <Input className={styles.Content} onChange={this.props.onTitleChange}
             value={this.props.title} maxLength={this.state.titleLimit}/>
    </div>;

    // Description (Group Owner or Admin) (All Stages)
    let description = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Short description<span className={styles.Required}>*</span></h1>
      <p className={styles.Description}>
        Briefly describe your project in 1-2 sentences.
        This will be shown on the home page.
      </p>
      <Input.TextArea showCount className={styles.Content} rows={2} onChange={this.props.onDescriptionChange}
                      value={this.props.description} maxLength={this.state.descriptionLimit}/>
      <div className={styles.Gap} />
    </div>;

    // Proposal (Group Owner or Admin) (All Stages)
    let proposal = <div className={styles.EditItem}>
      <h1 className={styles.Title}>Proposal</h1>
      <Input.TextArea showCount className={styles.Content} rows={5} onChange={this.props.onProposalChange}
                      value={this.props.proposal} maxLength={this.state.proposalLimit}/>
      <div className={styles.Gap} />
    </div>;

    let Save = <React.Fragment>
      <div className={styles.Gap} />
      <div className={styles.Gap} />
      <Button type={'primary'} block size={'large'} onClick={this.props.onSave} loading={this.props.saving}
              disabled={!this.props.name || !this.props.title || !this.props.description || this.props.disableSave}>
        Save
      </Button>
    </React.Fragment>;

    let Cancel = <React.Fragment>
      <div className={styles.Gap} />
      <Button block size={'large'} onClick={this.props.onCancel}>Cancel</Button>
    </React.Fragment>;

    return (
      <React.Fragment>
        <div className={styles.GroupProfileForm}>
          {name}
          {title}
          {description}
          {proposal}
          {Save}
          {Cancel}
        </div>
      </React.Fragment>
    )
  }
}