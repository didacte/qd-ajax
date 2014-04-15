var pickFiles = require('broccoli-static-compiler');
var concatFiles = require('broccoli-concat');
var mergeTrees = require('broccoli-merge-trees');
var transpileES6 = require('broccoli-es6-module-transpiler');
var globalizeAMD = require('broccoli-globalize-amd');
var path = require('path');

function getModuleName(filePath) {
  return filePath.replace(/.js$/, '');
}

var lib = 'lib';

var transpiledLib = transpileES6(lib, { moduleName: 'ic-ajax' });

var bower = path.join(__dirname, 'bower_components');
var routeRecognizer = pickFiles(bower, {
  srcDir: 'route-recognizer/dist',
  files: ['route-recognizer.amd.js'],
  destDir: '/'
});

var mergedTrees = mergeTrees([transpiledLib, routeRecognizer]);

var concatedFiles = concatFiles(mergedTrees, {
  inputFiles: ['**/*.js'],
  outputFile: '/ic-ajax.amd.js'
});

var globalizedAMD = globalizeAMD(concatFiles(mergedTrees, {
  inputFiles: ['**/*.js'],
  outputFile: '/ic-ajax.js'
}), {
  namespace: 'ic = (global.ic || {}); global.ic.ajax',
  moduleName: 'ic-ajax'
});

module.exports = mergeTrees([globalizedAMD, concatedFiles]);

