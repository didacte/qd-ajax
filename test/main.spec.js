var qd = window.qd;

module('qd-ajax', {
  setup: function() {
    qd.ajax.request.DELAY_RESPONSE = false;
    qd.ajax.resetFixtures();
  }
});

test('presence', function() {
  ok(qd.ajax, 'qd.ajax is defined');
});

asyncTest('pulls from fixtures', function() {
  qd.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  qd.ajax.raw('/get').then(function(result) {
    start();
    deepEqual(result, qd.ajax.lookupFixture('/get'));
  });
});

asyncTest('rejects the promise when the textStatus of the fixture is not success', function() {
  qd.ajax.defineFixture('/post', {
    errorThrown: 'Unprocessable Entity',
    textStatus: 'error',
    jqXHR: {}
  });

  start();
  qd.ajax.raw('/post').then(null, function(reason) {
    deepEqual(reason, qd.ajax.lookupFixture('/post'));
  });
});

asyncTest('resolves the response only when not using raw', function() {
  qd.ajax.defineFixture('/get', {
    response: { foo: 'bar' },
    textStatus: 'success',
    jqXHR: {}
  });

  qd.ajax.request('/get').then(function(result) {
    start();
    deepEqual(result, qd.ajax.lookupFixture('/get').response);
  });
});

asyncTest('url as only argument', function() {
  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  qd.ajax.raw('/foo').then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('settings as only argument', function() {
  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  qd.ajax.raw({url: '/foo'}).then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('url and settings arguments', function() {
  var server = fakeServer('GET', '/foo?baz=qux', {foo: 'bar'});
  qd.ajax.raw('/foo', {data: {baz: 'qux'}}).then(function(result) {
    start();
    deepEqual(result.response, {foo: 'bar'});
  });
  server.respond();
  server.restore();
});

asyncTest('A JSON fixture is unaffected by external change', function() {
  var resource = {foo: 'bar'}, result;

  qd.ajax.defineFixture('/foo', {
    response: {resource: resource},
    textStatus: 'success',
    jqXHR: {}
  });

  resource.foo = 'baz';

  qd.ajax.request('/foo').then(function(_result) {
    result = _result;
    notStrictEqual(result.resource, resource);
    deepEqual(result.resource.foo, 'bar');
    return qd.ajax.request('/foo');
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
      jqXHR: {}
    };
  };

  qd.ajax.defineFixture('/foo', fixture);

  qd.ajax.request('/foo').then(function(result) {
      start();
      deepEqual(result.resource.foo, resource.foo);
      notStrictEqual(result.resource, resource);
    }
  );
});

test('throws if success or error callbacks are used', function() {
  var k = function() {};
  throws(function() {
    qd.ajax('/foo', { success: k });
  });
  throws(function() {
    qd.ajax('/foo', { error: k });
  });
  throws(function() {
    qd.ajax('/foo', { success: k, error: k });
  });
});

asyncTest('fixture can be function that returns fixtures', function(){
  expect(1);
  qd.ajax.defineFixture('/foo', function(){
    return {
      response: { foo: 'bar'},
      textStatus: 'success',
      jqXHR: {}
    };
  });

  qd.ajax.request('/foo').then(function(result) {
      start();
      deepEqual(result.foo, 'bar');
    }
  )
});

asyncTest('query params are available inside of fixture functions', function(){
  expect(2);
  qd.ajax.defineFixture('/foo', function(params){
    return {
      response: { meta: { page: params.page || 1 }},
      textStatus: 'success',
      jqXHR: {}
    };
  });

  Em.RSVP.hash({
    page1: qd.ajax.request('/foo'),
    page2: qd.ajax.request('/foo?page=2')
  }).then(function(result){
    start();
    equal(result.page1.meta.page, 1);
    equal(result.page2.meta.page, 2);
  });
});

asyncTest('Return undefined to skip fixture', function(){
  expect(1);

  qd.ajax.defineFixture('/foo', function(params){
    // returns undefined
  });

  var server = fakeServer('GET', '/foo', {foo: 'bar'});
  qd.ajax.request('/foo')
    .then(function(result){
      start();
      equal(result.foo, 'bar');
    });

  server.respond();
  server.restore();
});

test('helpers', function() {
  expect(3);

  qd.ajax.defineFixture('/foo', function(){
    equal(Em.typeOf(this.delay), 'function');
    equal(Em.typeOf(this.success), 'function');
    equal(Em.typeOf(this.error), 'function');
  });

  qd.ajax.lookupFixture('/foo');
});

test('helpers#success', function(){
  qd.ajax.defineFixture('/foo', function(){
    deepEqual(this.success({foo:'bar'}), {
      response: {foo: 'bar'},
      textStatus: 'success'
    });
  });
  qd.ajax.lookupFixture('/foo');
});

test('helpers#error', function(){
  qd.ajax.defineFixture('/foo', function(){
    deepEqual(this.error(), {
      textStatus: 'error',
      errorThrown: void 0
    });

    var error = new Error('You messed up');
    deepEqual(this.error('error', error), {
      textStatus: 'error',
      errorThrown: error
    })
  });
  qd.ajax.lookupFixture('/foo');
});

test('POSTing a serialized JSON object results in object', function(){
  expect(3);

  qd.ajax.defineFixture('/foo', function(params){
    equal(Em.typeOf(params), 'object');
    equal(Em.keys(params).length, 1);
    equal(params.foo, 'baz');

    return this.success(params);
  });

  qd.ajax.request({
    url: '/foo',
    data: JSON.stringify({foo: 'baz'}),
    type: 'POST',
    contentType: 'json'
  });

});

module('qd-ajax with DELAY_RESPONSE=true', {
  setup: function() {
    qd.ajax.request.DELAY_RESPONSE = true;
    qd.ajax.request.DELAY_TIME = 250;
    qd.ajax.resetFixtures();
  }
});

asyncTest('response are delayed by default', function(){
  expect(2);
  qd.ajax.defineFixture('/foo', function(){
    return this.success({foo: 'bar'});
  });
  var before, after;
  before = new Date();
  qd.ajax.request('/foo')
    .then(function(payload){
      start();
      equal(payload.foo, 'bar');
      after = new Date();
      ok( (after - before) > qd.ajax.request.DELAY_TIME );
    }, function() {
      start();
      ok(false, 'this test should not have triggered a promise rejection');
    });
});

asyncTest('response delay time can be set', function(){
  expect(3);
  qd.ajax.defineFixture('/foo', function(){
    return this.success({foo: 'bar'});
  });
  var before, after;
  before = new Date();
  qd.ajax.request.DELAY_TIME = 3000;
  qd.ajax.request('/foo')
    .then(function(payload){
      start();
      equal(qd.ajax.request.DELAY_TIME, 3000);
      equal(payload.foo, 'bar');
      after = new Date();
      ok( (after - before) > 3000);
    })
});

if (parseFloat(Ember.VERSION) >= 1.3) {
  function promiseLabelOf(promise) {
    return promise._label;
  }

  test('labels the promise', function() {
    var promise = qd.ajax.request('/foo');
    equal(promiseLabelOf(promise), 'qd-ajax: unwrap raw ajax response', 'promise is labeled');
  });

  test('labels the promise', function() {
    var promise = qd.ajax.raw('/foo');
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



