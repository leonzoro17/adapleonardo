// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var LoginView = require('coreJS/user/views/loginView');
  var UserProfileView = require('coreJS/user/views/userProfileView');
  var UserProfileSidebarView = require('coreJS/user/views/userProfileSidebarView');
  var UserProfileModel = require('coreJS/user/models/userProfileModel');

  var ForgotPasswordView = require('coreJS/user/views/forgotPasswordView');
  var ResetPasswordView = require('coreJS/user/views/resetPasswordView');
  var UserPasswordResetModel = require('coreJS/user/models/userPasswordResetModel');

  Origin.on('navigation:user:logout', function onUserLogOut() {
    Origin.router.navigate('#/user/logout');
  });

  Origin.on('navigation:user:profile', function onUserProfile() {
    Origin.router.navigate('#/user/profile');
  });

  Origin.on('router:user', function onUserRoute(location, subLocation, action) {
    var currentView;

    switch (location) {
      case 'login':
        Origin.trigger('location:title:hide');
        currentView = LoginView;
        break;
      case 'logout':
        Origin.sessionModel.logOut();
        break;
      case 'forgot':
        Origin.trigger('sidebar:sidebarContainer:hide');
        currentView = ForgotPasswordView;
        break;
      case 'reset':
        Origin.trigger('sidebar:sidebarContainer:hide');
        currentView = ResetPasswordView;
        break;
      case 'profile':
        Origin.trigger('location:title:update', { title: window.polyglot.t('app.editprofiletitle') });
        currentView = UserProfileView;
        break;
    }

    if(currentView) {
      loadView(currentView);
    }
  });

  // TODO Notify error handling
  function loadView(view) {
    var route1 = Origin.location.route1;
    var settings = {
      authenticate: false
    };

    if(route1 === 'profile') {
      settings.authenticate = true;
      (new UserProfileModel()).fetch({
        success: function(model) {
          Origin.sidebar.addView(new UserProfileSidebarView().$el);
          Origin.router.createView(view, { model: model }, settings);
        },
        error: console.log
      });
      return;
    }
    if(route1 === 'reset') {
      (new UserPasswordResetModel({ token: Origin.location.id })).fetch({
        success: function(model) {
          Origin.router.createView(view, { model: model }, settings);
        },
        error: console.log
      });
      return;
    }
    // if neither of the above...
    Origin.router.createView(view, { model: Origin.sessionModel }, settings);
  }
});
