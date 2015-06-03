'use strict';

var React = require('react');
var Router = require('react-router');

var { Route, RouteHandler, DefaultRoute, Link, NotFoundRoute } = Router;

var Authentication = require('./Authentication');
var { auth, Login, Logout } = Authentication;

var ComponentRegApp = require('./ComponentRegApp.jsx');
var ComponentViewer = require('./ComponentViewer.jsx');
var ComponentEditor = require('./ComponentEditor.jsx');

var PageHeader = require('react-bootstrap/lib/PageHeader');

var NotFound = React.createClass({
  render: function() {
    return (
      <h1>Not Found</h1>
    );
  }
});

var Import = React.createClass({
  render: function() {
    return <h1>Importer</h1>
  }
});

require('../../styles/main.css');
require('../../styles/normalize.css');

var Main = React.createClass({
  getInitialState: function() {
    return {
      loggedIn: false,
      displayName: ''
    };
  },
  setStateOnAuth: function(loggedIn, displayName) {
    this.setState({
      loggedIn: loggedIn,
      displayName: displayName
    });
  },
  childContextTypes: {
      loggedIn: React.PropTypes.bool.isRequired,
      displayName: React.PropTypes.string.isRequired
  },
  getChildContext: function() {
       return { loggedIn: this.state.loggedIn, displayName: this.state.displayName };
  },
  componentWillMount: function() {
    /*$(document).ready(function() {
      window['console']['log'] = function() {};
    });*/

    auth.onChange = this.setStateOnAuth;
    auth.login();
  },
  render: function() {
     var loginOrOut = this.state.loggedIn ?
       <div className="auth-logged-in">{this.state.displayName} <a href="http://localhost:8080/ComponentRegistry/admin/userSettings" target="_blank">settings</a> <Link to="logout">logout</Link></div> :
       <Link to="login">login</Link>;
    return (
      <div>
        <PageHeader>CMDI Component Registry <small>ReactJS/REST Test</small></PageHeader>
        <div className="auth-login">{loginOrOut}</div>
        <RouteHandler/>
      </div>
    );
  }
});

var routes = (
    <Route handler={Main} path="/" >
      <NotFoundRoute handler={NotFound}/>
      <Route name="login" handler={Login} />
      <Route name="logout" handler={Logout} />
      <Route name="import" handler={Import} />
      <Route path="editor" handler={ComponentEditor}>
        <Route name="component" path="component/:component" handler={ComponentViewer} />
        <Route name="newComponent" path="component/:component/new" handler={ComponentViewer} />
        <Route name="profile" path="profile/:profile" handler={ComponentViewer} />
        <Route name="newProfile" path="profile/:profile/new" handler={ComponentViewer} />
        <Route name="newEditor" path="new" handler={ComponentViewer} />
      </Route>
      <DefaultRoute handler={ComponentRegApp} />
    </Route>
);

Router.run(routes, Router.HistoryLocation, function(Handler) {
  React.render(<Handler/>, document.getElementById('content'));
});
