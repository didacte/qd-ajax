import request from 'qd-ajax/request';
import config from 'qd-ajax/config';
import fixtures from 'qd-ajax/fixtures';

module('qd-ajax with DELAY_RESPONSE=true', {
  teardown: function() {
    fixtures.reset();
    config.DELAY_TIME = 250;
    config.DELAY_RESPONSE = false;
  }
});

asyncTest('response are not delayed by default', function(){
  expect(2);
  fixtures.define('/foo', function(){
    return this.success({foo: 'bar'});
  });
  var before, after;
  before = new Date();
  config.DELAY_TIME = 250;
  request('/foo')
    .then(function(payload){
      start();
      equal(payload.foo, 'bar');
      after = new Date();
      ok( (after - before) < config.DELAY_TIME );
    }, function() {
      start();
      ok(false, 'this test should not have triggered a promise rejection');
    });
});

asyncTest('response delay time can be set', function(){
  expect(3);
  fixtures.define('/foo', function(){
    return this.success({foo: 'bar'});
  });
  var before, after;
  before = new Date();
  config.DELAY_RESPONSE = true;
  config.DELAY_TIME = 500;
  request('/foo')
    .then(function(payload){
      start();
      equal(config.DELAY_TIME, 500);
      equal(payload.foo, 'bar');
      after = new Date();
      ok( (after - before) > 500);
    });
});
