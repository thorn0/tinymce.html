var testrunner = require('qunit'), // https://github.com/kof/node-qunit
    globby = require('globby'), // https://github.com/sindresorhus/globby
    fs = require('fs-extra'),
    path = require('path');

var mainLibFile = 'tinymce.html.js';
var srcTestWildcard = ['node_modules/tinymce/tests/tinymce/html/!(Styles).js'];
var tmpTestDir = 'tmptests';
var tranformedMainLibFile = path.resolve(tmpTestDir, path.basename(mainLibFile));

fs.emptyDirSync(tmpTestDir);

var tests = globby.sync(srcTestWildcard).map(function(srcFile) {
    var data = fs.readFileSync(srcFile, 'utf8')
        .replace(/\bmodule\((\").*?\1\)/g, 'QUnit.$&')
        .replace(/\btinymce\.extend\(/g, 'tinymce.util.Tools.extend(');
    var destFile = path.resolve(tmpTestDir, path.basename(srcFile));
    fs.writeFileSync(destFile, data, 'utf8');
    return destFile;
});

var data = fs.readFileSync(mainLibFile, 'utf8');
data = data.replace('module.exports = ', '//');
fs.writeFileSync(tranformedMainLibFile, data, 'utf8');

testrunner.run({
    code: tranformedMainLibFile,
    tests: tests,
    maxBlockDuration: 10000,
    log: {
        assertions: false,
        errors: true,
        tests: false,
        summary: false,
        globalSummary: true,
        coverage: true,
        globalCoverage: true,
        testing: true
    }
}, function(err, report) {
    if (err) {
        console.log(err);
    }
    fs.removeSync(tmpTestDir);
});