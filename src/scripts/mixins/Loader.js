var Config = require('../config');
var LoaderMixin = {
  loadProfile: function(profileId, raw_type, cb) {
    var type = (raw_type != undefined || raw_type == "json") ? "/" + raw_type : "";
    $.ajax({
      url: 'http://localhost:8080/ComponentRegistry/rest/registry/profiles/' + profileId,
      dataType: (raw_type != undefined) ? raw_type : "json",
      username: Config.auth.username,
      password: Config.auth.password,
      xhrFields: {
        withCredentials: true
      },
      success: function(data) {
        if(cb) cb(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(profileId, status, err);
      }.bind(this)
    });
  },
  loadComponent: function(componentId, raw_type, cb) {
    var syncData = null;
    var type = (raw_type != undefined || raw_type == "json") ? "/" + raw_type : "";
    $.ajax({
      url: 'http://localhost:8080/ComponentRegistry/rest/registry/components/' + componentId,
      dataType: (raw_type != undefined) ? raw_type : "json",
      username: Config.auth.username,
      password: Config.auth.password,
      async: false,
      xhrFields: {
        withCredentials: true
      },
      success: function(data) {
        if(cb) cb(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(componentId, status, err);
      }.bind(this)
    });
  },
  getItemName: function(itemId, cb) {
    var name = null;
    this.loadRegistryItem(itemId, function(data) {
      name = data.name;
    });

    return name;
  },
  loadRegistryItem: function(itemId, cb) {
    $.ajax({
      url: 'http://localhost:8080/ComponentRegistry/rest/registry/items/' + itemId,
      dataType: "json",
      username: Config.auth.username,
      password: Config.auth.password,
      async: false,
      xhrFields: {
        withCredentials: true
      },
      success: function(data) {
        if(cb) cb(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(componentId, status, err);
      }.bind(this)
    });
  },
  loadComments: function(componentId, isProfile, cb) {
    var reg_type = (isProfile) ? "profiles" : "components";
    $.ajax({
      url: 'http://localhost:8080/ComponentRegistry/rest/registry/' + reg_type + '/' + componentId + '/comments',
      dataType: "json",
      username: Config.auth.username,
      password: Config.auth.password,
      xhrFields: {
        withCredentials: true
      },
      success: function(data) {
        if(cb && data != null) if(data.comment != null) cb(data.comment); else cb(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(componentId, status, err);
      }.bind(this)
    });
  },
  saveProfile: function(profileId, publish, cb) {
    var actionType = (publish) ? "publish" : "update";
    var registry = this.state.registry;
    var data = this.state.profile;

    var fd = new FormData();
    fd.append('profileId', profileId);
    fd.append('name', data.Header.Name);
    fd.append('description', data.Header.Description);
    fd.append('group', registry.groupName);
    fd.append('domainName', registry.domainName);
    fd.append('data', new Blob([ JSON.stringify(data.CMD_Component) ], { type: "application/json" }));

    /* CORS issue using XHR natively
    var createCORSRequest = function(method, url) {
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr) {

        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, true);

      } else if (typeof XDomainRequest != "undefined") {

        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.open(method, url);

      } else {

        // Otherwise, CORS is not supported by the browser.
        xhr = null;

      }
      return xhr;
    }

    var url = 'http://localhost:8080/ComponentRegistry/rest/registry/profiles/' + profileId + '/' + actionType;
    var xhr = createCORSRequest('POST', url);
    if (!xhr) {
      throw new Error('CORS not supported');
    }
    xhr.withCredentials = true;
    xhr.setRequestHeader(
      'Authorization','Basic ' + btoa(Config.auth.username + ':' + Config.auth.password)
    );

    xhr.onreadystatechange = function() {
      if(xhr.readyState == 4) {
        if(xhr.status == 200) console.log('returned');
      } else console.log('error: ' + xhr.responseText);
    };

    xhr.send(fd);
    */
    $.ajax({
        type: 'POST',
        url: 'http://localhost:8080/ComponentRegistry/rest/registry/profiles/' + profileId + '/' + actionType,
        data: fd,
        mimeType: 'multipart/form-data',
        username: Config.auth.username,
        password: Config.auth.password,
        async: false,
        xhrFields: {
          withCredentials: true
        },
        processData: false,
        contentType: false,
        success: function(data) {
          if(cb) cb(data);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(componentId, status, err);
        }.bind(this)
      });
  },
  saveComponent: function(componentId, publish, cb) {
    var actionType = (publish) ? "publish" : "update";
    var registry = this.state.registry;
    var data = this.state.component;

    var fd = new FormData();
    fd.append('componentId', componentId);
    fd.append('name', data.Header.Name);
    fd.append('description', data.Header.Description);
    fd.append('group', registry.groupName);
    fd.append('domainName', registry.domainName);
    fd.append('data', new Blob([ JSON.stringify(data.CMD_Component) ], { type: "application/json" }));

    $.ajax({
      type: 'POST',
      url: 'http://localhost:8080/ComponentRegistry/rest/registry/components/' + componentId + '/' + actionType,
      data: fd,
      mimeType: 'multipart/form-data',
      username: Config.auth.username,
      password: Config.auth.password,
      async: false,
      xhrFields: {
        withCredentials: true
      },
      processData: false,
      contentType: false,
      success: function(data) {
        if(cb) cb(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(componentId, status, err);
      }.bind(this)
    });
  },
  componentWillMount: function() {
    console.log('Loader mount');
  },
  componentDidMount: function() {
    console.log('Loader did mount');
    var self = this;
    if(this.props.profileId != undefined && this.props.profileId != null)
      this.loadProfile(this.props.profileId, "json", function(data) {
          self.setState({profile: data, visible: true});
      });
    else if(this.props.componentId != undefined && this.props.componentId != null)
      this.loadComponent(this.props.componentId, "json", function(data) {
          self.setState({component: data, visible: true});
      });
  },
  componentWillUnmount: function() {
    console.log('Loader unmount');
  }
};

module.exports = LoaderMixin;
