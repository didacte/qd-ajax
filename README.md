qd-ajax
=======

[![Build Status](https://travis-ci.org/instructure/qd-ajax.png)](https://travis-ci.org/instructure/qd-ajax)

Ember-friendly `jQuery.ajax` wrapper.

- returns RSVP promises
- makes apps more testable (resolves promises with `Ember.run`)
- makes testing ajax simpler with fixture support

Installation
------------

`bower install qd-ajax`

... or ...

`npm install qd-ajax`

Module Support
--------------

Note the `dist` directory has multiple module formats, use whatever
works best for you.

- AMD

  `define(['qd-ajax'], function(ajax) {});`

- Node.JS (CJS)

  `var ajax = require('qd-ajax')`

- Globals

  `var ajax = qd.ajax;`

  All instructure canvas stuff lives on the `ic` global.

API
---

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

Ember Data
------------------

By default, if Ember Data is on the page, qd-ajax will override the
`RESTAdapter`'s `ajax` method to use qd-ajax instead of jQuery's ajax.

To opt out of the behavior, you can set `ic.ajax.request.OVERRIDE_REST_ADAPTER = false`
after loading qd-ajax.

Simplified Testing
------------------

In order to test newly added code you must rebuild the distribution.

```bash
broccoli build dist
```

Adding fixtures with `defineFixture` tells qd-ajax to resolve the promise
with the fixture matching a url instead of making a request. This allows
you to test your app without creating fake servers with sinon, etc.

Example:

```js
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