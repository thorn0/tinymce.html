var amdlc = require("amdlc"),
    fs = require('fs');

var packageData = require('tinymce/package.json');
var changelogLine = fs.readFileSync('node_modules/tinymce/changelog.txt', 'utf8').split('\n')[0];
packageData.version = /^Version ([0-9xabrc.]+)/.exec(changelogLine)[1];
packageData.date = /^Version [^\(]+\(([^\)]+)\)/.exec(changelogLine)[1];

var mainLibFile = 'tinymce.html.js';

amdlc.compile({
    moduleOverrides: {
        'tinymce/Env': 'Env.stub.js'
    },
    version: packageData.version,
    releaseDate: packageData.date,
    baseDir: 'node_modules/tinymce/js/tinymce/classes',
    rootNS: 'tinymce',
    outputSource: mainLibFile,
    expose: 'public',
    from: [
        'html/DomParser.js',
        'html/Serializer.js'
    ]
});

var data = fs.readFileSync(mainLibFile, 'utf8');
data = data.replace('nativeDecode(text) {', 'nativeDecode(text) { return text;');
data += '\nmodule.exports = exports.tinymce;';
fs.writeFileSync(mainLibFile, data, 'utf8');