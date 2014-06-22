'use strict';

var path = require('path');
var fs   = require('fs');

function EmberCLIQDAjax(project) {
  this.project = project;
  this.name    = 'Ember CLI qd-ajax';
}

function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
}

EmberCLIQDAjax.prototype.treeFor = function treeFor(name) {
  if (name !== 'vendor') { return; }
  var treePath = path.join('node_modules', 'qd-ajax', 'dist');
  if (fs.existsSync(treePath)) {
    return unwatchedTree(treePath);
  }
};

EmberCLIQDAjax.prototype.included = function included(app) {
  this.app = app;
  var options = this.app.options.qdAjaxOptions || {enabled: true};

  if (options.enabled) {
    this.app.import('vendor/qd-ajax.amd.js', {
      'qd-ajax': [
        'default',
        'defineFixture',
        'lookupFixture',
        'raw',
        'request',
        'resetFixtures'
      ]
    });
  }
};

module.exports = EmberCLIQDAjax;