// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  // TODO move this into core
  var UserCollection = require('../../plugins/userManagement/collections/UserCollection');
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

    fetch: function(options) {
      var self = this;
      var successCb = options && options.success;
      // hijack success callback
      options.success = function() {
        if(successCb) {
          successCb.call(this);
        }
        if(!self.get('user') && self.get('id')) {
          self.set('user', new UserModel({ _id: self.get('id') }));
        }
        if(self.get('user') === undefined) {
          return Origin.trigger('sessionModel:initialised');
        }
        self.get('user').fetch({
          success: _.bind(this.onUserFetchSuccess, self),
          error: this.onFetchError
        });
      };

      Backbone.Model.prototype.fetch.call(this, options);
    },

    logout: function () {
      $.post('/api/logout', _.bind(function() {
        this.set(this.defaults);
        Origin.trigger('login:changed');
        Origin.router.navigate('#/user/login', { trigger: true });
      }, this))
        .fail(onAjaxFail);
    },

    login: function (username, password, shouldPersist) {
      $.post(
        '/api/login',
        {
          email: username,
          password: password,
          shouldPersist: shouldPersist
        },
        _.bind(function (jqXHR, textStatus, errorThrown) {
          this.fetch({
            success: _.bind(function() {
              this.onLogInSuccess(jqXHR);
            }, this)
          });
        }, this))
        .fail(_.bind(this.onLogInError, this));
    }

    onUserFetchSuccess: function() {
      Origin.trigger('user:updated');
      if(!Origin.permissions.hasPermissions(["{{tenantid}}/user:read"])) {
        Origin.trigger('sessionModel:initialised');
        return;
      }
      var users = new UserCollection();
      users.fetch({
        success: _.bind(function(collection) {
          self.set('users', users);
          Origin.trigger('sessionModel:initialised');
          Origin.trigger('login:newSession');
        }, this),
        error: error: this.onFetchError
      });
    },

    onFetchError: function(data, response) {
      Origin.Notify.alert({
        type: 'error',
        title: response.statusText,
        text: "Couldn't fetch user data.<br/>(" + response.responseJSON.statusCode + ")"
      });
    },

    onLogInSuccess: function(data) {
      if (jqXHR.success) {
        this.set({
          id: data.id,
          tenantId: data.tenantId,
          email: data.email,
          isAuthenticated: data.success,
          permissions: data.permissions
        });
        Origin.trigger('login:changed');
        Origin.trigger('schemas:loadData', function() {
          Origin.router.navigate('#/dashboard', { trigger: true });
        });
      }
    },

    onLogInError: function(jqXHR, textStatus, errorThrown) {
      var errorCode = 1;
      if (jqXHR.responseJSON && jqXHR.responseJSON.errorCode) {
        errorCode = jqXHR.responseJSON.errorCode;
      }
      Origin.trigger('login:failed', errorCode);
    }
  });

  return SessionModel;
});
