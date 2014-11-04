/*!
 * qd-ajax
 *
 * - (c) 2014 Quandl, Inc
 * - please see license at https://github.com/quandl/qd-ajax/blob/master/LICENSE
 * - forked of instructure/ic-ajax: https://github.com/instructure/ic-ajax
 * - inspired by discourse ajax: https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/mixins/ajax.js#L19
 */

'use strict';

module.exports = {
  name: 'qd-ajax',
  concatFixtures: require('./lib/concat-fixtures'),
  afterInstall: function(options) {
    return this.addBowerPackageToProject('route-recognizer', '0.1.1');
  },
  included: function qd_ajax_included(app) {
    this._super.included(app);
    app.import(app.bowerDirectory + '/route-recognizer/dist/route-recognizer.amd.js', {
      exports: {
        'route-recognizer': [
          'default'
        ]
      }
    });

    if (app.name === 'dummy' && app.env === 'development') {
      app.import(app.bowerDirectory + '/sinon/index.js');
    }
  }
};
