// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  // TODO move this into core
  var UserCollection = require('../../../plugins/userManagement/collections/userCollection');
  var UserModel = require('./userModel');

  var SessionModel = Backbone.Model.extend({

    defaults: {
      isAuthenticated: false,
      id: '',
      tenantId: '',
      email: '',
      otherLoginLinks: []
    },

    url: "/api/authcheck",

    initialize: function() {},

    login: function(username, password, shouldPersist) {
      $.post(
        '/api/login',
        {
          email: username,
          password: password,
          shouldPersist: shouldPersist
        },
        _.bind(function(jqXHR, textStatus, errorThrown) {
          this.fetch({
            success: _.bind(function() {
              this.onLogInSuccess(jqXHR);
            }, this)
          });
        }, this)
      )
        .fail(_.bind(this.onLogInError, this));
    },

    logout: function() {
      $.post('/api/logout', _.bind(function() {
        this.set(this.defaults);
        Origin.trigger('login:changed');
        Origin.router.navigate('#/user/login', { trigger: true });
      }, this))
        .fail(onAjaxFail);
    },

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
        error: this.onFetchError
      });
    },

    login: function (username, password, shouldPersist) {
      var self = this;

      $.ajax({
        method: 'post',
        url: '/api/login',
        data: {email: username, password: password, shouldPersist: shouldPersist},
        success: function (jqXHR, textStatus, errorThrown) {
          if (jqXHR.success) {
            self.set('id', jqXHR.id);
            self.set('tenantId', jqXHR.tenantId);
            self.set('email', jqXHR.email);
            self.set('isAuthenticated', jqXHR.success);
            self.set('permissions', jqXHR.permissions);

            Origin.trigger('login:changed');

            Origin.trigger('schemas:loadData', function() {
              Origin.router.navigate('#/dashboard', {trigger: true});
            });
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          var errorCode = 1;

          if (jqXHR.responseJSON && jqXHR.responseJSON.errorCode) {
            errorCode = jqXHR.responseJSON.errorCode;
          }

          Origin.trigger('login:failed', errorCode);
        }
      });
    }
  });

  return SessionModel;

});
