import Ember from 'ember';
import raw from 'qd-ajax/raw';
import request from 'qd-ajax/request';
import fixtures from 'qd-ajax/fixtures';
import fakeServer from '../helpers/fake-server';

module('qd-ajax', {
  setup: function() {
    request.DELAY_RESPONSE = false;
  },
  teardown: function() {
    fixtures.reset();
  }
});

asyncTest('pulls from fixtures', function() {
  fixtures.define('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  raw('/get').then(function(result) {
    start();
    deepEqual(result, fixtures.lookup('/get'));
  });
});

asyncTest('rejects the promise when the textStatus of the fixture is not success', function() {
  fixtures.define('/post', {
    errorThrown: 'Unprocessable Entity',
    textStatus: 'error',
    jqXHR: {}
  });

  start();
  raw('/post').then(null, function(reason) {
    deepEqual(reason, fixtures.lookup('/post'));
  });
});

asyncTest('resolves the response only when not using raw', function() {
  fixtures.define('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  request('/get')
    .then(function(result) {
      start();
      deepEqual(result, fixtures.lookup('/get').response);
    });
});

asyncTest('url as only argument', function() {
  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  raw('/foo')
    .then(function(result) {
      start();
      deepEqual(result.response, {foo: 'bar'});
    });
  server.respond();
  server.restore();
});

asyncTest('settings as only argument', function() {
  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  raw({url: '/foo'}).then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('url and settings arguments', function() {
  var server = fakeServer('GET', '/foo?baz=qux', {foo: 'bar'});
  raw('/foo', {data: {baz: 'qux'}}).then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('A JSON fixture is unaffected by external change', function() {
  var resource = {foo: 'bar'}, result;

  fixtures.define('/foo', {
    response: {resource: resource},
    textStatus: 'success',
    jqXHR: {}
  });

  resource.foo = 'baz';

  request('/foo')
    .then(function(_result) {
      result = _result;
      notStrictEqual(result.resource, resource);
      deepEqual(result.resource.foo, 'bar');
      return request('/foo');
    })
    .then(function(secondResult) {
      notStrictEqual(result.resource, secondResult.resource);
      start();
    });
});

asyncTest('A function fixture is unaffected by subsequent change', function() {
  var resource = {foo: 'bar'};
  var fixture  = function() {
    return {
      response: {resource: resource},
      textStatus: 'success',
      jqXHR: {}
    };
  };

  fixtures.define('/foo', fixture);

  request('/foo')
    .then(function(result) {
      start();
      deepEqual(result.resource.foo, resource.foo);
      notStrictEqual(result.resource, resource);
    });
});

test('throws if success or error callbacks are used', function() {
  var k = function() {};
  throws(function() {
    raw('/foo', { success: k });
  });
  throws(function() {
    raw('/foo', { error: k });
  });
  throws(function() {
    raw('/foo', { success: k, error: k });
  });
});

asyncTest('fixture can be function that returns fixtures', function(){
  expect(1);
  fixtures.define('/foo', function(){
    return {
      response: { foo: 'bar'},
      textStatus: 'success',
      jqXHR: {}
    };
  });

  request('/foo').then(function(result) {
    start();
    deepEqual(result.foo, 'bar');
  });
});

asyncTest('query params are available inside of fixture functions', function(){
  expect(2);
  fixtures.define('/foo', function(params){
    return {
      response: { meta: { page: params.page || 1 }},
      textStatus: 'success',
      jqXHR: {}
    };
  });

  Ember.RSVP.hash({
    page1: request('/foo'),
    page2: request('/foo?page=2')
  })
    .then(function(result){
      start();
      equal(result.page1.meta.page, 1);
      equal(result.page2.meta.page, 2);
    });
});

asyncTest('Return undefined to skip fixture', function(){
  expect(1);

  fixtures.define('/foo', function(params){
    // returns undefined
  });

  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  request('/foo')
    .then(function(result){
      start();
      equal(result.foo, 'bar');
    });

  server.respond();
  server.restore();
});



test('POSTing a serialized JSON object results in object', function(){
  expect(3);

  fixtures.define('/foo', function(params){
    equal(Ember.typeOf(params), 'object');
    equal(Ember.keys(params).length, 1);
    equal(params.foo, 'baz');

    return this.success(params);
  });

  request({
    url: '/foo',
    data: JSON.stringify({foo: 'baz'}),
    type: 'POST',
    contentType: 'json'
  });

});

asyncTest('Specifying response code in fixture is passed on to response', function(){
  expect(2);

  fixtures.define('/foo', function(){
    return {
      response: { foo: 'bar' },
      textStatus: 'Unprocessable Entity',
      jqXHR: {
        status: 422
      }
    };
  });

  request('/foo')
    .then(function(){
      start();
      ok(false, 'the response was suppose to fail');
    }, function(error){
      start();
      equal(error.jqXHR.status, 422);
      equal(error.textStatus, 'Unprocessable Entity');
    });
});
