// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
require([
    'templates',
    'polyglot',
    'sweetalert',
    'coreJS/app/origin',
    'coreJS/app/router',
    'coreJS/app/permissions',
    'coreJS/user/user',
    'coreJS/project/project',
    'coreJS/dashboard/dashboard',
    'coreJS/editor/editor',
    'coreJS/assetManagement/assetManagement',
    'coreJS/pluginManagement/pluginManagement',
    'coreJS/user/models/sessionModel',
    'coreJS/navigation/views/navigationView',
    'coreJS/globalMenu/globalMenu',
    'coreJS/sidebar/sidebar',
    'coreJS/app/helpers',
    'coreJS/app/contextMenu',
    'coreJS/location/location',
    'plugins/plugins',
    'coreJS/notify/notify',
    'coreJS/editingOverlay/editingOverlay',
    'coreJS/options/options',
    'coreJS/scaffold/scaffold',
    'coreJS/modal/modal',
    'coreJS/filters/filters',
    'coreJS/actions/actions',
    'jquery-ui',
    'jquery-form',
    'inview',
    'imageReady',
    'mediaelement',
    'velocity',
    'scrollTo',
    'ace/ace'
], function (
    Templates,
    Polyglot,
    SweetAlert,
    Origin,
    Router,
    Permissions,
    User,
    Project,
    Dashboard,
    Editor,
    AssetManagement,
    PluginManagement,
    SessionModel,
    NavigationView,
    GlobalMenu,
    Sidebar,
    Helpers,
    ContextMenu,
    Location,
    Notify,
    EditingOverlay,
    Options,
    Scaffold,
    Modal,
    JQueryUI,
    JQueryForm,
    Inview,
    ImageReady,
    MediaElement
) {
  loadServerConfig(function() {
    loadLanguageData(function() {
      loadSessionData(function() {
        Origin.router = new Router();
        // FIXME the following is called from schemasModel as schemas need to load before the app
        Origin.trigger('app:userCreated', function() {
          $('#app').before(new NavigationView({model: Origin.sessionModel}).$el);
          Origin.trigger('app:dataReady');
          // defer to give anything tapping app:dataReady time to execute
          _.defer(Origin.initialize);
        });
      });
    });
  });
  
  function loadServerConfig(callback) {
    // Read in the configuration values/constants
    $.getJSON('config/config.json', function(configData) {
      // TODO name doesn't seem transparent enough
      Origin.constants = configData;
      callback.call(this);
    });
  }

  // initialises the language and loads polyglot
  function loadLanguageData(callback) {
    var locale = localStorage.getItem('lang') || 'en';
    $.getJSON('lang/' + locale, function(data) {
      window.polyglot = new Polyglot({ phrases: data });
      callback();
    });
  }

  function loadSessionData(callback) {
    Origin.sessionModel = new SessionModel();
    Origin.sessionModel.fetch();
    Origin.on('sessionModel:initialised', callback);
  }
});
