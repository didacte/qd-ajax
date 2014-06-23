# qd-ajax

Ember-friendly `jQuery.ajax` wrapper.

- returns RSVP promises
- makes apps more testable (resolves promises with `Ember.run`)
- makes testing ajax simpler with fixture support

## Installation

### Browser Package

1. `bower install --save qd-ajax`
2. link to global or AMD build in Bower Components directory
    * Global - ```<script src="/bower_components/qd-ajax/dist/qd-ajax.js"></script>```
    * AMD - ```<script src="/bower_components/qd-ajax/dist/qd-ajax.amd.js"></script>```

### Server Side Package

Server side package is a [Broccoli.js](https://github.com/broccolijs/broccoli) plugin that concatinates all of the fixtures into a single file that you can consume in your browser app.  

`npm install --save-dev qd-ajax`

In your Brocfile.js

```javascript
var concatFixtures = require('qd-ajax');

// concatFixtures( inputTree, moduleName, outputFile )
return concatFixtures('fixtures', 'fixtures', '/fixtures.js');
```

## API


This lib simply wraps `jQuery.ajax` with two exceptions:

- success and error callbacks are not supported
- does not resolve three arguments like $.ajax (real promises only
  resolve a single value). `request` only resolves the response data
  from the request, while `raw` resolves an object with the three
  "arguments" as keys if you need them.

Other than that, use `request` exactly like `$.ajax`.

```js
var ajax = qd.ajax;

App.ApplicationRoute = Ember.Route.extend({
  model: function() {
    return ajax.request('/foo');
  }
}

// if you need access to the jqXHR or textStatus, use raw
ajax.raw('/foo').then(function(result) {
  // result.response
  // result.textStatus
  // result.jqXHR
});
```

## Ember Data

By default, if Ember Data is on the page, qd-ajax will override the
`RESTAdapter`'s `ajax` method to use qd-ajax instead of jQuery's ajax.

To opt out of the behavior, you can set `qd.ajax.request.OVERRIDE_REST_ADAPTER = false`
after loading qd-ajax.

## Simplified Testing

In order to test newly added code you must rebuild the distribution.

```bash
broccoli build dist
```

Adding fixtures with `defineFixture` tells qd-ajax to resolve the promise
with the fixture matching a url instead of making a request. This allows
you to test your app without creating fake servers with sinon, etc.

Example:

```javascript
qd.ajax.defineFixture('api/v1/courses', {
  response: [{name: 'basket weaving'}],
  jqXHR: {},
  textStatus: 'success'
});

qd.ajax.request('api/v1/courses').then(function(result) {
  deepEqual(result, qd.ajax.lookupFixture('api/v1/courses').response);
});
```

To test failure paths, set the `textStatus` to anything but `success`.

## Fixture Helpers

### delay(payload, [time]) 

Delay helper returns promise that will resolve after period of time specified by **time** parameter. The time parameter is optional and defaults to 250ms.

```javascript
qd.ajax.defineFixture('api/v1/courses', function(){
  return this.delay({
    response: [{name: 'basket weaving'}],
    jqXHR: {},
    textStatus: 'success'
  }, 300);
});
```

### success(payload)

Return jQuery.ajax compatible success response.

```javascript
qd.ajax.defineFixture('api/v1/courses', function() {
  return this.success([{name: 'basket weaving'}]);
});
```

### error([textStatus], [errorThrown])

Return jQuery.ajax compatible error response.

```javascript
qd.ajax.defineFixture('api/v1/courses', function() {
  return this.error();
});
```

Contributing
------------

Install dependencies and run tests with the following:

```sh
npm install
npm test
```

For those of you with release privileges:

```sh
npm run-script release
```

Special Thanks
--------------

Forked from [ic-ajax by Instructure][2].
Original code inspired by [discourse ajax][1].

License and Copyright
---------------------

MIT Style license

(c) 2014 Quandl Inc.


  [1]:https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/mixins/ajax.js#L19
  [2]:https://github.com/instructure/ic-ajax
