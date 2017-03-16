// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var UserCollection = require('../../../plugins/userManagement/collections/userCollection');
  var UserModel = require('./userModel');

  var SessionModel = Backbone.Model.extend({
    url: "/api/authcheck",
    defaults: {
      isAuthenticated: false,
      id: '',
      tenantId: '',
      email: '',
      otherLoginLinks: [],
      permissions: [],
      _canRevert: false,
      user: null
    },

    fetch: function(opts) {
      var self = this;
      var options = opts || {};
      var successCb = options.success;
      // hijack success callback
      options.success = function() {
        self.fetchCallbackHijacker(successCb, this);
      };
      Backbone.Model.prototype.fetch.call(this, options);
    },

    fetchCallbackHijacker: function(originalCb, scope) {
      if(originalCb) {
        // keep existing 'this' scope
        originalCb.call(scope);
      }
      if(!this.get('user')) {
        // ???
        if(!this.get('id')) {
          return Origin.trigger('sessionModel:initialised');
        }
        this.set('user', new UserModel({ _id: this.get('id') }));
      }
      // get user data
      this.fetchUser(function(error) {
        if(error) {
          return Origin.trigger('sessionModel:initialised');
        }
        this.fetchUsers(function() {
          Origin.trigger('sessionModel:initialised login:newSession');
        });
      });
    },

    fetchUser: function(cb) {
      this.get('user').fetch({
        success: function() {
          Origin.trigger('user:updated');
          if(!Origin.permissions.hasPermissions(["{{tenantid}}/user:read"])) {
            cb.call(this, new Error('Invalid permissions to view user data'));
          }
          cb.call(this);
        },
        error: this.onFetchUserError
      });
    },

    fetchUsers: function() {
      (new UserCollection()).fetch({
        success: _.bind(function(collection) {
          this.set('users', collection);
        }, this),
        error: this.onFetchUserError
      });
    },

    logIn: function (username, password, shouldPersist) {
      var data = {
        email: username,
        password: password,
        shouldPersist: shouldPersist
      };
      $.post('/api/login', data, _.bind(this.onLogInSuccess, this))
        .fail(this.onLogError);
    },

    logOut: function() {
      $.post('/api/logout', _.bind(this.onLogOutSuccess, this))
        .fail(this.onLogError);
    },

    /**
    * Error handling
    */

    onFetchUserError: function(data, response) {
      Origin.Notify.alert({
        type: 'error',
        title: response.statusText,
        text: "Couldn't fetch user data.<br/>(" + response.responseJSON.statusCode + ")"
      });
    },

    onLogInSuccess: function (jqXHR, textStatus, errorThrown) {
      this.fetch({
        success: _.bind(function() {
          if (jqXHR.success) {
            this.set({
              id: jqXHR.id,
              tenantId: jqXHR.tenantId,
              email: jqXHR.email,
              isAuthenticated: jqXHR.success,
              permissions: jqXHR.permissions
            });
            Origin.trigger('login:changed');
            Origin.trigger('schemas:loadData', function() {
              Origin.router.navigate('#/dashboard', { trigger: true });
            });
          }
        }, this)
      });
    },

    onLogOutSuccess: function() {
      this.set(this.defaults);
      Origin.trigger('login:changed');
      Origin.router.navigate('#/user/login', { trigger: true });
    },

    onLogError: function(jqXHR, textStatus, errorThrown) {
      var errorCode = jqXHR.responseJSON && jqXHR.responseJSON.errorCode || 1;
      Origin.trigger('login:failed', errorCode);
    },
  });

  return SessionModel;
});
