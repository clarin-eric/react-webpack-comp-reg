'use strict';
var log = require('loglevel');

var Fluxxor = require("fluxxor"),
    Constants = require("../constants");

var ImmutabilityUtil = require('../service/ImmutabilityUtil');
var remove = ImmutabilityUtil.remove,
    update = ImmutabilityUtil.update;

var ItemsStore = Fluxxor.createStore({
  initialize: function(options) {
      this.items = [], //items to be shown in browser
      this.filteredItems = [],
      this.deleted = {}, //items that have been deleted or are being deleted
      this.loading = false, //loading state
      this.type = Constants.TYPE_PROFILE, //components or profiles
      this.space = Constants.SPACE_PUBLISHED, //private, group, published
      this.filterText = null

    this.bindActions(
      Constants.LOAD_ITEMS, this.handleLoadItems,
      Constants.LOAD_ITEMS_SUCCESS, this.handleLoadItemsSuccess,
      Constants.LOAD_ITEMS_FAILURE, this.handleLoadItemsFailure,
      Constants.SWITCH_SPACE, this.handleSwitchSpace,
      Constants.DELETE_COMPONENTS, this.handleDeleteItems,
      Constants.DELETE_COMPONENTS_SUCCESS, this.handleDeleteItemsSuccess,
      Constants.DELETE_COMPONENTS_FAILURE, this.handleDeleteItemsFailure,
      Constants.FILTER_TEXT_CHANGE, this.handleFilterTextChange
    );
  },

  getState: function() {
    return {
      items: this.filteredItems,
      deleted: this.deleted,
      loading: this.loading,
      type: this.type,
      space: this.space,
      filterText: this.filterText
    };
  },

  handleLoadItems: function() {
    this.loading = true;
    this.emit("change");
  },

  handleLoadItemsSuccess: function(items) {
    this.items = items;
    this.filteredItems = filter(this.items, this.filterText);
    this.loading = false;
    this.deleted = {};
    this.emit("change");
  },

  handleLoadItemsFailure: function() {
    this.loading = false;
    this.emit("change");
  },

  handleSwitchSpace: function(spaceType) {
    this.type = spaceType.type;
    this.space = spaceType.space;
    this.emit("change");
  },

  handleDeleteItems: function(ids) {
    this.loading = true;
    for(var i=0; i<ids.length; i++) {
      var id=ids[i];
      this.deleted = update(this.deleted, {[id]: {$set: Constants.DELETE_STATE_DELETING}});
    }
    this.emit("change");
  },

  handleDeleteItemsSuccess: function(ids) {
    this.loading = false;
    for(var i=0; i<ids.length; i++) {
      var id=ids[i];
      this.deleted = update(this.deleted, {[id]: {$set: Constants.DELETE_STATE_DELETED}});
    }
    this.emit("change");
  },

  handleDeleteItemsFailure: function(result) {
    this.loading = false;
    // remove items from list of deleted items
    this.deleted = remove(this.deleted, result.ids);
    this.emit("change");
  },

  handleFilterTextChange: function(text) {
    this.filterText = (text === "") ? null : text;
    this.filteredItems = filter(this.items, this.filterText);
    this.emit("change");
  }

});

function filter(items, filter) {
  if(filter == null) {
    return items;
  } else {
    filter = filter.toLowerCase();
    return items.filter(function(item) {
      return item.name.toLowerCase().indexOf(filter) >= 0;
    });
  }
}

module.exports = ItemsStore;
