'use strict';
var log = require('loglevel');

var React = require('react');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//bootstrap
var Button = require('react-bootstrap/lib/Button');

//utils
var _ = require('lodash');

var VocabularyBatchEditor = React.createClass({
    mixins: [ImmutableRenderMixin],

    propTypes: {
      items: React.PropTypes.array.isRequired,
      onClose: React.PropTypes.func,
      onCancel: React.PropTypes.func
    },

    getInitialState: function() {
      return {
        data: ""
      }
    },

    componentDidMount: function() {
      this.createCsvFromItems();
    },

    componentDidUpdate: function(prevProps, prevState) {
      if(prevProps.items != this.props.items) {
        this.createCsvFromItems();
      }
    },

    createCsvFromItems: function() {
      this.setState({
        data: serializeItems(this.props.items)
      });
    },

    submit: function() {
      var items = deserializeItems(this.refs.dataField);
      this.props.onClose(items);
    },

    onChange: function(evt) {
      this.setState({data: evt.target.value});
    },

    render: function() {
      return (
        <div className="vocabulary-batch-editing">
          <strong>Batch editing mode</strong>
          <div>
            <textarea ref="dataField" value={this.state.data} onChange={this.onChange} />
          </div>
          <div>
            <Button onClick={this.submit}>Ok</Button>
            <Button onClick={this.props.onCancel}>Cancel</Button>
          </div>
        </div>
      );
    }

});

module.exports = VocabularyBatchEditor;


function serializeItems(items) {
  log.debug("Serializing items to csv", items);
  //TODO
  return "items";
}

function deserializeItems(data) {
  log.debug("Deserializing items from csv", data);
  //TODO
  return [{'$': 'test'}];
}
