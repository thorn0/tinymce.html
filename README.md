# tinymce.html
[TinyMCE](http://www.tinymce.com) includes sophisticated logic for cleaning up
HTML content. What's interesting about this logic is that it's pure JavaScript.
As it doesn't use any browser-specific APIs, it can be used with Node.js.

[![npm](https://img.shields.io/npm/v/tinymce.html.svg)](https://www.npmjs.com/package/tinymce.html)

## Example

```js
var tinymce = require('tinymce.html');

var schema = new tinymce.html.Schema({
    valid_elements: "@[class],#p,span,a[!href],strong/b",
    valid_classes: "foo"
});
var serializer = new tinymce.html.Serializer({
    indent: true,
    indent_before: 'p',
    indent_after: 'p'
}, schema);
var parser = new tinymce.html.DomParser({
    forced_root_block: 'p'
}, schema);

var initialHtml = '<B title="title" class="foo bar">test</B><a href="//tinymce.com">' +
    'TinyMCE</a><p>Lorem <a>Ipsum</a></p>';
var root = parser.parse(initialHtml);
var result = serializer.serialize(root);

console.log(result);
// <p><strong class="foo">test</strong><a href="//tinymce.com">TinyMCE</a></p>
// <p>Lorem Ipsum</p>
```

## Options

* Schema:
`verify_html`,
[`schema`](http://www.tinymce.com/wiki.php/Configuration:schema),
[`extended_valid_elements`](http://www.tinymce.com/wiki.php/Configuration:extended_valid_elements),
[`invalid_elements`](http://www.tinymce.com/wiki.php/Configuration:invalid_elements),
[`valid_elements`](http://www.tinymce.com/wiki.php/Configuration:valid_elements),
[`valid_classes`](http://www.tinymce.com/wiki.php/Configuration:valid_classes),
[`valid_children`](http://www.tinymce.com/wiki.php/Configuration:valid_children),
[`custom_elements`](http://www.tinymce.com/wiki.php/Configuration:custom_elements)
* Parser:
[`forced_root_block`](http://www.tinymce.com/wiki.php/Configuration:forced_root_block)
* Serializer: `indent`, `indent_before`, `indent_after`

## Links

* [API Documentation](http://www.tinymce.com/wiki.php/api4:namespace.tinymce.html)
* [TinyMCE on GitHub](https://github.com/tinymce/tinymce)
