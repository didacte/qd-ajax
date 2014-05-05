module.exports = function(tree, moduleName, outputFile) {
  var pickFiles = require('broccoli-static-compiler');
  var mergeTrees = require('broccoli-merge-trees');
  var compileES6 = require('broccoli-es6-concatenator');
  var quickTemp = require('quick-temp');
  var fixturify = require('fixturify');

  var fixtures = pickFiles(tree, {
    srcDir: '/',
    files: ['**/*.js'],
    destDir: '/' + moduleName
  });

  quickTemp.makeOrRemake(this, 'loaderDir');

  fixturify.writeSync(this.loaderDir, {
    '_loader.js': '// Hack for  https://github.com/joliss/broccoli-es6-concatenator/issues/9'
  });

  var loader = pickFiles(this.loaderDir, {
    srcDir: '/',
    files: ['_loader.js'],
    destDir: '/' + moduleName
  });

  var fixturesJs = compileES6(mergeTrees([fixtures, loader]), {
    loaderFile: moduleName + '/_loader.js',
    ignoreModules: [],
    inputFiles: ['**/*.js'],
    legacyFilesToAppend: [],
    wrapInEval: true,
    outputFile: outputFile
  });

  return fixturesJs;
};