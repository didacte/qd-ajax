import Ember from 'ember';
import config from './config';
import fixtures from './fixtures';

/*
 * Same as `request` except it resolves an object with `{response, textStatus,
 * jqXHR}`, useful if you need access to the jqXHR object for headers, etc.
 */
export default function raw() {
  return makePromise(parseArgs.apply(null, arguments));
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

export function makePromise(settings) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    var fixture = fixtures.lookup(settings.url, settings);
    if (fixture) {
      var callback;
      if (fixture.textStatus === 'success') {
        Ember.Logger.info('qd-ajax: Responded to %@ with success.'.fmt(settings.url), fixture);
        callback = resolve;
      } else {
        Ember.Logger.info('qd-ajax: Responded to %@ with error.'.fmt(settings.url), fixture);
        callback = reject;
        return Ember.run.later(null, reject, fixture);
      }
      if (config.DELAY_RESPONSE) {
        Ember.run.later(null, callback, fixture, config.DELAY_TIME);
      } else {
        Ember.run.later(null, callback, fixture);
      }
      return;
    }
    settings.success = makeSuccess(resolve);
    settings.error = makeError(reject);
    Ember.$.ajax(settings);
  }, 'qd-ajax: ' + (settings.type || 'GET') + ' to ' + settings.url);
}

function makeSuccess(resolve) {
  return function(response, textStatus, jqXHR) {
    Ember.run(null, resolve, {
      response: response,
      textStatus: textStatus,
      jqXHR: jqXHR
    });
  };
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
