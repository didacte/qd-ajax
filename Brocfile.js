var pickFiles = require('broccoli-static-compiler');
var concatFiles = require('broccoli-concat');
var mergeTrees = require('broccoli-merge-trees');
var transpileES6 = require('broccoli-es6-module-transpiler');
var globalizeAMD = require('broccoli-globalize-amd');
var moveFile = require('broccoli-file-mover');
var path = require('path');

function getModuleName(filePath) {
  return filePath.replace(/.js$/, '');
}

var lib = 'lib';

var main = pickFiles(lib, {
  srcDir: '/',
  files: ['main.js'],
  destDir: '/'
});

var transpiledLib = transpileES6(main, { moduleName: 'qd-ajax' });

var bower = path.join(__dirname, 'bower_components');
var routeRecognizer = pickFiles(bower, {
  srcDir: 'route-recognizer/dist',
  files: ['route-recognizer.amd.js'],
  destDir: '/'
});

var mergedTrees = mergeTrees([transpiledLib, routeRecognizer]);

var concatedFiles = concatFiles(mergedTrees, {
  inputFiles: ['**/*.js'],
  outputFile: '/qd-ajax.amd.js'
});

var globalizedAMD = globalizeAMD(concatFiles(mergedTrees, {
  inputFiles: ['**/*.js'],
  outputFile: '/qd-ajax.js'
}), {
  namespace: 'ic = (global.ic || {}); global.ic.ajax',
  moduleName: 'qd-ajax'
});

var concatFixtures = pickFiles(lib, {
  srcDir: '/',
  files: ['concat-fixtures.js'],
  destDir: '/node'
});

var nodeMain = moveFile(concatFixtures, {
  files: {
    'node/concat-fixtures.js': 'node/main.js'
  }
});

module.exports = mergeTrees([globalizedAMD, concatedFiles, nodeMain]);

