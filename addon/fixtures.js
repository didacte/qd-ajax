import Ember from 'ember';
import RouteRecognizer from 'route-recognizer';

var typeOf = Ember.typeOf;
var merge = Ember.merge;
var isNone = Ember.isNone;
var fixtures;

var Fixtures = Ember.Object.extend({
  init: function () {
    this.recognizer = new RouteRecognizer();
  },
  /*
   * Looks up a fixture by url.
   * @param {String} url
   */
  retrieve: function (url, request) {
    var matched = this.recognizer.recognize(url);
    if (matched && matched.length > 0) {
      var route = matched[0];
      // merge route parameters, route query parameters
      var urlParams = merge(route.params, matched.queryParams || {});
      var data = (request || {}).data;
      /**
       * Sometimes Ember Data will pass data object as a serialized JSON string.
       * In these situations, parse the JSON before passing to the fixture handler.
       */
      if (typeOf(data) === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e){
          Ember.Logger.error('Error occurred while trying parse serialized data string', e);
        }
      }
      var params = merge(urlParams, data);
      return route.handler.call(null, params, request);
    }
  },

  /*
   * Defines a fixture that will be used instead of an actual ajax
   * request to a given url. This is useful for testing, allowing you to
   * stub out responses your application will send without requiring
   * libraries like sinon or mockjax, etc.
   *
   * For example:
   *
   *    defineFixture('/self', {
   *      response: { firstName: 'Ryan', lastName: 'Florence' },
   *      textStatus: 'success'
   *      jqXHR: {}
   *    });
   *
   * @param {String} url
   * @param {Object} fixture
   */
  add: function (url, fixture) {
    var callback;

    if (typeOf(fixture) === 'function') {
      callback =  function() {
        var result = fixture.apply(context, arguments);
        if (typeof result !== 'undefined') {
          return JSON.parse(JSON.stringify(result));
        } else {
          return null;
        }
      };
    } else {
      // Satisfy some legacy behavior that a fixture cannot be
      // modified after definition time.
      fixture = JSON.parse(JSON.stringify(fixture));
      callback = function() {
        return JSON.parse(JSON.stringify(fixture));
      };
    }

    this.recognizer.add([{path: url, handler: callback}]);
  }
});

Fixtures.reopenClass({
  /**
   * Load fixtures from AMD modules starting with prefix
   * @param {string} moduleName
   * @param {string} namespace
   */
  load: function(moduleName, namespace) {
    var requireModule = window.requireModule;
    if (!requireModule) {
      return;
    }
    var fixtures = Fixtures.create();
    for (var key in requireModule.entries) {
      if (key !== moduleName + '/_loader' && new RegExp('^' + moduleName + '\/').test(key)) {
        var url = key.replace(moduleName + '/', '');
        var module = requireModule(key);
        if (module && module.default) {
          fixtures.add(namespace + '/' + url, module.default);
        }
      }
    }
    return fixtures;
  },
  setup: function() {
    Ember.run(function(){
      fixtures = Fixtures.create();
    });
  },
  teardown: function(){
    if (typeOf(fixtures) === 'undefined') {
      return;
    }
    Ember.run(function(){
      fixtures.destroy();
    });
  },
  reset: function() {
    Fixtures.teardown();
    Fixtures.setup();
  },
  define: function(url, fixture) {
    if (typeOf(fixtures) === 'undefined') {
      Fixtures.setup();
    }
    fixtures.add(url, fixture);
  },
  lookup: function() {
    if (isNone(fixtures)) {
      return;
    }
    return fixtures.retrieve.apply(fixtures, arguments);
  }
});

var context = {
  /**
   * Delay the response by amount of time specified by time argument. Default 250ms.
   * Return a promise.
   * @param payload {Object|Promise}
   * @param time {int}
   * @returns {Promise}
   */
  delay: function(payload, time) {
    if (typeof time === 'undefined') {
      time = 250;
    }

    return new Ember.RSVP.Promise(function(resolve){
      Ember.run.later(function(){
        resolve(payload);
      }, time);
    }, null, "qd-ajax: Delay fixture response.");
  },
  success: function(payload) {
    return {
      response: payload,
      textStatus: 'success'
    };
  },
  error: function(textStatus, errorThrown) {
    return {
      textStatus: textStatus || 'error',
      errorThrown: errorThrown
    };
  }
};

export default Fixtures;
