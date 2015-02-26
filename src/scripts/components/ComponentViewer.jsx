'use strict';

var React = require('react');

require('../../styles/ComponentViewer.sass');

var ComponentViewer = React.createClass({
  render: function () {
    var conceptLink = (this.props.item.CMD_Component["@ConceptLink"] != null) ? <li><span>ConceptLink:</span> <a href={this.props.item.CMD_Component["@ConceptLink"]}>{this.props.item.CMD_Component["@ConceptLink"]}</a></li> : null;
    var groupName = (this.props.registry && this.props.registry.groupName) ? <li><span>Group Name:</span> {(this.props.registry) ? this.props.registry.groupName : ""}</li> : null;
    var list = (<ul>
      <li><span>Name:</span> <b>{this.props.item.Header.Name}</b></li>
      {groupName}
      <li><span>Description:</span> {this.props.item.Header.Description}</li>
      {conceptLink}
    </ul>);
    return (
      <div className="ComponentViewer">{list}</div>
      );
  }
});

module.exports = ComponentViewer;
