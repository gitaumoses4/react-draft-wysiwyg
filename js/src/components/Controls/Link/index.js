/* @flow */

import React, { Component, PropTypes } from 'react';
import { FormattedMessage } from 'react-intl';
import { Entity, RichUtils, EditorState, Modifier } from 'draft-js';
import {
  getSelectionText,
  getEntityRange,
  getSelectionEntity,
} from 'draftjs-utils';

import LayoutComponent from './Component';

class Link extends Component {

  static propTypes = {
    editorState: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    modalHandler: PropTypes.object,
    config: PropTypes.object,
  };

  state: Object = {
    expanded: false,
  };

  componentWillMount(): void {
    const { editorState, modalHandler } = this.props;
    if (editorState) {
      this.setState({
        currentEntity: getSelectionEntity(editorState),
      });
    }
    modalHandler.registerCallBack(this.expandCollapse);
  }

  componentWillReceiveProps(properties: Object): void {
    const newState = {};
    if (properties.editorState &&
      this.props.editorState !== properties.editorState) {
      newState.currentEntity = getSelectionEntity(properties.editorState);
    }
    this.setState(newState);
  }

  componentWillUnmount(): void {
    const { modalHandler } = this.props;
    modalHandler.deregisterCallBack(this.expandCollapse);
  }

  expandCollapse: Function = (): void => {
    this.setState({
      expanded: this.signalExpanded,
    });
    this.signalExpanded = false;
  }

  onExpandEvent: Function = (): void => {
    this.signalExpanded = !this.state.expanded;
  };

  doExpand: Function = (): void => {
    this.setState({
      expanded: true,
    });
  };

  doCollapse: Function = (): void => {
    this.setState({
      expanded: false,
    });
  };

  onChange = (action, title, target) => {
    if (action === 'add') {
      this.addLink(title, target);
    } else {
      this.removeLink();
    }
  }

  removeLink: Function = (): void => {
    const { editorState, onChange } = this.props;
    const { currentEntity } = this.state;
    let selection = editorState.getSelection();
    if (currentEntity) {
      const entityRange = getEntityRange(editorState, currentEntity);
      selection = selection.merge({
        anchorOffset: entityRange.start,
        focusOffset: entityRange.end,
      });
      onChange(RichUtils.toggleLink(editorState, selection, null));
    }
  };

  addLink: Function = (linkTitle, linkTarget): void => {
    const { editorState, onChange } = this.props;
    const { currentEntity } = this.state;
    let selection = editorState.getSelection();

    if (currentEntity) {
      const entityRange = getEntityRange(editorState, currentEntity);
      selection = selection.merge({
        anchorOffset: entityRange.start,
        focusOffset: entityRange.end,
      });
    }
    const entityKey = editorState
      .getCurrentContent()
      .createEntity('LINK', 'MUTABLE', { url: linkTarget })
      .getLastCreatedEntityKey();

    let contentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      selection,
      `${linkTitle}`,
      editorState.getCurrentInlineStyle(),
      entityKey,
    );
    let newEditorState = EditorState.push(editorState, contentState, 'insert-characters');

    // insert a blank space after link
    selection = newEditorState.getSelection().merge({
      anchorOffset: selection.get('anchorOffset') + linkTitle.length,
      focusOffset: selection.get('anchorOffset') + linkTitle.length,
    });
    newEditorState = EditorState.acceptSelection(newEditorState, selection);
    contentState = Modifier.insertText(
      newEditorState.getCurrentContent(),
      selection,
      ' ',
      newEditorState.getCurrentInlineStyle(),
      undefined
    );
    onChange(EditorState.push(newEditorState, contentState, 'insert-characters'));
    this.doCollapse();
  };

  render(): Object {
    const { config } = this.props;
    const { expanded, currentEntity } = this.state
    const LinkComponent = config.component || LayoutComponent;
    return (
      <LinkComponent
        config={config}
        expanded={expanded}
        onExpandEvent={this.onExpandEvent}
        doExpand={this.doExpand}
        doCollapse={this.doCollapse}
        currentValue={currentEntity}
        onChange={this.onChange}
      />
    );
  }
}

export default Link;


// todo refct
// 1. better action names here
// 2. align update signatue
// 3. align current value signature



        // if (newState.showModal) {
    //   const { editorState } = this.props;
    //   const { currentEntity } = this.state;
    //   const contentState = editorState.getCurrentContent();
    //   newState.linkTarget = undefined;
    //   newState.linkTitle = undefined;
    //   if (currentEntity && (contentState.getEntity(currentEntity).get('type') === 'LINK')) {
    //     newState.entity = currentEntity;
    //     const entityRange = currentEntity && getEntityRange(editorState, currentEntity);
    //     newState.linkTarget = currentEntity && contentState.getEntity(currentEntity).get('data').url;
    //     newState.linkTitle = (entityRange && entityRange.text) ||
    //       getSelectionText(editorState);
    //   } else {
    //     newState.linkTitle = getSelectionText(editorState);
    //   }
    // }

