import Ember from 'ember';
import fixtures from 'qd-ajax/fixtures';

var typeOf = Ember.typeOf;

module('context helpers');

test('helpers', function() {
  expect(3);

  fixtures.define('/foo', function(){
    equal(typeOf(this.delay), 'function');
    equal(typeOf(this.success), 'function');
    equal(typeOf(this.error), 'function');
  });

  fixtures.lookup('/foo');
});

test('helpers#success', function(){
  fixtures.define('/foo', function(){
    deepEqual(this.success({foo:'bar'}), {
      response: {foo: 'bar'},
      textStatus: 'success'
    });
  });
  fixtures.lookup('/foo');
});

test('helpers#error', function(){
  fixtures.define('/foo', function(){
    deepEqual(this.error(), {
      textStatus: 'error',
      errorThrown: void 0
    });

    var error = new Error('You messed up');
    deepEqual(this.error('error', error), {
      textStatus: 'error',
      errorThrown: error
    });
  });
  fixtures.lookup('/foo');
});
