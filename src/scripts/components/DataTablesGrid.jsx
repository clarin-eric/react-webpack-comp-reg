'use strict';

var React = require('react/addons');
var LoadingMixin = require('../mixins/LoadingMixin');
var DataTablesRow = require('./DataTablesRow.jsx');
var Config = require('../config.js');

require('../../styles/DataGrid.sass');

var DataTablesWrapper = React.createClass({
  getInitialState: function() {
    return { rows: [], redraw: false }
  },
  componentDidMount: function() {
    var self = this;
    var id = this.getDOMNode().id;
    var resizeScrollBody = function() {
      var paddingBrowserDiv = $('.browser').innerHeight() - $('.browser').height();
      var newScrollBodyHeight = $('.main').outerHeight() - $('#testtable_wrapper').offset().top - $('.dataTables_scrollHead').outerHeight() - $('.dataTables_info').outerHeight() - $('.viewer').outerHeight() - paddingBrowserDiv;
      console.log('resizing dataTables scrollBody: ', newScrollBodyHeight, $('.browser').height());
      if(newScrollBodyHeight < 280) newScrollBodyHeight = 280;
      $('.dataTables_scrollBody').height(newScrollBodyHeight);
    };

    var resizeComponentViewer = function() {
      var newCompViewerHeight = $('.editor').innerHeight() - $('.ComponentViewer').offset().top + $('.btn-group').outerHeight() - $('.component-grid').outerHeight();
      console.log('resizing component viewer: ', newCompViewerHeight, $('.editor').outerHeight());
      if(newCompViewerHeight < 200) newCompViewerHeight = 200;
      $('.editor .ComponentViewer').height(newCompViewerHeight);
    };

    $( window ).resize(function() {
        $('#' + id).DataTable().draw();
    });

    $('#' + this.getDOMNode().id).on( 'draw.dt', function () {
      console.log( 'Redraw occurred at: ' + new Date().getTime() );
      self.state.redraw = false;
      if($('.browser').length)
        resizeScrollBody();
      else if($('.editor').length)
        resizeComponentViewer();
    });
  },
  /*updateRows: function() {
    //TODO: update and draw of row state still not working with filtered results, likely destroy of table req, alt opt implement own search/filter feature in React component
    console.log("child len: " + this.props.children.length);

    var rows = this.state.rows;
    return React.Children.map(this.props.children, function(child) {
        if(DataTablesRow.type == child.type) {

          if(rows != null && rows.length > 0)
            rows.each(function(index, row) {
              var data_id = $(row).data().reactid;
              var match = (data_id.indexOf(child.key.substring(child.key.lastIndexOf("_"), child.key.length)) != -1);

              if(match) {
                console.log("row react-id: " + data_id);
                console.log("match: " + match);

                var clone = React.addons.cloneWithProps(child, { selected: false, key: child.key });
                return clone;
              }
            });

          return child;

        } else
          return child;
    }.bind(this));
  },*/
  render: function() {
    console.log('render wrapper');
    return (
      <table className="table table-striped" id="testtable">
        <thead>
          <tr>
            {(this.props.multiple || this.props.editMode) ? <td/> : null}
            <td>Name</td>
            <td>Group Name</td>
            <td>Domain Name</td>
            <td>Creator</td>
            <td>Description</td>
            <td>Registration Date</td>
            <td>Comments</td>
          </tr>
        </thead>
        <tbody>
          {this.props.children}
        </tbody>
      </table>
    );
  }
});

var DataTablesGrid = React.createClass({
  mixins: [React.addons.LinkedStateMixin, LoadingMixin],
  propTypes: {
    multiple: React.PropTypes.oneOfType([
      React.PropTypes.shape({
        value: React.PropTypes.bool,
        requestChange: React.PropTypes.func
      }),
      React.PropTypes.bool
    ]).isRequired,
    type: React.PropTypes.string,
    filter: React.PropTypes.string, // published / private / group?
    component: React.PropTypes.func,
    profile: React.PropTypes.func,
    editMode: React.PropTypes.bool
  },
  getInitialState: function() {
    return {data:[], currentFilter: this.props.filter, currentType: this.props.type, multiSelect: (typeof this.props.multiple === 'boolean') ? this.props.multiple : this.props.multiple.value, lastSelectedItem: null };
  },
  getDefaultProps: function() {
    return { editMode: false };
  },
  clearTable: function() {
    $('#' + this.getDOMNode().id).hide();
    $('#' + this.getDOMNode().id).DataTable().destroy();
  },
  loadItem: function(type, itemId) {
    (this.props[type] != undefined && this.props[type] != null)
      if(typeof this.props[type] === 'function') this.props[type](itemId)
  },
  removeSelected: function() {
    //TODO fix reloading of table or removing selected items
    if(this.state.data != null && this.state.lastSelectedItem != null || $('#testtable tr.selected').length > 0) {
      console.log('Removing last selected items..');

      //var newData = React.addons.update(this.state.data, { $unshift: [this.state.lastSelectedItem.state.data]});
      //this.setState({ data: newData, lastSelectedItem: null });

      this.loadItem("profile", null);
      this.clearTable();
      this.loadData(this.state.currentFilter, this.state.currentType);
    }
  },
  loadData: function(nextFilter, nextType) { // TODO: Move into Loader mixin
    this.setLoading(true);
    var type = (nextType != null) ? nextType.toLowerCase() : this.props.type.toLowerCase();
    $.ajax({
     url: 'http://localhost:8080/ComponentRegistry/rest/registry/' + type,
     accepts: {
       json: 'application/json'
     },
     data: { unique: new Date().getTime(), registrySpace: (nextFilter != null) ? nextFilter: this.props.filter },
     dataType: 'json',
     username: Config.auth.username,
     password: Config.auth.password,
     xhrFields: {
       withCredentials: true
     },
     success: function(data) {
       var _data = data;
       if(_data != null) {
          if(_data.hasOwnProperty("componentDescription") && type == "components")
            _data = data.componentDescription;
          else if(_data.hasOwnProperty("profileDescription") && type == "profiles")
            _data = data.profileDescription;

          if(!$.isArray(_data))
            _data = [_data];
        }

       this.setState({data: (_data != null) ? _data : [], currentFilter: nextFilter || this.props.filter, currentType: nextType || this.props.type, lastSelectedItem: null});
     }.bind(this),
     error: function(xhr, status, err) {
       console.error(status, err);
     }.bind(this)
   });
 },
  componentDidMount: function(){
 		 console.log('will mount datagrid: ' + this.isMounted());
     if(this.isMounted()) this.loadData();
 	},
  shouldComponentUpdate: function(nextProps, nextState) {
    console.log('filter: ' + nextProps.filter);
    console.log('currentFilter: ' + nextState.currentFilter);
    console.log('type: ' + nextProps.type);
    console.log('currentType:' + nextState.currentType);
    console.log('prev data:' + this.state.data.length);
    console.log('data count:' + nextState.data.length);
    console.log('datatable:' + $.fn.dataTable.isDataTable('#' + this.getDOMNode().id));

    if(typeof this.props.multiple === 'boolean' && this.props.multiple != nextState.multiSelect)
      return true;
    else if(typeof this.props.multiple.requestChange === 'function' && this.props.multiple.value != nextState.multiSelect)
      return true;
    else if(nextProps.filter == nextState.currentFilter && nextProps.type == nextState.currentType) {
      console.log('filters eq:' + (this.state.data.length));
      var newData = (this.state.data.length == 0 && nextState.data.length > 0);
      if(newData) this.clearTable();
      console.log('new data: ' + newData);
      return newData || !$.fn.dataTable.isDataTable('#' + this.getDOMNode().id);
    } else {
      this.clearTable();
      this.loadData(nextProps.filter, nextProps.type);
      return false;
    }
  },
 	componentDidUpdate: function(){
     this.setLoading(false);

     var self = this;
     $('#' + this.refs.wrapper.getDOMNode().id).show();
     var table = $('#' + this.refs.wrapper.getDOMNode().id).DataTable({
         "autoWidth": true,
         "scrollY": "250px",
         "scrollCollapse": true,
         "paging": false,
         "destroy": true
       });

      table.on('search.dt', function(e, settings) {
        console.log('search event: ' + e);

        //TODO rewrite for mult-select mode
        var filtered = table.$('tr.selected', { "filter": "applied" });
        var selected = table.$('tr.selected');

        console.log('applied: ' + filtered.size());
        console.log('selected: ' + selected.size());
        console.log('all applied: ' + !(filtered.size() < selected.size()));

        if(filtered.size() < selected.size()) {
          var not_selected = selected.not(function(idx, elem) {
            console.log("idx: " + idx);
            console.log("filtered:" + filtered.size());
            console.log(filtered.toArray());

            if($.isArray(filtered.toArray()))
              return !$.inArray(elem, filtered.toArray());
            else
              return true;

          });

          not_selected.each(function(i, row) {
            console.log('deselect: ' +  table.row(row).index());
            if(!self.state.multiSelect && self.state.lastSelectedItem != row) {
              console.log('match to be deselect');
              self.state.lastSelectedItem.setState({selected: false});
              self.setState({ lastSelectedItem: null }, function() {
                self.loadItem("profile", null);
              });
            }
          });

          console.log('redraw state: ' + self.refs.wrapper.state.redraw);
          if(self.state.multiSelect && !self.refs.wrapper.state.redraw)
            self.refs.wrapper.setState({ rows: not_selected });
        }

        /*
        if(self.state.lastSelectedItem != null) {
          var row = table.row(self.state.lastSelectedItem.getDOMNode());
          if(row != null) {
            var data = row.data();
            console.log('selected row: ' + row.index());

            self.state.lastSelectedItem.setState({lastSelectedItem: null});
            self.state.lastSelectedItem = null;

            self.props.profile(null);
          }
        }
        */
      });
 	},
  rowClick: function(val, target, addComponent) {
    var self = this;
    var currentItem = this.state.lastSelectedItem;
    if(currentItem != null && currentItem != target && !this.state.multiSelect)
      currentItem.setState({selected: false});

    console.log('addComponent:' + addComponent);
    this.setState(function(state, props) {
      if(currentItem != target) {
        if(state.currentType == "profiles")
          self.loadItem("profile", val);
        else if(state.currentType == "components")
          self.loadItem("component", val);
      } else if(addComponent != undefined && state.currentType == "components") {
        console.log('add component: ' + target.refs.addButton.props.active);
        self.props.component(val, target.refs.addButton.props.active);
        //TODO deactivate button on success comple
        target.setState({ active: false });
      }

      return  { lastSelectedItem: target };
    });
  },
  componentWillReceiveProps: function(nextProps) {
    console.log('next props: ' + JSON.stringify(nextProps));
    if((this.props.multiple === 'boolean' && this.props.multiple != nextProps.multiple) ||
       (this.props.multiple.value != nextProps.multiple.value)) {
      console.log('change state multiSelect : ' + this.state.multiSelect);
      this.setState({multiSelect: (typeof nextProps.multiple === 'boolean') ?
          nextProps.multiple :
          nextProps.multiple.value,
        lastSelectedItem: null});
    }
  },
 	render: function(){
     console.log('render');
     var self = this;
     var addButton = (this.props.editMode) ? true : false;
 	   var x = this.state.data.map(function(d, index){
 			return (
         <DataTablesRow data={d} key={d.id} multiple={self.state.multiSelect} buttonBefore={addButton} onClick={self.rowClick} selected={false} className={(index+1 % 2) ? "odd" : "even"} ></DataTablesRow>
      );
     });

		 return (
       <DataTablesWrapper ref="wrapper" multiple={this.state.multiSelect} editMode={this.props.editMode} >
        {x}
       </DataTablesWrapper>
		);
 	}
 });

module.exports = DataTablesGrid;
