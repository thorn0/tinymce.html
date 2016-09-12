# tinymce.html
[TinyMCE](http://www.tinymce.com) includes sophisticated logic for cleaning up
HTML content. What's interesting about this logic is that it's pure JavaScript.
It doesn't use any browser-specific APIs and can be used with Node.js.

[![Build Status](https://travis-ci.org/thorn0/tinymce.html.svg?branch=master)](https://travis-ci.org/thorn0/tinymce.html)
[![npm](https://img.shields.io/npm/v/tinymce.html.svg)](https://www.npmjs.com/package/tinymce.html)

## Example

```js
var tinymce = require('tinymce.html');

var schema = new tinymce.html.Schema({
    valid_elements: "@[class],#p,span,a[!href],strong/b",
    valid_classes: "foo"
});

var parser = new tinymce.html.Parser({
    forced_root_block: 'p'
}, schema);

var serializer = new tinymce.html.Serializer({
    indent: true,
    indent_before: 'p',
    indent_after: 'p'
}, schema);

var html = '<B title="title" class="foo bar">test</B><a href="//tinymce.com">' +
    'TinyMCE</a><p>Lorem <a>Ipsum</a></p>';
var root = parser.parse(initialHtml);
var result = serializer.serialize(root);

console.log(result);
// <p><strong class="foo">test</strong><a href="//tinymce.com">TinyMCE</a></p>
// <p>Lorem Ipsum</p>
```

## Options

* Schema:

    * [`valid_elements`](https://www.tinymce.com/docs/configure/content-filtering/#valid_elements)
    * [`valid_classes`](https://www.tinymce.com/docs/configure/content-filtering/#valid_classes)
    * [`valid_children`](https://www.tinymce.com/docs/configure/content-filtering/#valid_children)
    * [`valid_styles`](https://www.tinymce.com/docs/configure/content-filtering/#valid_styles) (use `tinymce.html.Parser` for this option to work, not `tinymce.html.DomParser`)
    * [`extended_valid_elements`](https://www.tinymce.com/docs/configure/content-filtering/#extended_valid_elements)
    * [`invalid_elements`](https://www.tinymce.com/docs/configure/content-filtering/#invalid_elements)
    * [`custom_elements`](https://www.tinymce.com/docs/configure/content-filtering/#custom_elements)
    * [`schema`](https://www.tinymce.com/docs/configure/content-filtering/#schema) (`"html5"`, `"html4"`, `"html5-strict"`)
* Parser:
    * [`forced_root_block`](https://www.tinymce.com/docs/configure/content-filtering/#forced_root_block)
* Serializer:
    * `indent`
    * `indent_before`
    * `indent_after`

## Links

* [API Documentation](https://www.tinymce.com/docs/api/tinymce.html/)
* [TinyMCE on GitHub](https://github.com/tinymce/tinymce)
