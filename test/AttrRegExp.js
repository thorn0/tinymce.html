(function() {
    module("tinymce.html.SaxParser attributes");

    // JavaScriptCore stops matching a repeated group after ~500k iterations, losing long data: URIs
    // in Safari. V8 has no such limit, so check the shape of the regex instead.
    test('Attribute values are not matched one group repetition per character', function() {
        var source = new tinymce.html.SaxParser().parse.toString();
        ok(/attrRegExp = \//.test(source), 'attrRegExp is where the test expects it');
        ok(!/\(\?:\[\^\\?["']\]\)\*/.test(source), 'no (?:[^"])* in the attribute regex');
    });
})();
