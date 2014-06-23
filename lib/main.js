/*!
 * qd-ajax
 *
 * - (c) 2014 Quandl, Inc
 * - please see license at https://github.com/quandl/qd-ajax/blob/master/LICENSE
 * - forked of instructure/ic-ajax: https://github.com/instructure/ic-ajax
 * - inspired by discourse ajax: https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/mixins/ajax.js#L19
 */

import RouteRecognizer from 'route-recognizer';

/*
 * jQuery.ajax wrapper, supports the same signature except providing
 * `success` and `error` handlers will throw an error (use promises instead)
 * and it resolves only the response (no access to jqXHR or textStatus).
 */

export function request() {
  return raw.apply(null, arguments).then(function(result) {
    return result.response;
  }, null, 'qd-ajax: unwrap raw ajax response');
}

request.OVERRIDE_REST_ADAPTER = true;
request.DELAY_RESPONSE = false;
request.DELAY_TIME = 250;

export default request;

/*
 * Same as `request` except it resolves an object with `{response, textStatus,
 * jqXHR}`, useful if you need access to the jqXHR object for headers, etc.
 */

export function raw() {
  return makePromise(parseArgs.apply(null, arguments));
}

export var __fixtures__;

/**
 * Create new fixtures container
 */
export function resetFixtures() {
  __fixtures__ = new RouteRecognizer();
}

/**
 * Load fixtures from AMD modules starting with prefix
 * @param {string} moduleName
 * @param {string} namespace
 */
export function loadFixtures(moduleName, namespace) {
  if (typeof namespace === 'undefined') {
    namespace = '';
  }
  if (requireModule) {
    for (var key in requireModule.entries) {
      if (key !== moduleName + '/_loader' && new RegExp('^' + moduleName + '\/').test(key)) {
        var url = key.replace(moduleName + '/', '');
        var module = requireModule(key);
        if (module && module.default) {
          defineFixture(namespace + '/' + url, module.default);
        }
      }
    }
  }
}

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

export function defineFixture(url, fixture) {
  var callback;

  if (typeof __fixtures__ === 'undefined') {
    resetFixtures();
  }

  if (Em.typeOf(fixture) === 'function') {
    callback =  function() {
      var result = fixture.apply(__context__, arguments);
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
    }
  }

  __fixtures__.add([{path: url, handler: callback}]);
}

/*
 * Looks up a fixture by url.
 *
 * @param {String} url
 */

export function lookupFixture(url, request) {

  if (typeof __fixtures__ === 'undefined') {
    return null;
  }

  var matched = __fixtures__.recognize(url);
  if (matched && matched.length > 0) {
    var route = matched[0];
    // merge route parameters, route query parameters
    var urlParams = Em.merge(route.params, matched.queryParams || {});
    var params = Em.merge(urlParams, (request || {}).data);
    return route.handler.call(null, params, request);
  }
  return null;
}

function makePromise(settings) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    var fixture = lookupFixture(settings.url, settings);
    if (fixture) {
      var callback;
      if (fixture.textStatus === 'success') {
        Em.Logger.info('qd-ajax: Responded to %@ with success.'.fmt( settings.url), fixture);
        callback = resolve;
      } else {
        Em.Logger.info('qd-ajax: Responded to %@ with error.'.fmt( settings.url), fixture);
        callback = reject;
        return Ember.run(null, reject, fixture);
      }
      if (request.DELAY_RESPONSE) {
        Ember.run.later(null, callback, fixture, request.DELAY_TIME);
      } else {
        Ember.run(null, callback, fixture);
      }
      return;
    }
    settings.success = makeSuccess(resolve);
    settings.error = makeError(reject);
    Ember.$.ajax(settings);
  }, 'qd-ajax: ' + (settings.type || 'GET') + ' to ' + settings.url);
}

function parseArgs() {
  var settings = {};
  if (arguments.length === 1) {
    if (typeof arguments[0] === "string") {
      settings.url = arguments[0];
    } else {
      settings = arguments[0];
    }
  } else if (arguments.length === 2) {
    settings = arguments[1];
    settings.url = arguments[0];
  }
  if (settings.success || settings.error) {
    throw new Ember.Error("ajax should use promises, received 'success' or 'error' callback");
  }
  return settings;
}

function makeSuccess(resolve) {
  return function(response, textStatus, jqXHR) {
    Ember.run(null, resolve, {
      response: response,
      textStatus: textStatus,
      jqXHR: jqXHR
    });
  }
}

function makeError(reject) {
  return function(jqXHR, textStatus, errorThrown) {
    Ember.run(null, reject, {
      jqXHR: jqXHR,
      textStatus: textStatus,
      errorThrown: errorThrown
    });
  };
}

if (typeof window.DS !== 'undefined'){
  Ember.onLoad('Ember.Application', function(Application){
    Application.initializer({
      name: 'qd-ajax_REST_Adapter',
      after: 'store',
      initialize: function(container, application){
        if (request.OVERRIDE_REST_ADAPTER) {
          DS.RESTAdapter.reopen({
            ajax: function(url, type, options){
              options = this.ajaxOptions(url, type, options);
              return request(options);
            }
          });
        }
      }
    });
  });
}

var __context__ = {
  /**
   * Delay the response by amount of time specified by time argument. Default 250ms.
   * Return a promise.
   * @param payload {Object|Promise}
   * @param time {Integer}
   * @returns {exports.Promise}
   */
  delay: function(payload, time) {
    if (typeof time === 'undefined') {
      time = 250;
    }

    return new Ember.RSVP.Promise(function(resolve){
      Ember.run.later(function(){
        resolve(payload);
      }, time);
    }, null, "qd-ajax: Delay fixture response.")
  },
  success: function(payload) {
    return {
      response: payload,
      textStatus: 'success'
    }
  },
  error: function(textStatus, errorThrown) {
    return {
      textStatus: textStatus || 'error',
      errorThrown: errorThrown
    }
  }
};
