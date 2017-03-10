// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var NavigationView = OriginView.extend({
    tagName: 'nav',
    className: 'navigation',

    initialize: function() {
      this.listenTo(Origin, 'user:updated', this.onLoginChanged);
      this.render();
    },

    events: {
      'click a.navigation-item': 'onNavigationItemClicked',
      'click button.revert-loginas': 'onRevertLoginas'
    },

    render: function() {
      var data = this.model ? this.model.toJSON() : null;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      return this;
    },

    onLoginChanged: function() {
      this.render();
    },

    onRevertLoginas: function() {
      var data = { email: Origin.sessionModel.get('_revertLogin').email };
      $.post( '/api/loginas', data, this.onRevertLoginasSuccess)
        .fail(this.onRevertLoginasError);
      });
    },

    onRevertLoginasError: function() {
      Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorlogginginas') });
    },

    onRevertLoginasSuccess: function(jqXHR, textStatus, errorThrown) {
      var sessionModel = Origin.sessionModel;

      sessionModel.set('_canRevert', false);
      sessionModel.set('id', jqXHR.id);
      sessionModel.set('tenantId', jqXHR.tenantId);
      sessionModel.set('email', jqXHR.email);
      sessionModel.set('isAuthenticated', jqXHR.success);
      sessionModel.set('permissions', jqXHR.permissions);

      delete sessionModel._revertLogin;

      Origin.trigger('login:changed');
      Origin.trigger('globalMenu:refresh');
      Origin.router.navigate('#/dashboard', { trigger: true });
    },

    onNavigationItemClicked: function(event) {
      event.preventDefault();
      event.stopPropagation();
      Origin.trigger('navigation:' + $(event.currentTarget).attr('data-event'));
    }
  }, {
    template: 'navigation'
  });

  return NavigationView;
});
