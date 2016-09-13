var amdlc = require('amdlc'),
    fs = require('fs'),
    uglify = require('uglify-js'),
    beautify = require('js-beautify').js_beautify;

var packageData = require('tinymce/package.json');
var changelogLine = fs.readFileSync('node_modules/tinymce/changelog.txt', 'utf8').split('\n')[0];
packageData.version = /^Version ([0-9xabrc.]+)/.exec(changelogLine)[1];
packageData.date = /^Version [^\(]+\(([^\)]+)\)/.exec(changelogLine)[1];

var mainLibFile = 'tinymce.html.js';

amdlc.compile({
    moduleOverrides: {
        'tinymce/util/Tools': 'Tools.js'
    },
    version: packageData.version,
    releaseDate: packageData.date,
    baseDir: 'node_modules/tinymce/js/tinymce/classes',
    rootNS: 'tinymce',
    outputSource: mainLibFile,
    expose: 'public',
    from: [
        'html/Serializer.js',
        '../../../../../Parser.js'
    ]
});

var code = fs.readFileSync(mainLibFile, 'utf8');
code = code.replace('nativeDecode(text) {', 'nativeDecode(text) { return text;');
code = code.replace(/throw .+?module definition/g, '//$&');
code = code.replace('exports.AMDLC_TESTS', 'false');
code = code.replace(/== undef\b/g, '== undefined');
code = code.replace(/\/\*(jshint|eslint|globals) .+?\*\//g, '');
code += '\nmodule.exports = exports.tinymce;';
code = removeDeadCode(code);
code = beautify(code);
fs.writeFileSync(mainLibFile, code, 'utf8');

function removeDeadCode(code) {
    var ast = uglify.parse(code);
    ast.figure_out_scope();
    var compressor = uglify.Compressor({
        sequences: false,
        properties: false,
        dead_code: true,
        drop_debugger: true,
        unsafe: false,
        unsafe_comps: false,
        conditionals: true,
        comparisons: false,
        evaluate: true,
        booleans: false,
        loops: false,
        unused: true,
        hoist_funs: false,
        keep_fargs: true,
        keep_fnames: true,
        hoist_vars: false,
        if_return: false,
        join_vars: false,
        collapse_vars: true,
        cascade: false,
        side_effects: true,
        pure_getters: true,
        pure_funcs: null,
        negate_iife: false,
        screw_ie8: false,
        drop_console: true,
        angular: false,
        warnings: true,
        passes: 2
    });
    var compressed_ast = ast.transform(compressor);
    code = compressed_ast.print_to_string({
        beautify: true,
        comments: true,
        bracketize: true,
        quote_style: 1,
        keep_quoted_props: true
    });
    return code;
}