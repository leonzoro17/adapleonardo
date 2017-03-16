// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var LoginView = OriginView.extend({
    className: 'login',
    tagName: "div",

    events: {
      'keydown #login-input-username': 'onKeyDown',
      'keydown #login-input-password': 'onKeyDown',
      'click .login-form-submit': 'onSubmitClicked',
      'click button.dash': 'onDashboardButtonClicked'
    },

    errorCodes: {
      ERR_INVALID_CREDENTIALS: 1,
      ERR_ACCOUNT_LOCKED: 2,
      ERR_MISSING_FIELDS: 3,
      ERR_TENANT_DISABLED: 4,
      ERR_ACCOUNT_INACTIVE: 5
    },

    preRender: function() {
      this.listenTo(Origin, 'login:failed', this.onLoginFailed, this);
    },

    postRender: function() {
      this.setViewToReady();
      Origin.trigger('login:loaded');
    },

    clearErrorStyling: function(e) {
      $('#login-input-username').removeClass('input-error');
      $('#loginError').addClass('display-none');
    },

    submitLogInDetails: function() {
      var inputUsernameEmail = $.trim(this.$("#login-input-username").val());
      var inputPassword = $.trim(this.$("#login-input-password").val());
      var shouldPersist = this.$('#remember-me').prop('checked');
      //validate
      if (inputUsernameEmail === '' || inputPassword === '') {
        this.onLoginFailed(this.errorCodes.ERR_MISSING_FIELDS);
        return;
      }
      this.model.logIn(inputUsernameEmail, inputPassword, shouldPersist);
    },

    getErrorMessage: function(errorCode) {
      switch (errorCode) {
        case this.errorCodes.ERR_INVALID_CREDENTIALS:
        case this.errorCodes.ERR_MISSING_FIELDS:
          return window.polyglot.t('app.invalidusernameorpassword');
        case this.errorCodes.ERR_ACCOUNT_LOCKED:
          return window.polyglot.t('app.accountislocked');
        case this.errorCodes.ERR_TENANT_DISABLED:
          return window.polyglot.t('app.tenantnotenabled');
        case this.errorCodes.ERR_ACCOUNT_INACTIVE:
          return window.polyglot.t('app.accountnotactive');
      }
    },

    /**
    * Event handling
    */

    onDashboardButtonClicked: function(e) {
      e && e.preventDefault();
      Origin.router.navigate('#/dashboard', { trigger: true });
    },

    onSubmitClicked: function(e) {
      e && e.preventDefault();
      this.submitLogInDetails();
    },

    onLoginFailed: function(errorCode) {
      $('#login-input-password').val('');
      $('#loginErrorMessage').text(this.getErrorMessage(errorCode));
      $('#login-input-username').addClass('input-error');
      $('#loginError').removeClass('display-none');
    },

    onKeyDown: function(e) {
      this.clearErrorStyling();
      console.log(e.keyCode, e.key);

      if (e.key === 'Enter') {
      // if (e.keyCode === 13) {
        e.preventDefault();
        this.submitLogInDetails();
      }
    }
  }, {
    template: 'login'
  });

  return LoginView;
});
