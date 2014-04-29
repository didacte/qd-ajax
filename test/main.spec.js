module('qd-ajax', {
  teardown: function() {
    ic.ajax.resetFixtures();
  }
});

test('presence', function() {
  ok(ic.ajax, 'ic.ajax is defined');
});

asyncTest('pulls from fixtures', function() {
  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  ic.ajax.raw('/get').then(function(result) {
    start();
    deepEqual(result, ic.ajax.lookupFixture('/get'));
  });
});

asyncTest('rejects the promise when the textStatus of the fixture is not success', function() {
  ic.ajax.defineFixture('/post', {
    errorThrown: 'Unprocessable Entity',
    textStatus: 'error',
    jqXHR: {}
  });

  start();
  ic.ajax.raw('/post').then(null, function(reason) {
    deepEqual(reason, ic.ajax.lookupFixture('/post'));
  });
});

asyncTest('resolves the response only when not using raw', function() {
  ic.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  ic.ajax.request('/get').then(function(result) {
    start();
    deepEqual(result, ic.ajax.lookupFixture('/get').response);
  });
});

asyncTest('url as only argument', function() {
  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  ic.ajax.raw('/foo').then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('settings as only argument', function() {
  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  ic.ajax.raw({url: '/foo'}).then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('url and settings arguments', function() {
  var server = fakeServer('GET', '/foo?baz=qux', {foo: 'bar'});
  ic.ajax.raw('/foo', {data: {baz: 'qux'}}).then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('A JSON fixture is unaffected by external change', function() {
  var resource = {foo: 'bar'}, result;

  ic.ajax.defineFixture('/foo', {
    response: {resource: resource},
    textStatus: 'success',
    jqXHR: {}
  });

  resource.foo = 'baz';

  ic.ajax.request('/foo').then(function(_result) {
    result = _result;
    notStrictEqual(result.resource, resource);
    deepEqual(result.resource.foo, 'bar');
    return ic.ajax.request('/foo');
  }).then(function(secondResult) {
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
      jqXHR: {},
    };
  };

  ic.ajax.defineFixture('/foo', fixture);

  ic.ajax.request('/foo').then(function(result) {
      start();
      deepEqual(result.resource.foo, resource.foo);
      notStrictEqual(result.resource, resource);
    }
  );
});

test('throws if success or error callbacks are used', function() {
  var k = function() {};
  throws(function() {
    ic.ajax('/foo', { success: k });
  });
  throws(function() {
    ic.ajax('/foo', { error: k });
  });
  throws(function() {
    ic.ajax('/foo', { success: k, error: k });
  });
});

asyncTest('fixture can be function that returns fixtures', function(){
  expect(1);
  ic.ajax.defineFixture('/foo', function(){
    return {
      response: { foo: 'bar'},
      textStatus: 'success',
      jqXHR: {}
    };
  });

  ic.ajax.request('/foo').then(function(result) {
      start();
      deepEqual(result.foo, 'bar');
    }
  )
});

asyncTest('query params are available inside of fixture functions', function(){
  expect(2);
  ic.ajax.defineFixture('/foo', function(params){
    return {
      response: { meta: { page: params.page || 1 }},
      textStatus: 'success',
      jqXHR: {}
    };
  });

  Em.RSVP.hash({
    page1: ic.ajax.request('/foo'),
    page2: ic.ajax.request('/foo?page=2')
  }).then(function(result){
    start();
    equal(result.page1.meta.page, 1);
    equal(result.page2.meta.page, 2);
  });
});

if (parseFloat(Ember.VERSION) >= 1.3) {
  function promiseLabelOf(promise) {
    return promise._label;
  }

  test('labels the promise', function() {
    var promise = ic.ajax.request('/foo');
    equal(promiseLabelOf(promise), 'qd-ajax: unwrap raw ajax response', 'promise is labeled');
  });

  test('labels the promise', function() {
    var promise = ic.ajax.raw('/foo');
    equal(promiseLabelOf(promise), 'qd-ajax: GET to /foo', 'promise is labeled');
  });
}

function fakeServer(method, url, response) {
  var server = sinon.fakeServer.create();
  var data = {foo: 'bar'};
  server.respondWith(method, url, [
    200,
    { "Content-Type": "application/json" },
    JSON.stringify(response)
  ]);
  return server;
}

