/**
 * This class extends tinymce.html.DomParser adding an attribute filter to process styles.
 * The base DomParser class doesn't process styles by default. This logic is implemented in the editor class
 * by adding a similar attribute filter to an instance of DomParser.
 * @class tinymce.html.DomParser
 */
define("tinymce/html/Parser", [
    "tinymce/html/DomParser",
    "tinymce/html/Styles"
], function(DomParser, Styles) {
    /**
     * Constructs a new Parser instance.
     *
     * @constructor
     * @method Parser
     * @param {Object} settings Name/value collection of settings. comment, cdata, text, start and end are callbacks.
     * @param {tinymce.html.Schema} schema HTML Schema class to use when parsing.
     */
    return function(settings, schema) {
        var instance = new DomParser(settings, schema);
        var styles = new Styles({
            url_converter: settings.url_converter,
            url_converter_scope: settings.url_converter_scope
        }, schema);
        instance.addAttributeFilter('style', function(nodes, name) {
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                node.attr(name, styles.serialize(styles.parse(node.attr(name)), node.name) || null);
            }
        });
        return instance;
    };
});
