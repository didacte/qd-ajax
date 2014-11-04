import raw from 'qd-ajax/raw';
import request from 'qd-ajax/request';

module('qd-ajax - promise labels');

function promiseLabelOf(promise) {
  return promise._label;
}

test('request labels the promise', function() {
  var promise = request('/foo');
  equal(promiseLabelOf(promise), 'qd-ajax: unwrap raw ajax response', 'promise is labeled');
});

test('raw labels the promise', function() {
  var promise = raw('/foo');
  equal(promiseLabelOf(promise), 'qd-ajax: GET to /foo', 'promise is labeled');
});
