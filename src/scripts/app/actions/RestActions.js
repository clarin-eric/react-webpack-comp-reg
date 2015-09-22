var log = require('loglevel');

var SpecAugmenter = require("../service/SpecAugmenter")

var Constants = require("../constants"),
    /* mock */
    // ComponentRegistryClient = require("./service/ComponentRegistryMockClient")
    /* REST client */
    ComponentRegistryClient = require("../service/ComponentRegistryClient")

/**
 * Loads all linked components (with @ComponentId) that are a direct child
 * of the provided component (JSON spec). When done, the callback is called with
 * the result - this is guaranteed to happen.
 * @param  {object}   component component specification to load linked components for
 * @param  {string}   space     space to load components from
 * @param  {Function} callback  will be called with the list of loaded components
 */
function loadLinkedComponents(component, space, callback) {
    var components = {};
    var childComponents = component.CMD_Component;

    // gather linked component IDs
    if(childComponents != undefined) {
      var linkedComponentIds = getComponentIds(childComponents);
      loadComponentsById(linkedComponentIds, space, components, callback);
    } else {
      // no child components, nothing to do so call callback immediately
      callback(components);
    }
}

/**
 * recursively gets the IDs of all
 * @param  {Array} childComponents child objects of type CMD_Component
 * @return {Array}                 IDs of linked (non-inline) components
 */
function getComponentIds(childComponents) {
  var linkedComponentIds = [];

  //make sure we're dealing with an array
  if(!$.isArray(childComponents)) {
    childComponents = [childComponents];
  }

  childComponents.forEach(function(child){
    if(child['@ComponentId'] != undefined) {
      linkedComponentIds.push(child['@ComponentId']);
    } else if(child.CMD_Component != undefined) {
      //get child components in inline child
      Array.prototype.push.apply(linkedComponentIds, getComponentIds(child.CMD_Component));
    }
  });
  log.debug("Linked component IDs:",linkedComponentIds)
  return linkedComponentIds;
}

/**
 * Loads components with specified ids. When done, the callback is called with
* the result - this is guaranteed to happen.
 * @param  {[Array]}   ids       array with ids to load
 * @param  {[string]}   space     space to load specs from
 * @param  {[Object]}   collected collected specs thus far
 * @param  {Function} callback  gets called with result when all components have been loaded
 */
function loadComponentsById(ids, space, collected, callback) {
  var id = ids.pop();
  if(id == undefined) {
    //tail of recursion
    callback(collected);
  } else if(collected[id] != undefined) {
    // already loaded, skip this one and continue
    loadComponentsById(ids, space, collected, callback);
  } else {
    // load current id
    ComponentRegistryClient.loadSpec(Constants.TYPE_COMPONENTS, space, id, "json", function(spec){
        log.info("Loaded", id, ":", spec.Header.Name);

        if(spec == undefined) {
          log.warn("LoadSpec returned undefined. Id:", id);
        }

        SpecAugmenter.augmentWithIds(spec);

        //success
        collected[id] = spec;
        // proceed
        loadComponentsById(ids, space, collected, callback);
      },
      function(message) {
        // failure
        log.warn("Failed to load child component with id ", id, ": ", message);
        // proceed (nothing added)
        loadComponentsById(ids, space, collected, callback);
      }
    );
  }
}

module.exports = {
  loadItems: function(type, space) {
    this.dispatch(Constants.LOAD_ITEMS);
    ComponentRegistryClient.loadComponents(type, space, function(items){
        // Success
        this.dispatch(Constants.LOAD_ITEMS_SUCCESS, items);
      }.bind(this),
      function(message) {
        // Failure
        this.dispatch(Constants.LOAD_ITEMS_FAILURE, message);
      }.bind(this)
    );
  },

  loadComponentSpec: function(type, space, item) {
    this.dispatch(Constants.LOAD_COMPONENT_SPEC);
    // load the (JSON) spec for this item
    ComponentRegistryClient.loadSpec(type, space, item.id, "json", function(spec){
        // Success. Now also load linked child components at root level, we need
        // their names for display purposes.
        loadLinkedComponents(spec.CMD_Component, space, function(linkedComponents) {
          // Loading of linked components done...
          SpecAugmenter.augmentWithIds(spec);
          log.trace("Loaded and augmented spec: ", spec);
          this.dispatch(Constants.LOAD_COMPONENT_SPEC_SUCCES, {spec: spec, linkedComponents: linkedComponents});
        }.bind(this));
      }.bind(this),
      function(message) {
        // Failure
        this.dispatch(Constants.LOAD_COMPONENT_SPEC_FAILURE, message);
      }.bind(this)
    );
  },

  loadLinkedComponentSpecs: function(parentSpec, space) {
    log.debug("loadLinkedComponentSpecs ", parentSpec);
    loadLinkedComponents(parentSpec, space, function(linkedComponents) {
      this.dispatch(Constants.LINKED_COMPONENTS_LOADED, linkedComponents);
    }.bind(this));
  },

  loadComponentSpecXml: function(type, space, item) {
    this.dispatch(Constants.LOAD_COMPONENT_SPEC);
    ComponentRegistryClient.loadSpec(type, space, item.id, "text", function(specXml){
        // success
        this.dispatch(Constants.LOAD_COMPONENT_SPEC_XML_SUCCES, specXml);
      }.bind(this),
      function(message) {
        // failure
        this.dispatch(Constants.LOAD_COMPONENT_SPEC_FAILURE, message);
      }.bind(this)
    );
  }

};
