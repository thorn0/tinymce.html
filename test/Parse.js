(function() {
    module("tinymce.html.Parser");

    var schema = new tinymce.html.Schema({
        valid_elements: '*[class|title|style]',
        valid_styles: {
            '*': ['overflow'],
            p: 'padding-left,text-align',
            h1: 'text-align'
        }
    });
    var serializer = new tinymce.html.Serializer({}, schema);
    var parser, root;

    test('Filter styles', function() {
        parser = new tinymce.html.Parser({}, schema);
        root = parser.parse('<h1 style="foo: bar; display:none; oVerFlOw:   hidden">Foo</h1><p style="padding-left:20px">foo</p>');
        equal(serializer.serialize(root), '<h1 style="overflow: hidden;">Foo</h1><p style="padding-left: 20px;">foo</p>');
    });
})();