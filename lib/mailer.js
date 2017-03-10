// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var EmailTemplate = require('email-templates').EmailTemplate,
var nodemailer = require('nodemailer'),

var configuration = require('./configuration'),
var helpers = require('./helpers'),
var logger = require('./logger'),
var origin = require('./application'),
var path = require('path');

var app = origin();

var Mailer = function () {
  // Read the mail settings from the config.json
  this.isEnabled = configuration.getConfig('useSmtp');
  this.service = configuration.getConfig('smtpService');
  this.user = configuration.getConfig('smtpUsername');
  this.pass = configuration.getConfig('smtpPassword');
  this.from = configuration.getConfig('fromAddress');

  // check that required settings exist
  this.validateSettings = function() {
    var errors = [];

    if(this.service === '') errors.push('smtpService');
    if(this.user === '') errors.push('smtpUsername');
    if(this.pass === '') errors.push('smtpPassword');
    if(this.from === '') errors.push('fromAddress');

    if(errors.length > 0) {
      throw new Error('Mailer requires the following settings to function: ' + errors.toString());
    }
  };

  // Configure the credentials for the specified sevice
  // See http://www.nodemailer.com/ for options
  this.transporter = nodemailer.createTransport({
    service: this.service,
    auth: {
      user: this.user,
      pass: this.pass
    }
  });
};

Mailer.prototype.send = function (toAddress, subject, text, templateData, callback) {
  var mailOptions = {
      from: this.from,
      to: toAddress,
      subject: subject,
      logoText: app.polyglot.t('app.emaillogotext'),
      greeting: app.polyglot.t('app.greeting'),
      footer: app.polyglot.t('app.emailfooter'),
      text: text,
      templateData: templateData
  };

  // Send mail with defined transport object
  if (this.isEnabled) {
    try {
      this.validateSettings();
    } catch(e) {
      logger.log('warn', e);
      return callback(e);
    }
    configure(mailOptions, _.bind(function(error, options) {
      if(error) {
        return callback(error);
      }
      // Send mail with defined transport object
      this.transporter.sendMail(options, function(error, info){
        if (error) {
          return callback(error);
        } else {
          logger.log('info', 'Message sent: ' + info.response);
          callback();
        }
      });
    }, this));
  } else {
    callback();
  }
};

var configure = function (options, callback) {
  if(!helpers.isValidEmail(options.to)) {
    return callback(new Error(app.polyglot.t('app.mailererrorto', { address: options.to })));
  }
  if(!helpers.isValidEmail(options.from)) {
    return callback(new Error(app.polyglot.t('app.mailererrorfrom', { address: options.from })));
  }
  if(options.templateData !== null) {
    var template = new EmailTemplate(path.join(__dirname, 'templates', options.templateData.name));
    template.render(options, function (error, results) {
      if (error) {
        return callback(error);
      }
      options.html = results.html;
      options.text = results.text;
      callback(null, options)
    });
  } else {
    callback(null, options);
  }
};

module.exports.Mailer = Mailer;
