// 4.3.1 (2015-11-30)

/**
 * Compiled inline version. (Library mode)
 */

/*jshint smarttabs:true, undef:true, latedef:true, curly:true, bitwise:true, camelcase:true */
/*globals $code */

(function(exports, undefined) {
	"use strict";

	var modules = {};

	function require(ids, callback) {
		var module, defs = [];

		for (var i = 0; i < ids.length; ++i) {
			module = modules[ids[i]] || resolve(ids[i]);
			if (!module) {
				throw 'module definition dependecy not found: ' + ids[i];
			}

			defs.push(module);
		}

		callback.apply(null, defs);
	}

	function define(id, dependencies, definition) {
		if (typeof id !== 'string') {
			throw 'invalid module definition, module id must be defined and be a string';
		}

		if (dependencies === undefined) {
			throw 'invalid module definition, dependencies must be specified';
		}

		if (definition === undefined) {
			throw 'invalid module definition, definition function must be specified';
		}

		require(dependencies, function() {
			modules[id] = definition.apply(null, arguments);
		});
	}

	function defined(id) {
		return !!modules[id];
	}

	function resolve(id) {
		var target = exports;
		var fragments = id.split(/[.\/]/);

		for (var fi = 0; fi < fragments.length; ++fi) {
			if (!target[fragments[fi]]) {
				return;
			}

			target = target[fragments[fi]];
		}

		return target;
	}

	function expose(ids) {
		var i, target, id, fragments, privateModules;

		for (i = 0; i < ids.length; i++) {
			target = exports;
			id = ids[i];
			fragments = id.split(/[.\/]/);

			for (var fi = 0; fi < fragments.length - 1; ++fi) {
				if (target[fragments[fi]] === undefined) {
					target[fragments[fi]] = {};
				}

				target = target[fragments[fi]];
			}

			target[fragments[fragments.length - 1]] = modules[id];
		}
		
		// Expose private modules for unit tests
		if (exports.AMDLC_TESTS) {
			privateModules = exports.privateModules || {};

			for (id in modules) {
				privateModules[id] = modules[id];
			}

			for (i = 0; i < ids.length; i++) {
				delete privateModules[ids[i]];
			}

			exports.privateModules = privateModules;
		}
	}

// Included from: node_modules/tinymce/js/tinymce/classes/html/Node.js

/**
 * Node.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/**
 * This class is a minimalistic implementation of a DOM like node used by the DomParser class.
 *
 * @example
 * var node = new tinymce.html.Node('strong', 1);
 * someRoot.append(node);
 *
 * @class tinymce.html.Node
 * @version 3.4
 */
define("tinymce/html/Node", [], function() {
	var whiteSpaceRegExp = /^[ \t\r\n]*$/, typeLookup = {
		'#text': 3,
		'#comment': 8,
		'#cdata': 4,
		'#pi': 7,
		'#doctype': 10,
		'#document-fragment': 11
	};

	// Walks the tree left/right
	function walk(node, root_node, prev) {
		var sibling, parent, startName = prev ? 'lastChild' : 'firstChild', siblingName = prev ? 'prev' : 'next';

		// Walk into nodes if it has a start
		if (node[startName]) {
			return node[startName];
		}

		// Return the sibling if it has one
		if (node !== root_node) {
			sibling = node[siblingName];

			if (sibling) {
				return sibling;
			}

			// Walk up the parents to look for siblings
			for (parent = node.parent; parent && parent !== root_node; parent = parent.parent) {
				sibling = parent[siblingName];

				if (sibling) {
					return sibling;
				}
			}
		}
	}

	/**
	 * Constructs a new Node instance.
	 *
	 * @constructor
	 * @method Node
	 * @param {String} name Name of the node type.
	 * @param {Number} type Numeric type representing the node.
	 */
	function Node(name, type) {
		this.name = name;
		this.type = type;

		if (type === 1) {
			this.attributes = [];
			this.attributes.map = {};
		}
	}

	Node.prototype = {
		/**
		 * Replaces the current node with the specified one.
		 *
		 * @example
		 * someNode.replace(someNewNode);
		 *
		 * @method replace
		 * @param {tinymce.html.Node} node Node to replace the current node with.
		 * @return {tinymce.html.Node} The old node that got replaced.
		 */
		replace: function(node) {
			var self = this;

			if (node.parent) {
				node.remove();
			}

			self.insert(node, self);
			self.remove();

			return self;
		},

		/**
		 * Gets/sets or removes an attribute by name.
		 *
		 * @example
		 * someNode.attr("name", "value"); // Sets an attribute
		 * console.log(someNode.attr("name")); // Gets an attribute
		 * someNode.attr("name", null); // Removes an attribute
		 *
		 * @method attr
		 * @param {String} name Attribute name to set or get.
		 * @param {String} value Optional value to set.
		 * @return {String/tinymce.html.Node} String or undefined on a get operation or the current node on a set operation.
		 */
		attr: function(name, value) {
			var self = this, attrs, i, undef;

			if (typeof name !== "string") {
				for (i in name) {
					self.attr(i, name[i]);
				}

				return self;
			}

			if ((attrs = self.attributes)) {
				if (value !== undef) {
					// Remove attribute
					if (value === null) {
						if (name in attrs.map) {
							delete attrs.map[name];

							i = attrs.length;
							while (i--) {
								if (attrs[i].name === name) {
									attrs = attrs.splice(i, 1);
									return self;
								}
							}
						}

						return self;
					}

					// Set attribute
					if (name in attrs.map) {
						// Set attribute
						i = attrs.length;
						while (i--) {
							if (attrs[i].name === name) {
								attrs[i].value = value;
								break;
							}
						}
					} else {
						attrs.push({name: name, value: value});
					}

					attrs.map[name] = value;

					return self;
				}

				return attrs.map[name];
			}
		},

		/**
		 * Does a shallow clones the node into a new node. It will also exclude id attributes since
		 * there should only be one id per document.
		 *
		 * @example
		 * var clonedNode = node.clone();
		 *
		 * @method clone
		 * @return {tinymce.html.Node} New copy of the original node.
		 */
		clone: function() {
			var self = this, clone = new Node(self.name, self.type), i, l, selfAttrs, selfAttr, cloneAttrs;

			// Clone element attributes
			if ((selfAttrs = self.attributes)) {
				cloneAttrs = [];
				cloneAttrs.map = {};

				for (i = 0, l = selfAttrs.length; i < l; i++) {
					selfAttr = selfAttrs[i];

					// Clone everything except id
					if (selfAttr.name !== 'id') {
						cloneAttrs[cloneAttrs.length] = {name: selfAttr.name, value: selfAttr.value};
						cloneAttrs.map[selfAttr.name] = selfAttr.value;
					}
				}

				clone.attributes = cloneAttrs;
			}

			clone.value = self.value;
			clone.shortEnded = self.shortEnded;

			return clone;
		},

		/**
		 * Wraps the node in in another node.
		 *
		 * @example
		 * node.wrap(wrapperNode);
		 *
		 * @method wrap
		 */
		wrap: function(wrapper) {
			var self = this;

			self.parent.insert(wrapper, self);
			wrapper.append(self);

			return self;
		},

		/**
		 * Unwraps the node in other words it removes the node but keeps the children.
		 *
		 * @example
		 * node.unwrap();
		 *
		 * @method unwrap
		 */
		unwrap: function() {
			var self = this, node, next;

			for (node = self.firstChild; node;) {
				next = node.next;
				self.insert(node, self, true);
				node = next;
			}

			self.remove();
		},

		/**
		 * Removes the node from it's parent.
		 *
		 * @example
		 * node.remove();
		 *
		 * @method remove
		 * @return {tinymce.html.Node} Current node that got removed.
		 */
		remove: function() {
			var self = this, parent = self.parent, next = self.next, prev = self.prev;

			if (parent) {
				if (parent.firstChild === self) {
					parent.firstChild = next;

					if (next) {
						next.prev = null;
					}
				} else {
					prev.next = next;
				}

				if (parent.lastChild === self) {
					parent.lastChild = prev;

					if (prev) {
						prev.next = null;
					}
				} else {
					next.prev = prev;
				}

				self.parent = self.next = self.prev = null;
			}

			return self;
		},

		/**
		 * Appends a new node as a child of the current node.
		 *
		 * @example
		 * node.append(someNode);
		 *
		 * @method append
		 * @param {tinymce.html.Node} node Node to append as a child of the current one.
		 * @return {tinymce.html.Node} The node that got appended.
		 */
		append: function(node) {
			var self = this, last;

			if (node.parent) {
				node.remove();
			}

			last = self.lastChild;
			if (last) {
				last.next = node;
				node.prev = last;
				self.lastChild = node;
			} else {
				self.lastChild = self.firstChild = node;
			}

			node.parent = self;

			return node;
		},

		/**
		 * Inserts a node at a specific position as a child of the current node.
		 *
		 * @example
		 * parentNode.insert(newChildNode, oldChildNode);
		 *
		 * @method insert
		 * @param {tinymce.html.Node} node Node to insert as a child of the current node.
		 * @param {tinymce.html.Node} ref_node Reference node to set node before/after.
		 * @param {Boolean} before Optional state to insert the node before the reference node.
		 * @return {tinymce.html.Node} The node that got inserted.
		 */
		insert: function(node, ref_node, before) {
			var parent;

			if (node.parent) {
				node.remove();
			}

			parent = ref_node.parent || this;

			if (before) {
				if (ref_node === parent.firstChild) {
					parent.firstChild = node;
				} else {
					ref_node.prev.next = node;
				}

				node.prev = ref_node.prev;
				node.next = ref_node;
				ref_node.prev = node;
			} else {
				if (ref_node === parent.lastChild) {
					parent.lastChild = node;
				} else {
					ref_node.next.prev = node;
				}

				node.next = ref_node.next;
				node.prev = ref_node;
				ref_node.next = node;
			}

			node.parent = parent;

			return node;
		},

		/**
		 * Get all children by name.
		 *
		 * @method getAll
		 * @param {String} name Name of the child nodes to collect.
		 * @return {Array} Array with child nodes matchin the specified name.
		 */
		getAll: function(name) {
			var self = this, node, collection = [];

			for (node = self.firstChild; node; node = walk(node, self)) {
				if (node.name === name) {
					collection.push(node);
				}
			}

			return collection;
		},

		/**
		 * Removes all children of the current node.
		 *
		 * @method empty
		 * @return {tinymce.html.Node} The current node that got cleared.
		 */
		empty: function() {
			var self = this, nodes, i, node;

			// Remove all children
			if (self.firstChild) {
				nodes = [];

				// Collect the children
				for (node = self.firstChild; node; node = walk(node, self)) {
					nodes.push(node);
				}

				// Remove the children
				i = nodes.length;
				while (i--) {
					node = nodes[i];
					node.parent = node.firstChild = node.lastChild = node.next = node.prev = null;
				}
			}

			self.firstChild = self.lastChild = null;

			return self;
		},

		/**
		 * Returns true/false if the node is to be considered empty or not.
		 *
		 * @example
		 * node.isEmpty({img: true});
		 * @method isEmpty
		 * @param {Object} elements Name/value object with elements that are automatically treated as non empty elements.
		 * @return {Boolean} true/false if the node is empty or not.
		 */
		isEmpty: function(elements) {
			var self = this, node = self.firstChild, i, name;

			if (node) {
				do {
					if (node.type === 1) {
						// Ignore bogus elements
						if (node.attributes.map['data-mce-bogus']) {
							continue;
						}

						// Keep empty elements like <img />
						if (elements[node.name]) {
							return false;
						}

						// Keep bookmark nodes and name attribute like <a name="1"></a>
						i = node.attributes.length;
						while (i--) {
							name = node.attributes[i].name;
							if (name === "name" || name.indexOf('data-mce-bookmark') === 0) {
								return false;
							}
						}
					}

					// Keep comments
					if (node.type === 8) {
						return false;
					}

					// Keep non whitespace text nodes
					if ((node.type === 3 && !whiteSpaceRegExp.test(node.value))) {
						return false;
					}
				} while ((node = walk(node, self)));
			}

			return true;
		},

		/**
		 * Walks to the next or previous node and returns that node or null if it wasn't found.
		 *
		 * @method walk
		 * @param {Boolean} prev Optional previous node state defaults to false.
		 * @return {tinymce.html.Node} Node that is next to or previous of the current node.
		 */
		walk: function(prev) {
			return walk(this, null, prev);
		}
	};

	/**
	 * Creates a node of a specific type.
	 *
	 * @static
	 * @method create
	 * @param {String} name Name of the node type to create for example "b" or "#text".
	 * @param {Object} attrs Name/value collection of attributes that will be applied to elements.
	 */
	Node.create = function(name, attrs) {
		var node, attrName;

		// Create node
		node = new Node(name, typeLookup[name] || 1);

		// Add attributes if needed
		if (attrs) {
			for (attrName in attrs) {
				node.attr(attrName, attrs[attrName]);
			}
		}

		return node;
	};

	return Node;
});

// Included from: Env.stub.js

define("tinymce/Env", [], function() {
    return {};
});

// Included from: node_modules/tinymce/js/tinymce/classes/util/Arr.js

/**
 * Arr.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/**
 * Array utility class.
 *
 * @private
 * @class tinymce.util.Arr
 */
define("tinymce/util/Arr", [], function() {
	var isArray = Array.isArray || function(obj) {
		return Object.prototype.toString.call(obj) === "[object Array]";
	};

	function toArray(obj) {
		var array = obj, i, l;

		if (!isArray(obj)) {
			array = [];
			for (i = 0, l = obj.length; i < l; i++) {
				array[i] = obj[i];
			}
		}

		return array;
	}

	function each(o, cb, s) {
		var n, l;

		if (!o) {
			return 0;
		}

		s = s || o;

		if (o.length !== undefined) {
			// Indexed arrays, needed for Safari
			for (n = 0, l = o.length; n < l; n++) {
				if (cb.call(s, o[n], n, o) === false) {
					return 0;
				}
			}
		} else {
			// Hashtables
			for (n in o) {
				if (o.hasOwnProperty(n)) {
					if (cb.call(s, o[n], n, o) === false) {
						return 0;
					}
				}
			}
		}

		return 1;
	}

	function map(array, callback) {
		var out = [];

		each(array, function(item, index) {
			out.push(callback(item, index, array));
		});

		return out;
	}

	function filter(a, f) {
		var o = [];

		each(a, function(v, index) {
			if (!f || f(v, index, a)) {
				o.push(v);
			}
		});

		return o;
	}

	function indexOf(a, v) {
		var i, l;

		if (a) {
			for (i = 0, l = a.length; i < l; i++) {
				if (a[i] === v) {
					return i;
				}
			}
		}

		return -1;
	}

	function reduce(collection, iteratee, accumulator, thisArg) {
		var i = 0;

		if (arguments.length < 3) {
			accumulator = collection[0];
		}

		for (; i < collection.length; i++) {
			accumulator = iteratee.call(thisArg, accumulator, collection[i], i);
		}

		return accumulator;
	}

	function findIndex(array, predicate, thisArg) {
		var i, l;

		for (i = 0, l = array.length; i < l; i++) {
			if (predicate.call(thisArg, array[i], i, array)) {
				return i;
			}
		}

		return -1;
	}

	function find(array, predicate, thisArg) {
		var idx = findIndex(array, predicate, thisArg);

		if (idx !== -1) {
			return array[idx];
		}

		return undefined;
	}

	function last(collection) {
		return collection[collection.length - 1];
	}

	return {
		isArray: isArray,
		toArray: toArray,
		each: each,
		map: map,
		filter: filter,
		indexOf: indexOf,
		reduce: reduce,
		findIndex: findIndex,
		find: find,
		last: last
	};
});

// Included from: node_modules/tinymce/js/tinymce/classes/util/Tools.js

/**
 * Tools.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/**
 * This class contains various utlity functions. These are also exposed
 * directly on the tinymce namespace.
 *
 * @class tinymce.util.Tools
 */
define("tinymce/util/Tools", [
	"tinymce/Env",
	"tinymce/util/Arr"
], function(Env, Arr) {
	/**
	 * Removes whitespace from the beginning and end of a string.
	 *
	 * @method trim
	 * @param {String} s String to remove whitespace from.
	 * @return {String} New string with removed whitespace.
	 */
	var whiteSpaceRegExp = /^\s*|\s*$/g;

	function trim(str) {
		return (str === null || str === undefined) ? '' : ("" + str).replace(whiteSpaceRegExp, '');
	}

	/**
	 * Checks if a object is of a specific type for example an array.
	 *
	 * @method is
	 * @param {Object} obj Object to check type of.
	 * @param {string} type Optional type to check for.
	 * @return {Boolean} true/false if the object is of the specified type.
	 */
	function is(obj, type) {
		if (!type) {
			return obj !== undefined;
		}

		if (type == 'array' && Arr.isArray(obj)) {
			return true;
		}

		return typeof obj == type;
	}

	/**
	 * Makes a name/object map out of an array with names.
	 *
	 * @method makeMap
	 * @param {Array/String} items Items to make map out of.
	 * @param {String} delim Optional delimiter to split string by.
	 * @param {Object} map Optional map to add items to.
	 * @return {Object} Name/value map of items.
	 */
	function makeMap(items, delim, map) {
		var i;

		items = items || [];
		delim = delim || ',';

		if (typeof items == "string") {
			items = items.split(delim);
		}

		map = map || {};

		i = items.length;
		while (i--) {
			map[items[i]] = {};
		}

		return map;
	}

	/**
	 * Creates a class, subclass or static singleton.
	 * More details on this method can be found in the Wiki.
	 *
	 * @method create
	 * @param {String} s Class name, inheritance and prefix.
	 * @param {Object} p Collection of methods to add to the class.
	 * @param {Object} root Optional root object defaults to the global window object.
	 * @example
	 * // Creates a basic class
	 * tinymce.create('tinymce.somepackage.SomeClass', {
	 *     SomeClass: function() {
	 *         // Class constructor
	 *     },
	 *
	 *     method: function() {
	 *         // Some method
	 *     }
	 * });
	 *
	 * // Creates a basic subclass class
	 * tinymce.create('tinymce.somepackage.SomeSubClass:tinymce.somepackage.SomeClass', {
	 *     SomeSubClass: function() {
	 *         // Class constructor
	 *         this.parent(); // Call parent constructor
	 *     },
	 *
	 *     method: function() {
	 *         // Some method
	 *         this.parent(); // Call parent method
	 *     },
	 *
	 *     'static': {
	 *         staticMethod: function() {
	 *             // Static method
	 *         }
	 *     }
	 * });
	 *
	 * // Creates a singleton/static class
	 * tinymce.create('static tinymce.somepackage.SomeSingletonClass', {
	 *     method: function() {
	 *         // Some method
	 *     }
	 * });
	 */
	function create(s, p, root) {
		var self = this, sp, ns, cn, scn, c, de = 0;

		// Parse : <prefix> <class>:<super class>
		s = /^((static) )?([\w.]+)(:([\w.]+))?/.exec(s);
		cn = s[3].match(/(^|\.)(\w+)$/i)[2]; // Class name

		// Create namespace for new class
		ns = self.createNS(s[3].replace(/\.\w+$/, ''), root);

		// Class already exists
		if (ns[cn]) {
			return;
		}

		// Make pure static class
		if (s[2] == 'static') {
			ns[cn] = p;

			if (this.onCreate) {
				this.onCreate(s[2], s[3], ns[cn]);
			}

			return;
		}

		// Create default constructor
		if (!p[cn]) {
			p[cn] = function() {};
			de = 1;
		}

		// Add constructor and methods
		ns[cn] = p[cn];
		self.extend(ns[cn].prototype, p);

		// Extend
		if (s[5]) {
			sp = self.resolve(s[5]).prototype;
			scn = s[5].match(/\.(\w+)$/i)[1]; // Class name

			// Extend constructor
			c = ns[cn];
			if (de) {
				// Add passthrough constructor
				ns[cn] = function() {
					return sp[scn].apply(this, arguments);
				};
			} else {
				// Add inherit constructor
				ns[cn] = function() {
					this.parent = sp[scn];
					return c.apply(this, arguments);
				};
			}
			ns[cn].prototype[cn] = ns[cn];

			// Add super methods
			self.each(sp, function(f, n) {
				ns[cn].prototype[n] = sp[n];
			});

			// Add overridden methods
			self.each(p, function(f, n) {
				// Extend methods if needed
				if (sp[n]) {
					ns[cn].prototype[n] = function() {
						this.parent = sp[n];
						return f.apply(this, arguments);
					};
				} else {
					if (n != cn) {
						ns[cn].prototype[n] = f;
					}
				}
			});
		}

		// Add static methods
		/*jshint sub:true*/
		/*eslint dot-notation:0*/
		self.each(p['static'], function(f, n) {
			ns[cn][n] = f;
		});
	}

	function extend(obj, ext) {
		var i, l, name, args = arguments, value;

		for (i = 1, l = args.length; i < l; i++) {
			ext = args[i];
			for (name in ext) {
				if (ext.hasOwnProperty(name)) {
					value = ext[name];

					if (value !== undefined) {
						obj[name] = value;
					}
				}
			}
		}

		return obj;
	}

	/**
	 * Executed the specified function for each item in a object tree.
	 *
	 * @method walk
	 * @param {Object} o Object tree to walk though.
	 * @param {function} f Function to call for each item.
	 * @param {String} n Optional name of collection inside the objects to walk for example childNodes.
	 * @param {String} s Optional scope to execute the function in.
	 */
	function walk(o, f, n, s) {
		s = s || this;

		if (o) {
			if (n) {
				o = o[n];
			}

			Arr.each(o, function(o, i) {
				if (f.call(s, o, i, n) === false) {
					return false;
				}

				walk(o, f, n, s);
			});
		}
	}

	/**
	 * Creates a namespace on a specific object.
	 *
	 * @method createNS
	 * @param {String} n Namespace to create for example a.b.c.d.
	 * @param {Object} o Optional object to add namespace to, defaults to window.
	 * @return {Object} New namespace object the last item in path.
	 * @example
	 * // Create some namespace
	 * tinymce.createNS('tinymce.somepackage.subpackage');
	 *
	 * // Add a singleton
	 * var tinymce.somepackage.subpackage.SomeSingleton = {
	 *     method: function() {
	 *         // Some method
	 *     }
	 * };
	 */
	function createNS(n, o) {
		var i, v;

		o = o || window;

		n = n.split('.');
		for (i = 0; i < n.length; i++) {
			v = n[i];

			if (!o[v]) {
				o[v] = {};
			}

			o = o[v];
		}

		return o;
	}

	/**
	 * Resolves a string and returns the object from a specific structure.
	 *
	 * @method resolve
	 * @param {String} n Path to resolve for example a.b.c.d.
	 * @param {Object} o Optional object to search though, defaults to window.
	 * @return {Object} Last object in path or null if it couldn't be resolved.
	 * @example
	 * // Resolve a path into an object reference
	 * var obj = tinymce.resolve('a.b.c.d');
	 */
	function resolve(n, o) {
		var i, l;

		o = o || window;

		n = n.split('.');
		for (i = 0, l = n.length; i < l; i++) {
			o = o[n[i]];

			if (!o) {
				break;
			}
		}

		return o;
	}

	/**
	 * Splits a string but removes the whitespace before and after each value.
	 *
	 * @method explode
	 * @param {string} s String to split.
	 * @param {string} d Delimiter to split by.
	 * @example
	 * // Split a string into an array with a,b,c
	 * var arr = tinymce.explode('a, b,   c');
	 */
	function explode(s, d) {
		if (!s || is(s, 'array')) {
			return s;
		}

		return Arr.map(s.split(d || ','), trim);
	}

	function _addCacheSuffix(url) {
		var cacheSuffix = Env.cacheSuffix;

		if (cacheSuffix) {
			url += (url.indexOf('?') === -1 ? '?' : '&') + cacheSuffix;
		}

		return url;
	}

	return {
		trim: trim,

		/**
		 * Returns true/false if the object is an array or not.
		 *
		 * @method isArray
		 * @param {Object} obj Object to check.
		 * @return {boolean} true/false state if the object is an array or not.
		 */
		isArray: Arr.isArray,

		is: is,

		/**
		 * Converts the specified object into a real JavaScript array.
		 *
		 * @method toArray
		 * @param {Object} obj Object to convert into array.
		 * @return {Array} Array object based in input.
		 */
		toArray: Arr.toArray,
		makeMap: makeMap,

		/**
		 * Performs an iteration of all items in a collection such as an object or array. This method will execure the
		 * callback function for each item in the collection, if the callback returns false the iteration will terminate.
		 * The callback has the following format: cb(value, key_or_index).
		 *
		 * @method each
		 * @param {Object} o Collection to iterate.
		 * @param {function} cb Callback function to execute for each item.
		 * @param {Object} s Optional scope to execute the callback in.
		 * @example
		 * // Iterate an array
		 * tinymce.each([1,2,3], function(v, i) {
		 *     console.debug("Value: " + v + ", Index: " + i);
		 * });
		 *
		 * // Iterate an object
		 * tinymce.each({a: 1, b: 2, c: 3], function(v, k) {
		 *     console.debug("Value: " + v + ", Key: " + k);
		 * });
		 */
		each: Arr.each,

		/**
		 * Creates a new array by the return value of each iteration function call. This enables you to convert
		 * one array list into another.
		 *
		 * @method map
		 * @param {Array} array Array of items to iterate.
		 * @param {function} callback Function to call for each item. It's return value will be the new value.
		 * @return {Array} Array with new values based on function return values.
		 */
		map: Arr.map,

		/**
		 * Filters out items from the input array by calling the specified function for each item.
		 * If the function returns false the item will be excluded if it returns true it will be included.
		 *
		 * @method grep
		 * @param {Array} a Array of items to loop though.
		 * @param {function} f Function to call for each item. Include/exclude depends on it's return value.
		 * @return {Array} New array with values imported and filtered based in input.
		 * @example
		 * // Filter out some items, this will return an array with 4 and 5
		 * var items = tinymce.grep([1,2,3,4,5], function(v) {return v > 3;});
		 */
		grep: Arr.filter,

		/**
		 * Returns true/false if the object is an array or not.
		 *
		 * @method isArray
		 * @param {Object} obj Object to check.
		 * @return {boolean} true/false state if the object is an array or not.
		 */
		inArray: Arr.indexOf,

		extend: extend,
		create: create,
		walk: walk,
		createNS: createNS,
		resolve: resolve,
		explode: explode,
		_addCacheSuffix: _addCacheSuffix
	};
});

// Included from: node_modules/tinymce/js/tinymce/classes/html/Schema.js

/**
 * Schema.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/**
 * Schema validator class.
 *
 * @class tinymce.html.Schema
 * @example
 *  if (tinymce.activeEditor.schema.isValidChild('p', 'span'))
 *    alert('span is valid child of p.');
 *
 *  if (tinymce.activeEditor.schema.getElementRule('p'))
 *    alert('P is a valid element.');
 *
 * @class tinymce.html.Schema
 * @version 3.4
 */
define("tinymce/html/Schema", [
	"tinymce/util/Tools"
], function(Tools) {
	var mapCache = {}, dummyObj = {};
	var makeMap = Tools.makeMap, each = Tools.each, extend = Tools.extend, explode = Tools.explode, inArray = Tools.inArray;

	function split(items, delim) {
		return items ? items.split(delim || ' ') : [];
	}

	/**
	 * Builds a schema lookup table
	 *
	 * @private
	 * @param {String} type html4, html5 or html5-strict schema type.
	 * @return {Object} Schema lookup table.
	 */
	function compileSchema(type) {
		var schema = {}, globalAttributes, blockContent;
		var phrasingContent, flowContent, html4BlockContent, html4PhrasingContent;

		function add(name, attributes, children) {
			var ni, i, attributesOrder, args = arguments;

			function arrayToMap(array, obj) {
				var map = {}, i, l;

				for (i = 0, l = array.length; i < l; i++) {
					map[array[i]] = obj || {};
				}

				return map;
			}

			children = children || [];
			attributes = attributes || "";

			if (typeof children === "string") {
				children = split(children);
			}

			// Split string children
			for (i = 3; i < args.length; i++) {
				if (typeof args[i] === "string") {
					args[i] = split(args[i]);
				}

				children.push.apply(children, args[i]);
			}

			name = split(name);
			ni = name.length;
			while (ni--) {
				attributesOrder = [].concat(globalAttributes, split(attributes));
				schema[name[ni]] = {
					attributes: arrayToMap(attributesOrder),
					attributesOrder: attributesOrder,
					children: arrayToMap(children, dummyObj)
				};
			}
		}

		function addAttrs(name, attributes) {
			var ni, schemaItem, i, l;

			name = split(name);
			ni = name.length;
			attributes = split(attributes);
			while (ni--) {
				schemaItem = schema[name[ni]];
				for (i = 0, l = attributes.length; i < l; i++) {
					schemaItem.attributes[attributes[i]] = {};
					schemaItem.attributesOrder.push(attributes[i]);
				}
			}
		}

		// Use cached schema
		if (mapCache[type]) {
			return mapCache[type];
		}

		// Attributes present on all elements
		globalAttributes = split("id accesskey class dir lang style tabindex title");

		// Event attributes can be opt-in/opt-out
		/*eventAttributes = split("onabort onblur oncancel oncanplay oncanplaythrough onchange onclick onclose oncontextmenu oncuechange " +
				"ondblclick ondrag ondragend ondragenter ondragleave ondragover ondragstart ondrop ondurationchange onemptied onended " +
				"onerror onfocus oninput oninvalid onkeydown onkeypress onkeyup onload onloadeddata onloadedmetadata onloadstart " +
				"onmousedown onmousemove onmouseout onmouseover onmouseup onmousewheel onpause onplay onplaying onprogress onratechange " +
				"onreset onscroll onseeked onseeking onseeking onselect onshow onstalled onsubmit onsuspend ontimeupdate onvolumechange " +
				"onwaiting"
		);*/

		// Block content elements
		blockContent = split(
			"address blockquote div dl fieldset form h1 h2 h3 h4 h5 h6 hr menu ol p pre table ul"
		);

		// Phrasing content elements from the HTML5 spec (inline)
		phrasingContent = split(
			"a abbr b bdo br button cite code del dfn em embed i iframe img input ins kbd " +
			"label map noscript object q s samp script select small span strong sub sup " +
			"textarea u var #text #comment"
		);

		// Add HTML5 items to globalAttributes, blockContent, phrasingContent
		if (type != "html4") {
			globalAttributes.push.apply(globalAttributes, split("contenteditable contextmenu draggable dropzone " +
				"hidden spellcheck translate"));
			blockContent.push.apply(blockContent, split("article aside details dialog figure header footer hgroup section nav"));
			phrasingContent.push.apply(phrasingContent, split("audio canvas command datalist mark meter output picture " +
				"progress time wbr video ruby bdi keygen"));
		}

		// Add HTML4 elements unless it's html5-strict
		if (type != "html5-strict") {
			globalAttributes.push("xml:lang");

			html4PhrasingContent = split("acronym applet basefont big font strike tt");
			phrasingContent.push.apply(phrasingContent, html4PhrasingContent);

			each(html4PhrasingContent, function(name) {
				add(name, "", phrasingContent);
			});

			html4BlockContent = split("center dir isindex noframes");
			blockContent.push.apply(blockContent, html4BlockContent);

			// Flow content elements from the HTML5 spec (block+inline)
			flowContent = [].concat(blockContent, phrasingContent);

			each(html4BlockContent, function(name) {
				add(name, "", flowContent);
			});
		}

		// Flow content elements from the HTML5 spec (block+inline)
		flowContent = flowContent || [].concat(blockContent, phrasingContent);

		// HTML4 base schema TODO: Move HTML5 specific attributes to HTML5 specific if statement
		// Schema items <element name>, <specific attributes>, <children ..>
		add("html", "manifest", "head body");
		add("head", "", "base command link meta noscript script style title");
		add("title hr noscript br");
		add("base", "href target");
		add("link", "href rel media hreflang type sizes hreflang");
		add("meta", "name http-equiv content charset");
		add("style", "media type scoped");
		add("script", "src async defer type charset");
		add("body", "onafterprint onbeforeprint onbeforeunload onblur onerror onfocus " +
				"onhashchange onload onmessage onoffline ononline onpagehide onpageshow " +
				"onpopstate onresize onscroll onstorage onunload", flowContent);
		add("address dt dd div caption", "", flowContent);
		add("h1 h2 h3 h4 h5 h6 pre p abbr code var samp kbd sub sup i b u bdo span legend em strong small s cite dfn", "", phrasingContent);
		add("blockquote", "cite", flowContent);
		add("ol", "reversed start type", "li");
		add("ul", "", "li");
		add("li", "value", flowContent);
		add("dl", "", "dt dd");
		add("a", "href target rel media hreflang type", phrasingContent);
		add("q", "cite", phrasingContent);
		add("ins del", "cite datetime", flowContent);
		add("img", "src sizes srcset alt usemap ismap width height");
		add("iframe", "src name width height", flowContent);
		add("embed", "src type width height");
		add("object", "data type typemustmatch name usemap form width height", flowContent, "param");
		add("param", "name value");
		add("map", "name", flowContent, "area");
		add("area", "alt coords shape href target rel media hreflang type");
		add("table", "border", "caption colgroup thead tfoot tbody tr" + (type == "html4" ? " col" : ""));
		add("colgroup", "span", "col");
		add("col", "span");
		add("tbody thead tfoot", "", "tr");
		add("tr", "", "td th");
		add("td", "colspan rowspan headers", flowContent);
		add("th", "colspan rowspan headers scope abbr", flowContent);
		add("form", "accept-charset action autocomplete enctype method name novalidate target", flowContent);
		add("fieldset", "disabled form name", flowContent, "legend");
		add("label", "form for", phrasingContent);
		add("input", "accept alt autocomplete checked dirname disabled form formaction formenctype formmethod formnovalidate " +
				"formtarget height list max maxlength min multiple name pattern readonly required size src step type value width"
		);
		add("button", "disabled form formaction formenctype formmethod formnovalidate formtarget name type value",
			type == "html4" ? flowContent : phrasingContent);
		add("select", "disabled form multiple name required size", "option optgroup");
		add("optgroup", "disabled label", "option");
		add("option", "disabled label selected value");
		add("textarea", "cols dirname disabled form maxlength name readonly required rows wrap");
		add("menu", "type label", flowContent, "li");
		add("noscript", "", flowContent);

		// Extend with HTML5 elements
		if (type != "html4") {
			add("wbr");
			add("ruby", "", phrasingContent, "rt rp");
			add("figcaption", "", flowContent);
			add("mark rt rp summary bdi", "", phrasingContent);
			add("canvas", "width height", flowContent);
			add("video", "src crossorigin poster preload autoplay mediagroup loop " +
				"muted controls width height buffered", flowContent, "track source");
			add("audio", "src crossorigin preload autoplay mediagroup loop muted controls buffered volume", flowContent, "track source");
			add("picture", "", "img source");
			add("source", "src srcset type media sizes");
			add("track", "kind src srclang label default");
			add("datalist", "", phrasingContent, "option");
			add("article section nav aside header footer", "", flowContent);
			add("hgroup", "", "h1 h2 h3 h4 h5 h6");
			add("figure", "", flowContent, "figcaption");
			add("time", "datetime", phrasingContent);
			add("dialog", "open", flowContent);
			add("command", "type label icon disabled checked radiogroup command");
			add("output", "for form name", phrasingContent);
			add("progress", "value max", phrasingContent);
			add("meter", "value min max low high optimum", phrasingContent);
			add("details", "open", flowContent, "summary");
			add("keygen", "autofocus challenge disabled form keytype name");
		}

		// Extend with HTML4 attributes unless it's html5-strict
		if (type != "html5-strict") {
			addAttrs("script", "language xml:space");
			addAttrs("style", "xml:space");
			addAttrs("object", "declare classid code codebase codetype archive standby align border hspace vspace");
			addAttrs("embed", "align name hspace vspace");
			addAttrs("param", "valuetype type");
			addAttrs("a", "charset name rev shape coords");
			addAttrs("br", "clear");
			addAttrs("applet", "codebase archive code object alt name width height align hspace vspace");
			addAttrs("img", "name longdesc align border hspace vspace");
			addAttrs("iframe", "longdesc frameborder marginwidth marginheight scrolling align");
			addAttrs("font basefont", "size color face");
			addAttrs("input", "usemap align");
			addAttrs("select", "onchange");
			addAttrs("textarea");
			addAttrs("h1 h2 h3 h4 h5 h6 div p legend caption", "align");
			addAttrs("ul", "type compact");
			addAttrs("li", "type");
			addAttrs("ol dl menu dir", "compact");
			addAttrs("pre", "width xml:space");
			addAttrs("hr", "align noshade size width");
			addAttrs("isindex", "prompt");
			addAttrs("table", "summary width frame rules cellspacing cellpadding align bgcolor");
			addAttrs("col", "width align char charoff valign");
			addAttrs("colgroup", "width align char charoff valign");
			addAttrs("thead", "align char charoff valign");
			addAttrs("tr", "align char charoff valign bgcolor");
			addAttrs("th", "axis align char charoff valign nowrap bgcolor width height");
			addAttrs("form", "accept");
			addAttrs("td", "abbr axis scope align char charoff valign nowrap bgcolor width height");
			addAttrs("tfoot", "align char charoff valign");
			addAttrs("tbody", "align char charoff valign");
			addAttrs("area", "nohref");
			addAttrs("body", "background bgcolor text link vlink alink");
		}

		// Extend with HTML5 attributes unless it's html4
		if (type != "html4") {
			addAttrs("input button select textarea", "autofocus");
			addAttrs("input textarea", "placeholder");
			addAttrs("a", "download");
			addAttrs("link script img", "crossorigin");
			addAttrs("iframe", "sandbox seamless allowfullscreen"); // Excluded: srcdoc
		}

		// Special: iframe, ruby, video, audio, label

		// Delete children of the same name from it's parent
		// For example: form can't have a child of the name form
		each(split('a form meter progress dfn'), function(name) {
			if (schema[name]) {
				delete schema[name].children[name];
			}
		});

		// Delete header, footer, sectioning and heading content descendants
		/*each('dt th address', function(name) {
			delete schema[name].children[name];
		});*/

		// Caption can't have tables
		delete schema.caption.children.table;

		// Delete scripts by default due to possible XSS
		delete schema.script;

		// TODO: LI:s can only have value if parent is OL

		// TODO: Handle transparent elements
		// a ins del canvas map

		mapCache[type] = schema;

		return schema;
	}

	function compileElementMap(value, mode) {
		var styles;

		if (value) {
			styles = {};

			if (typeof value == 'string') {
				value = {
					'*': value
				};
			}

			// Convert styles into a rule list
			each(value, function(value, key) {
				styles[key] = styles[key.toUpperCase()] = mode == 'map' ? makeMap(value, /[, ]/) : explode(value, /[, ]/);
			});
		}

		return styles;
	}

	/**
	 * Constructs a new Schema instance.
	 *
	 * @constructor
	 * @method Schema
	 * @param {Object} settings Name/value settings object.
	 */
	return function(settings) {
		var self = this, elements = {}, children = {}, patternElements = [], validStyles, invalidStyles, schemaItems;
		var whiteSpaceElementsMap, selfClosingElementsMap, shortEndedElementsMap, boolAttrMap, validClasses;
		var blockElementsMap, nonEmptyElementsMap, moveCaretBeforeOnEnterElementsMap, textBlockElementsMap, textInlineElementsMap;
		var customElementsMap = {}, specialElements = {};

		// Creates an lookup table map object for the specified option or the default value
		function createLookupTable(option, default_value, extendWith) {
			var value = settings[option];

			if (!value) {
				// Get cached default map or make it if needed
				value = mapCache[option];

				if (!value) {
					value = makeMap(default_value, ' ', makeMap(default_value.toUpperCase(), ' '));
					value = extend(value, extendWith);

					mapCache[option] = value;
				}
			} else {
				// Create custom map
				value = makeMap(value, /[, ]/, makeMap(value.toUpperCase(), /[, ]/));
			}

			return value;
		}

		settings = settings || {};
		schemaItems = compileSchema(settings.schema);

		// Allow all elements and attributes if verify_html is set to false
		if (settings.verify_html === false) {
			settings.valid_elements = '*[*]';
		}

		validStyles = compileElementMap(settings.valid_styles);
		invalidStyles = compileElementMap(settings.invalid_styles, 'map');
		validClasses = compileElementMap(settings.valid_classes, 'map');

		// Setup map objects
		whiteSpaceElementsMap = createLookupTable('whitespace_elements', 'pre script noscript style textarea video audio iframe object');
		selfClosingElementsMap = createLookupTable('self_closing_elements', 'colgroup dd dt li option p td tfoot th thead tr');
		shortEndedElementsMap = createLookupTable('short_ended_elements', 'area base basefont br col frame hr img input isindex link ' +
			'meta param embed source wbr track');
		boolAttrMap = createLookupTable('boolean_attributes', 'checked compact declare defer disabled ismap multiple nohref noresize ' +
			'noshade nowrap readonly selected autoplay loop controls');
		nonEmptyElementsMap = createLookupTable('non_empty_elements', 'td th iframe video audio object script', shortEndedElementsMap);
		moveCaretBeforeOnEnterElementsMap = createLookupTable('move_caret_before_on_enter_elements', 'table', nonEmptyElementsMap);
		textBlockElementsMap = createLookupTable('text_block_elements', 'h1 h2 h3 h4 h5 h6 p div address pre form ' +
						'blockquote center dir fieldset header footer article section hgroup aside nav figure');
		blockElementsMap = createLookupTable('block_elements', 'hr table tbody thead tfoot ' +
						'th tr td li ol ul caption dl dt dd noscript menu isindex option ' +
						'datalist select optgroup figcaption', textBlockElementsMap);
		textInlineElementsMap = createLookupTable('text_inline_elements', 'span strong b em i font strike u var cite ' +
										'dfn code mark q sup sub samp');

		each((settings.special || 'script noscript style textarea').split(' '), function(name) {
			specialElements[name] = new RegExp('<\/' + name + '[^>]*>', 'gi');
		});

		// Converts a wildcard expression string to a regexp for example *a will become /.*a/.
		function patternToRegExp(str) {
			return new RegExp('^' + str.replace(/([?+*])/g, '.$1') + '$');
		}

		// Parses the specified valid_elements string and adds to the current rules
		// This function is a bit hard to read since it's heavily optimized for speed
		function addValidElements(validElements) {
			var ei, el, ai, al, matches, element, attr, attrData, elementName, attrName, attrType, attributes, attributesOrder,
				prefix, outputName, globalAttributes, globalAttributesOrder, key, value,
				elementRuleRegExp = /^([#+\-])?([^\[!\/]+)(?:\/([^\[!]+))?(?:(!?)\[([^\]]+)\])?$/,
				attrRuleRegExp = /^([!\-])?(\w+::\w+|[^=:<]+)?(?:([=:<])(.*))?$/,
				hasPatternsRegExp = /[*?+]/;

			if (validElements) {
				// Split valid elements into an array with rules
				validElements = split(validElements, ',');

				if (elements['@']) {
					globalAttributes = elements['@'].attributes;
					globalAttributesOrder = elements['@'].attributesOrder;
				}

				// Loop all rules
				for (ei = 0, el = validElements.length; ei < el; ei++) {
					// Parse element rule
					matches = elementRuleRegExp.exec(validElements[ei]);
					if (matches) {
						// Setup local names for matches
						prefix = matches[1];
						elementName = matches[2];
						outputName = matches[3];
						attrData = matches[5];

						// Create new attributes and attributesOrder
						attributes = {};
						attributesOrder = [];

						// Create the new element
						element = {
							attributes: attributes,
							attributesOrder: attributesOrder
						};

						// Padd empty elements prefix
						if (prefix === '#') {
							element.paddEmpty = true;
						}

						// Remove empty elements prefix
						if (prefix === '-') {
							element.removeEmpty = true;
						}

						if (matches[4] === '!') {
							element.removeEmptyAttrs = true;
						}

						// Copy attributes from global rule into current rule
						if (globalAttributes) {
							for (key in globalAttributes) {
								attributes[key] = globalAttributes[key];
							}

							attributesOrder.push.apply(attributesOrder, globalAttributesOrder);
						}

						// Attributes defined
						if (attrData) {
							attrData = split(attrData, '|');
							for (ai = 0, al = attrData.length; ai < al; ai++) {
								matches = attrRuleRegExp.exec(attrData[ai]);
								if (matches) {
									attr = {};
									attrType = matches[1];
									attrName = matches[2].replace(/::/g, ':');
									prefix = matches[3];
									value = matches[4];

									// Required
									if (attrType === '!') {
										element.attributesRequired = element.attributesRequired || [];
										element.attributesRequired.push(attrName);
										attr.required = true;
									}

									// Denied from global
									if (attrType === '-') {
										delete attributes[attrName];
										attributesOrder.splice(inArray(attributesOrder, attrName), 1);
										continue;
									}

									// Default value
									if (prefix) {
										// Default value
										if (prefix === '=') {
											element.attributesDefault = element.attributesDefault || [];
											element.attributesDefault.push({name: attrName, value: value});
											attr.defaultValue = value;
										}

										// Forced value
										if (prefix === ':') {
											element.attributesForced = element.attributesForced || [];
											element.attributesForced.push({name: attrName, value: value});
											attr.forcedValue = value;
										}

										// Required values
										if (prefix === '<') {
											attr.validValues = makeMap(value, '?');
										}
									}

									// Check for attribute patterns
									if (hasPatternsRegExp.test(attrName)) {
										element.attributePatterns = element.attributePatterns || [];
										attr.pattern = patternToRegExp(attrName);
										element.attributePatterns.push(attr);
									} else {
										// Add attribute to order list if it doesn't already exist
										if (!attributes[attrName]) {
											attributesOrder.push(attrName);
										}

										attributes[attrName] = attr;
									}
								}
							}
						}

						// Global rule, store away these for later usage
						if (!globalAttributes && elementName == '@') {
							globalAttributes = attributes;
							globalAttributesOrder = attributesOrder;
						}

						// Handle substitute elements such as b/strong
						if (outputName) {
							element.outputName = elementName;
							elements[outputName] = element;
						}

						// Add pattern or exact element
						if (hasPatternsRegExp.test(elementName)) {
							element.pattern = patternToRegExp(elementName);
							patternElements.push(element);
						} else {
							elements[elementName] = element;
						}
					}
				}
			}
		}

		function setValidElements(validElements) {
			elements = {};
			patternElements = [];

			addValidElements(validElements);

			each(schemaItems, function(element, name) {
				children[name] = element.children;
			});
		}

		// Adds custom non HTML elements to the schema
		function addCustomElements(customElements) {
			var customElementRegExp = /^(~)?(.+)$/;

			if (customElements) {
				// Flush cached items since we are altering the default maps
				mapCache.text_block_elements = mapCache.block_elements = null;

				each(split(customElements, ','), function(rule) {
					var matches = customElementRegExp.exec(rule),
						inline = matches[1] === '~',
						cloneName = inline ? 'span' : 'div',
						name = matches[2];

					children[name] = children[cloneName];
					customElementsMap[name] = cloneName;

					// If it's not marked as inline then add it to valid block elements
					if (!inline) {
						blockElementsMap[name.toUpperCase()] = {};
						blockElementsMap[name] = {};
					}

					// Add elements clone if needed
					if (!elements[name]) {
						var customRule = elements[cloneName];

						customRule = extend({}, customRule);
						delete customRule.removeEmptyAttrs;
						delete customRule.removeEmpty;

						elements[name] = customRule;
					}

					// Add custom elements at span/div positions
					each(children, function(element, elmName) {
						if (element[cloneName]) {
							children[elmName] = element = extend({}, children[elmName]);
							element[name] = element[cloneName];
						}
					});
				});
			}
		}

		// Adds valid children to the schema object
		function addValidChildren(validChildren) {
			var childRuleRegExp = /^([+\-]?)(\w+)\[([^\]]+)\]$/;

			// Invalidate the schema cache if the schema is mutated
			mapCache[settings.schema] = null;

			if (validChildren) {
				each(split(validChildren, ','), function(rule) {
					var matches = childRuleRegExp.exec(rule), parent, prefix;

					if (matches) {
						prefix = matches[1];

						// Add/remove items from default
						if (prefix) {
							parent = children[matches[2]];
						} else {
							parent = children[matches[2]] = {'#comment': {}};
						}

						parent = children[matches[2]];

						each(split(matches[3], '|'), function(child) {
							if (prefix === '-') {
								delete parent[child];
							} else {
								parent[child] = {};
							}
						});
					}
				});
			}
		}

		function getElementRule(name) {
			var element = elements[name], i;

			// Exact match found
			if (element) {
				return element;
			}

			// No exact match then try the patterns
			i = patternElements.length;
			while (i--) {
				element = patternElements[i];

				if (element.pattern.test(name)) {
					return element;
				}
			}
		}

		if (!settings.valid_elements) {
			// No valid elements defined then clone the elements from the schema spec
			each(schemaItems, function(element, name) {
				elements[name] = {
					attributes: element.attributes,
					attributesOrder: element.attributesOrder
				};

				children[name] = element.children;
			});

			// Switch these on HTML4
			if (settings.schema != "html5") {
				each(split('strong/b em/i'), function(item) {
					item = split(item, '/');
					elements[item[1]].outputName = item[0];
				});
			}

			// Add default alt attribute for images
			elements.img.attributesDefault = [{name: 'alt', value: ''}];

			// Remove these if they are empty by default
			each(split('ol ul sub sup blockquote span font a table tbody tr strong em b i'), function(name) {
				if (elements[name]) {
					elements[name].removeEmpty = true;
				}
			});

			// Padd these by default
			each(split('p h1 h2 h3 h4 h5 h6 th td pre div address caption'), function(name) {
				elements[name].paddEmpty = true;
			});

			// Remove these if they have no attributes
			each(split('span'), function(name) {
				elements[name].removeEmptyAttrs = true;
			});

			// Remove these by default
			// TODO: Reenable in 4.1
			/*each(split('script style'), function(name) {
				delete elements[name];
			});*/
		} else {
			setValidElements(settings.valid_elements);
		}

		addCustomElements(settings.custom_elements);
		addValidChildren(settings.valid_children);
		addValidElements(settings.extended_valid_elements);

		// Todo: Remove this when we fix list handling to be valid
		addValidChildren('+ol[ul|ol],+ul[ul|ol]');

		// Delete invalid elements
		if (settings.invalid_elements) {
			each(explode(settings.invalid_elements), function(item) {
				if (elements[item]) {
					delete elements[item];
				}
			});
		}

		// If the user didn't allow span only allow internal spans
		if (!getElementRule('span')) {
			addValidElements('span[!data-mce-type|*]');
		}

		/**
		 * Name/value map object with valid parents and children to those parents.
		 *
		 * @example
		 * children = {
		 *    div:{p:{}, h1:{}}
		 * };
		 * @field children
		 * @type Object
		 */
		self.children = children;

		/**
		 * Name/value map object with valid styles for each element.
		 *
		 * @method getValidStyles
		 * @type Object
		 */
		self.getValidStyles = function() {
			return validStyles;
		};

		/**
		 * Name/value map object with valid styles for each element.
		 *
		 * @method getInvalidStyles
		 * @type Object
		 */
		self.getInvalidStyles = function() {
			return invalidStyles;
		};

		/**
		 * Name/value map object with valid classes for each element.
		 *
		 * @method getValidClasses
		 * @type Object
		 */
		self.getValidClasses = function() {
			return validClasses;
		};

		/**
		 * Returns a map with boolean attributes.
		 *
		 * @method getBoolAttrs
		 * @return {Object} Name/value lookup map for boolean attributes.
		 */
		self.getBoolAttrs = function() {
			return boolAttrMap;
		};

		/**
		 * Returns a map with block elements.
		 *
		 * @method getBlockElements
		 * @return {Object} Name/value lookup map for block elements.
		 */
		self.getBlockElements = function() {
			return blockElementsMap;
		};

		/**
		 * Returns a map with text block elements. Such as: p,h1-h6,div,address
		 *
		 * @method getTextBlockElements
		 * @return {Object} Name/value lookup map for block elements.
		 */
		self.getTextBlockElements = function() {
			return textBlockElementsMap;
		};

		/**
		 * Returns a map of inline text format nodes for example strong/span or ins.
		 *
		 * @method getTextInlineElements
		 * @return {Object} Name/value lookup map for text format elements.
		 */
		self.getTextInlineElements = function() {
			return textInlineElementsMap;
		};

		/**
		 * Returns a map with short ended elements such as BR or IMG.
		 *
		 * @method getShortEndedElements
		 * @return {Object} Name/value lookup map for short ended elements.
		 */
		self.getShortEndedElements = function() {
			return shortEndedElementsMap;
		};

		/**
		 * Returns a map with self closing tags such as <li>.
		 *
		 * @method getSelfClosingElements
		 * @return {Object} Name/value lookup map for self closing tags elements.
		 */
		self.getSelfClosingElements = function() {
			return selfClosingElementsMap;
		};

		/**
		 * Returns a map with elements that should be treated as contents regardless if it has text
		 * content in them or not such as TD, VIDEO or IMG.
		 *
		 * @method getNonEmptyElements
		 * @return {Object} Name/value lookup map for non empty elements.
		 */
		self.getNonEmptyElements = function() {
			return nonEmptyElementsMap;
		};

		/**
		 * Returns a map with elements that the caret should be moved in front of after enter is
		 * pressed
		 *
		 * @method getMoveCaretBeforeOnEnterElements
		 * @return {Object} Name/value lookup map for elements to place the caret in front of.
		 */
		self.getMoveCaretBeforeOnEnterElements = function() {
			return moveCaretBeforeOnEnterElementsMap;
		};

		/**
		 * Returns a map with elements where white space is to be preserved like PRE or SCRIPT.
		 *
		 * @method getWhiteSpaceElements
		 * @return {Object} Name/value lookup map for white space elements.
		 */
		self.getWhiteSpaceElements = function() {
			return whiteSpaceElementsMap;
		};

		/**
		 * Returns a map with special elements. These are elements that needs to be parsed
		 * in a special way such as script, style, textarea etc. The map object values
		 * are regexps used to find the end of the element.
		 *
		 * @method getSpecialElements
		 * @return {Object} Name/value lookup map for special elements.
		 */
		self.getSpecialElements = function() {
			return specialElements;
		};

		/**
		 * Returns true/false if the specified element and it's child is valid or not
		 * according to the schema.
		 *
		 * @method isValidChild
		 * @param {String} name Element name to check for.
		 * @param {String} child Element child to verify.
		 * @return {Boolean} True/false if the element is a valid child of the specified parent.
		 */
		self.isValidChild = function(name, child) {
			var parent = children[name];

			return !!(parent && parent[child]);
		};

		/**
		 * Returns true/false if the specified element name and optional attribute is
		 * valid according to the schema.
		 *
		 * @method isValid
		 * @param {String} name Name of element to check.
		 * @param {String} attr Optional attribute name to check for.
		 * @return {Boolean} True/false if the element and attribute is valid.
		 */
		self.isValid = function(name, attr) {
			var attrPatterns, i, rule = getElementRule(name);

			// Check if it's a valid element
			if (rule) {
				if (attr) {
					// Check if attribute name exists
					if (rule.attributes[attr]) {
						return true;
					}

					// Check if attribute matches a regexp pattern
					attrPatterns = rule.attributePatterns;
					if (attrPatterns) {
						i = attrPatterns.length;
						while (i--) {
							if (attrPatterns[i].pattern.test(name)) {
								return true;
							}
						}
					}
				} else {
					return true;
				}
			}

			// No match
			return false;
		};

		/**
		 * Returns true/false if the specified element is valid or not
		 * according to the schema.
		 *
		 * @method getElementRule
		 * @param {String} name Element name to check for.
		 * @return {Object} Element object or undefined if the element isn't valid.
		 */
		self.getElementRule = getElementRule;

		/**
		 * Returns an map object of all custom elements.
		 *
		 * @method getCustomElements
		 * @return {Object} Name/value map object of all custom elements.
		 */
		self.getCustomElements = function() {
			return customElementsMap;
		};

		/**
		 * Parses a valid elements string and adds it to the schema. The valid elements
		 * format is for example "element[attr=default|otherattr]".
		 * Existing rules will be replaced with the ones specified, so this extends the schema.
		 *
		 * @method addValidElements
		 * @param {String} valid_elements String in the valid elements format to be parsed.
		 */
		self.addValidElements = addValidElements;

		/**
		 * Parses a valid elements string and sets it to the schema. The valid elements
		 * format is for example "element[attr=default|otherattr]".
		 * Existing rules will be replaced with the ones specified, so this extends the schema.
		 *
		 * @method setValidElements
		 * @param {String} valid_elements String in the valid elements format to be parsed.
		 */
		self.setValidElements = setValidElements;

		/**
		 * Adds custom non HTML elements to the schema.
		 *
		 * @method addCustomElements
		 * @param {String} custom_elements Comma separated list of custom elements to add.
		 */
		self.addCustomElements = addCustomElements;

		/**
		 * Parses a valid children string and adds them to the schema structure. The valid children
		 * format is for example: "element[child1|child2]".
		 *
		 * @method addValidChildren
		 * @param {String} valid_children Valid children elements string to parse
		 */
		self.addValidChildren = addValidChildren;

		self.elements = elements;
	};
});

// Included from: node_modules/tinymce/js/tinymce/classes/html/Entities.js

/**
 * Entities.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*jshint bitwise:false */
/*eslint no-bitwise:0 */

/**
 * Entity encoder class.
 *
 * @class tinymce.html.Entities
 * @static
 * @version 3.4
 */
define("tinymce/html/Entities", [
	"tinymce/util/Tools"
], function(Tools) {
	var makeMap = Tools.makeMap;

	var namedEntities, baseEntities, reverseEntities,
		attrsCharsRegExp = /[&<>\"\u0060\u007E-\uD7FF\uE000-\uFFEF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
		textCharsRegExp = /[<>&\u007E-\uD7FF\uE000-\uFFEF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
		rawCharsRegExp = /[<>&\"\']/g,
		entityRegExp = /&#([a-z0-9]+);?|&([a-z0-9]+);/gi,
		asciiMap = {
			128: "\u20AC", 130: "\u201A", 131: "\u0192", 132: "\u201E", 133: "\u2026", 134: "\u2020",
			135: "\u2021", 136: "\u02C6", 137: "\u2030", 138: "\u0160", 139: "\u2039", 140: "\u0152",
			142: "\u017D", 145: "\u2018", 146: "\u2019", 147: "\u201C", 148: "\u201D", 149: "\u2022",
			150: "\u2013", 151: "\u2014", 152: "\u02DC", 153: "\u2122", 154: "\u0161", 155: "\u203A",
			156: "\u0153", 158: "\u017E", 159: "\u0178"
		};

	// Raw entities
	baseEntities = {
		'\"': '&quot;', // Needs to be escaped since the YUI compressor would otherwise break the code
		"'": '&#39;',
		'<': '&lt;',
		'>': '&gt;',
		'&': '&amp;',
		'\u0060': '&#96;'
	};

	// Reverse lookup table for raw entities
	reverseEntities = {
		'&lt;': '<',
		'&gt;': '>',
		'&amp;': '&',
		'&quot;': '"',
		'&apos;': "'"
	};

	// Decodes text by using the browser
	function nativeDecode(text) { return text;
		var elm;

		elm = document.createElement("div");
		elm.innerHTML = text;

		return elm.textContent || elm.innerText || text;
	}

	// Build a two way lookup table for the entities
	function buildEntitiesLookup(items, radix) {
		var i, chr, entity, lookup = {};

		if (items) {
			items = items.split(',');
			radix = radix || 10;

			// Build entities lookup table
			for (i = 0; i < items.length; i += 2) {
				chr = String.fromCharCode(parseInt(items[i], radix));

				// Only add non base entities
				if (!baseEntities[chr]) {
					entity = '&' + items[i + 1] + ';';
					lookup[chr] = entity;
					lookup[entity] = chr;
				}
			}

			return lookup;
		}
	}

	// Unpack entities lookup where the numbers are in radix 32 to reduce the size
	namedEntities = buildEntitiesLookup(
		'50,nbsp,51,iexcl,52,cent,53,pound,54,curren,55,yen,56,brvbar,57,sect,58,uml,59,copy,' +
		'5a,ordf,5b,laquo,5c,not,5d,shy,5e,reg,5f,macr,5g,deg,5h,plusmn,5i,sup2,5j,sup3,5k,acute,' +
		'5l,micro,5m,para,5n,middot,5o,cedil,5p,sup1,5q,ordm,5r,raquo,5s,frac14,5t,frac12,5u,frac34,' +
		'5v,iquest,60,Agrave,61,Aacute,62,Acirc,63,Atilde,64,Auml,65,Aring,66,AElig,67,Ccedil,' +
		'68,Egrave,69,Eacute,6a,Ecirc,6b,Euml,6c,Igrave,6d,Iacute,6e,Icirc,6f,Iuml,6g,ETH,6h,Ntilde,' +
		'6i,Ograve,6j,Oacute,6k,Ocirc,6l,Otilde,6m,Ouml,6n,times,6o,Oslash,6p,Ugrave,6q,Uacute,' +
		'6r,Ucirc,6s,Uuml,6t,Yacute,6u,THORN,6v,szlig,70,agrave,71,aacute,72,acirc,73,atilde,74,auml,' +
		'75,aring,76,aelig,77,ccedil,78,egrave,79,eacute,7a,ecirc,7b,euml,7c,igrave,7d,iacute,7e,icirc,' +
		'7f,iuml,7g,eth,7h,ntilde,7i,ograve,7j,oacute,7k,ocirc,7l,otilde,7m,ouml,7n,divide,7o,oslash,' +
		'7p,ugrave,7q,uacute,7r,ucirc,7s,uuml,7t,yacute,7u,thorn,7v,yuml,ci,fnof,sh,Alpha,si,Beta,' +
		'sj,Gamma,sk,Delta,sl,Epsilon,sm,Zeta,sn,Eta,so,Theta,sp,Iota,sq,Kappa,sr,Lambda,ss,Mu,' +
		'st,Nu,su,Xi,sv,Omicron,t0,Pi,t1,Rho,t3,Sigma,t4,Tau,t5,Upsilon,t6,Phi,t7,Chi,t8,Psi,' +
		't9,Omega,th,alpha,ti,beta,tj,gamma,tk,delta,tl,epsilon,tm,zeta,tn,eta,to,theta,tp,iota,' +
		'tq,kappa,tr,lambda,ts,mu,tt,nu,tu,xi,tv,omicron,u0,pi,u1,rho,u2,sigmaf,u3,sigma,u4,tau,' +
		'u5,upsilon,u6,phi,u7,chi,u8,psi,u9,omega,uh,thetasym,ui,upsih,um,piv,812,bull,816,hellip,' +
		'81i,prime,81j,Prime,81u,oline,824,frasl,88o,weierp,88h,image,88s,real,892,trade,89l,alefsym,' +
		'8cg,larr,8ch,uarr,8ci,rarr,8cj,darr,8ck,harr,8dl,crarr,8eg,lArr,8eh,uArr,8ei,rArr,8ej,dArr,' +
		'8ek,hArr,8g0,forall,8g2,part,8g3,exist,8g5,empty,8g7,nabla,8g8,isin,8g9,notin,8gb,ni,8gf,prod,' +
		'8gh,sum,8gi,minus,8gn,lowast,8gq,radic,8gt,prop,8gu,infin,8h0,ang,8h7,and,8h8,or,8h9,cap,8ha,cup,' +
		'8hb,int,8hk,there4,8hs,sim,8i5,cong,8i8,asymp,8j0,ne,8j1,equiv,8j4,le,8j5,ge,8k2,sub,8k3,sup,8k4,' +
		'nsub,8k6,sube,8k7,supe,8kl,oplus,8kn,otimes,8l5,perp,8m5,sdot,8o8,lceil,8o9,rceil,8oa,lfloor,8ob,' +
		'rfloor,8p9,lang,8pa,rang,9ea,loz,9j0,spades,9j3,clubs,9j5,hearts,9j6,diams,ai,OElig,aj,oelig,b0,' +
		'Scaron,b1,scaron,bo,Yuml,m6,circ,ms,tilde,802,ensp,803,emsp,809,thinsp,80c,zwnj,80d,zwj,80e,lrm,' +
		'80f,rlm,80j,ndash,80k,mdash,80o,lsquo,80p,rsquo,80q,sbquo,80s,ldquo,80t,rdquo,80u,bdquo,810,dagger,' +
		'811,Dagger,81g,permil,81p,lsaquo,81q,rsaquo,85c,euro', 32);

	var Entities = {
		/**
		 * Encodes the specified string using raw entities. This means only the required XML base entities will be encoded.
		 *
		 * @method encodeRaw
		 * @param {String} text Text to encode.
		 * @param {Boolean} attr Optional flag to specify if the text is attribute contents.
		 * @return {String} Entity encoded text.
		 */
		encodeRaw: function(text, attr) {
			return text.replace(attr ? attrsCharsRegExp : textCharsRegExp, function(chr) {
				return baseEntities[chr] || chr;
			});
		},

		/**
		 * Encoded the specified text with both the attributes and text entities. This function will produce larger text contents
		 * since it doesn't know if the context is within a attribute or text node. This was added for compatibility
		 * and is exposed as the DOMUtils.encode function.
		 *
		 * @method encodeAllRaw
		 * @param {String} text Text to encode.
		 * @return {String} Entity encoded text.
		 */
		encodeAllRaw: function(text) {
			return ('' + text).replace(rawCharsRegExp, function(chr) {
				return baseEntities[chr] || chr;
			});
		},

		/**
		 * Encodes the specified string using numeric entities. The core entities will be
		 * encoded as named ones but all non lower ascii characters will be encoded into numeric entities.
		 *
		 * @method encodeNumeric
		 * @param {String} text Text to encode.
		 * @param {Boolean} attr Optional flag to specify if the text is attribute contents.
		 * @return {String} Entity encoded text.
		 */
		encodeNumeric: function(text, attr) {
			return text.replace(attr ? attrsCharsRegExp : textCharsRegExp, function(chr) {
				// Multi byte sequence convert it to a single entity
				if (chr.length > 1) {
					return '&#' + (((chr.charCodeAt(0) - 0xD800) * 0x400) + (chr.charCodeAt(1) - 0xDC00) + 0x10000) + ';';
				}

				return baseEntities[chr] || '&#' + chr.charCodeAt(0) + ';';
			});
		},

		/**
		 * Encodes the specified string using named entities. The core entities will be encoded
		 * as named ones but all non lower ascii characters will be encoded into named entities.
		 *
		 * @method encodeNamed
		 * @param {String} text Text to encode.
		 * @param {Boolean} attr Optional flag to specify if the text is attribute contents.
		 * @param {Object} entities Optional parameter with entities to use.
		 * @return {String} Entity encoded text.
		 */
		encodeNamed: function(text, attr, entities) {
			entities = entities || namedEntities;

			return text.replace(attr ? attrsCharsRegExp : textCharsRegExp, function(chr) {
				return baseEntities[chr] || entities[chr] || chr;
			});
		},

		/**
		 * Returns an encode function based on the name(s) and it's optional entities.
		 *
		 * @method getEncodeFunc
		 * @param {String} name Comma separated list of encoders for example named,numeric.
		 * @param {String} entities Optional parameter with entities to use instead of the built in set.
		 * @return {function} Encode function to be used.
		 */
		getEncodeFunc: function(name, entities) {
			entities = buildEntitiesLookup(entities) || namedEntities;

			function encodeNamedAndNumeric(text, attr) {
				return text.replace(attr ? attrsCharsRegExp : textCharsRegExp, function(chr) {
					return baseEntities[chr] || entities[chr] || '&#' + chr.charCodeAt(0) + ';' || chr;
				});
			}

			function encodeCustomNamed(text, attr) {
				return Entities.encodeNamed(text, attr, entities);
			}

			// Replace + with , to be compatible with previous TinyMCE versions
			name = makeMap(name.replace(/\+/g, ','));

			// Named and numeric encoder
			if (name.named && name.numeric) {
				return encodeNamedAndNumeric;
			}

			// Named encoder
			if (name.named) {
				// Custom names
				if (entities) {
					return encodeCustomNamed;
				}

				return Entities.encodeNamed;
			}

			// Numeric
			if (name.numeric) {
				return Entities.encodeNumeric;
			}

			// Raw encoder
			return Entities.encodeRaw;
		},

		/**
		 * Decodes the specified string, this will replace entities with raw UTF characters.
		 *
		 * @method decode
		 * @param {String} text Text to entity decode.
		 * @return {String} Entity decoded string.
		 */
		decode: function(text) {
			return text.replace(entityRegExp, function(all, numeric) {
				if (numeric) {
					if (numeric.charAt(0).toLowerCase() === 'x') {
						numeric = parseInt(numeric.substr(1), 16);
					} else {
						numeric = parseInt(numeric, 10);
					}

					// Support upper UTF
					if (numeric > 0xFFFF) {
						numeric -= 0x10000;

						return String.fromCharCode(0xD800 + (numeric >> 10), 0xDC00 + (numeric & 0x3FF));
					}

					return asciiMap[numeric] || String.fromCharCode(numeric);
				}

				return reverseEntities[all] || namedEntities[all] || nativeDecode(all);
			});
		}
	};

	return Entities;
});

// Included from: node_modules/tinymce/js/tinymce/classes/html/SaxParser.js

/**
 * SaxParser.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*eslint max-depth:[2, 9] */

/**
 * This class parses HTML code using pure JavaScript and executes various events for each item it finds. It will
 * always execute the events in the right order for tag soup code like <b><p></b></p>. It will also remove elements
 * and attributes that doesn't fit the schema if the validate setting is enabled.
 *
 * @example
 * var parser = new tinymce.html.SaxParser({
 *     validate: true,
 *
 *     comment: function(text) {
 *         console.log('Comment:', text);
 *     },
 *
 *     cdata: function(text) {
 *         console.log('CDATA:', text);
 *     },
 *
 *     text: function(text, raw) {
 *         console.log('Text:', text, 'Raw:', raw);
 *     },
 *
 *     start: function(name, attrs, empty) {
 *         console.log('Start:', name, attrs, empty);
 *     },
 *
 *     end: function(name) {
 *         console.log('End:', name);
 *     },
 *
 *     pi: function(name, text) {
 *         console.log('PI:', name, text);
 *     },
 *
 *     doctype: function(text) {
 *         console.log('DocType:', text);
 *     }
 * }, schema);
 * @class tinymce.html.SaxParser
 * @version 3.4
 */
define("tinymce/html/SaxParser", [
	"tinymce/html/Schema",
	"tinymce/html/Entities",
	"tinymce/util/Tools"
], function(Schema, Entities, Tools) {
	var each = Tools.each;

	/**
	 * Returns the index of the end tag for a specific start tag. This can be
	 * used to skip all children of a parent element from being processed.
	 *
	 * @private
	 * @method findEndTag
	 * @param {tinymce.html.Schema} schema Schema instance to use to match short ended elements.
	 * @param {String} html HTML string to find the end tag in.
	 * @param {Number} startIndex Indext to start searching at should be after the start tag.
	 * @return {Number} Index of the end tag.
	 */
	function findEndTag(schema, html, startIndex) {
		var count = 1, index, matches, tokenRegExp, shortEndedElements;

		shortEndedElements = schema.getShortEndedElements();
		tokenRegExp = /<([!?\/])?([A-Za-z0-9\-_\:\.]+)((?:\s+[^"\'>]+(?:(?:"[^"]*")|(?:\'[^\']*\')|[^>]*))*|\/|\s+)>/g;
		tokenRegExp.lastIndex = index = startIndex;

		while ((matches = tokenRegExp.exec(html))) {
			index = tokenRegExp.lastIndex;

			if (matches[1] === '/') { // End element
				count--;
			} else if (!matches[1]) { // Start element
				if (matches[2] in shortEndedElements) {
					continue;
				}

				count++;
			}

			if (count === 0) {
				break;
			}
		}

		return index;
	}

	/**
	 * Constructs a new SaxParser instance.
	 *
	 * @constructor
	 * @method SaxParser
	 * @param {Object} settings Name/value collection of settings. comment, cdata, text, start and end are callbacks.
	 * @param {tinymce.html.Schema} schema HTML Schema class to use when parsing.
	 */
	function SaxParser(settings, schema) {
		var self = this;

		function noop() {}

		settings = settings || {};
		self.schema = schema = schema || new Schema();

		if (settings.fix_self_closing !== false) {
			settings.fix_self_closing = true;
		}

		// Add handler functions from settings and setup default handlers
		each('comment cdata text start end pi doctype'.split(' '), function(name) {
			if (name) {
				self[name] = settings[name] || noop;
			}
		});

		/**
		 * Parses the specified HTML string and executes the callbacks for each item it finds.
		 *
		 * @example
		 * new SaxParser({...}).parse('<b>text</b>');
		 * @method parse
		 * @param {String} html Html string to sax parse.
		 */
		self.parse = function(html) {
			var self = this, matches, index = 0, value, endRegExp, stack = [], attrList, i, text, name;
			var isInternalElement, removeInternalElements, shortEndedElements, fillAttrsMap, isShortEnded;
			var validate, elementRule, isValidElement, attr, attribsValue, validAttributesMap, validAttributePatterns;
			var attributesRequired, attributesDefault, attributesForced;
			var anyAttributesRequired, selfClosing, tokenRegExp, attrRegExp, specialElements, attrValue, idCount = 0;
			var decode = Entities.decode, fixSelfClosing, filteredUrlAttrs = Tools.makeMap('src,href,data,background,formaction,poster');
			var scriptUriRegExp = /((java|vb)script|mhtml):/i, dataUriRegExp = /^data:/i;

			function processEndTag(name) {
				var pos, i;

				// Find position of parent of the same type
				pos = stack.length;
				while (pos--) {
					if (stack[pos].name === name) {
						break;
					}
				}

				// Found parent
				if (pos >= 0) {
					// Close all the open elements
					for (i = stack.length - 1; i >= pos; i--) {
						name = stack[i];

						if (name.valid) {
							self.end(name.name);
						}
					}

					// Remove the open elements from the stack
					stack.length = pos;
				}
			}

			function parseAttribute(match, name, value, val2, val3) {
				var attrRule, i, trimRegExp = /[\s\u0000-\u001F]+/g;

				name = name.toLowerCase();
				value = name in fillAttrsMap ? name : decode(value || val2 || val3 || ''); // Handle boolean attribute than value attribute

				// Validate name and value pass through all data- attributes
				if (validate && !isInternalElement && name.indexOf('data-') !== 0) {
					attrRule = validAttributesMap[name];

					// Find rule by pattern matching
					if (!attrRule && validAttributePatterns) {
						i = validAttributePatterns.length;
						while (i--) {
							attrRule = validAttributePatterns[i];
							if (attrRule.pattern.test(name)) {
								break;
							}
						}

						// No rule matched
						if (i === -1) {
							attrRule = null;
						}
					}

					// No attribute rule found
					if (!attrRule) {
						return;
					}

					// Validate value
					if (attrRule.validValues && !(value in attrRule.validValues)) {
						return;
					}
				}

				// Block any javascript: urls or non image data uris
				if (filteredUrlAttrs[name] && !settings.allow_script_urls) {
					var uri = value.replace(trimRegExp, '');

					try {
						// Might throw malformed URI sequence
						uri = decodeURIComponent(uri);
					} catch (ex) {
						// Fallback to non UTF-8 decoder
						uri = unescape(uri);
					}

					if (scriptUriRegExp.test(uri)) {
						return;
					}

					if (!settings.allow_html_data_urls && dataUriRegExp.test(uri) && !/^data:image\//i.test(uri)) {
						return;
					}
				}

				// Add attribute to list and map
				attrList.map[name] = value;
				attrList.push({
					name: name,
					value: value
				});
			}

			// Precompile RegExps and map objects
			tokenRegExp = new RegExp('<(?:' +
				'(?:!--([\\w\\W]*?)-->)|' + // Comment
				'(?:!\\[CDATA\\[([\\w\\W]*?)\\]\\]>)|' + // CDATA
				'(?:!DOCTYPE([\\w\\W]*?)>)|' + // DOCTYPE
				'(?:\\?([^\\s\\/<>]+) ?([\\w\\W]*?)[?/]>)|' + // PI
				'(?:\\/([^>]+)>)|' + // End element
				'(?:([A-Za-z0-9\\-_\\:\\.]+)((?:\\s+[^"\'>]+(?:(?:"[^"]*")|(?:\'[^\']*\')|[^>]*))*|\\/|\\s+)>)' + // Start element
			')', 'g');

			attrRegExp = /([\w:\-]+)(?:\s*=\s*(?:(?:\"((?:[^\"])*)\")|(?:\'((?:[^\'])*)\')|([^>\s]+)))?/g;

			// Setup lookup tables for empty elements and boolean attributes
			shortEndedElements = schema.getShortEndedElements();
			selfClosing = settings.self_closing_elements || schema.getSelfClosingElements();
			fillAttrsMap = schema.getBoolAttrs();
			validate = settings.validate;
			removeInternalElements = settings.remove_internals;
			fixSelfClosing = settings.fix_self_closing;
			specialElements = schema.getSpecialElements();

			while ((matches = tokenRegExp.exec(html))) {
				// Text
				if (index < matches.index) {
					self.text(decode(html.substr(index, matches.index - index)));
				}

				if ((value = matches[6])) { // End element
					value = value.toLowerCase();

					// IE will add a ":" in front of elements it doesn't understand like custom elements or HTML5 elements
					if (value.charAt(0) === ':') {
						value = value.substr(1);
					}

					processEndTag(value);
				} else if ((value = matches[7])) { // Start element
					value = value.toLowerCase();

					// IE will add a ":" in front of elements it doesn't understand like custom elements or HTML5 elements
					if (value.charAt(0) === ':') {
						value = value.substr(1);
					}

					isShortEnded = value in shortEndedElements;

					// Is self closing tag for example an <li> after an open <li>
					if (fixSelfClosing && selfClosing[value] && stack.length > 0 && stack[stack.length - 1].name === value) {
						processEndTag(value);
					}

					// Validate element
					if (!validate || (elementRule = schema.getElementRule(value))) {
						isValidElement = true;

						// Grab attributes map and patters when validation is enabled
						if (validate) {
							validAttributesMap = elementRule.attributes;
							validAttributePatterns = elementRule.attributePatterns;
						}

						// Parse attributes
						if ((attribsValue = matches[8])) {
							isInternalElement = attribsValue.indexOf('data-mce-type') !== -1; // Check if the element is an internal element

							// If the element has internal attributes then remove it if we are told to do so
							if (isInternalElement && removeInternalElements) {
								isValidElement = false;
							}

							attrList = [];
							attrList.map = {};

							attribsValue.replace(attrRegExp, parseAttribute);
						} else {
							attrList = [];
							attrList.map = {};
						}

						// Process attributes if validation is enabled
						if (validate && !isInternalElement) {
							attributesRequired = elementRule.attributesRequired;
							attributesDefault = elementRule.attributesDefault;
							attributesForced = elementRule.attributesForced;
							anyAttributesRequired = elementRule.removeEmptyAttrs;

							// Check if any attribute exists
							if (anyAttributesRequired && !attrList.length) {
								isValidElement = false;
							}

							// Handle forced attributes
							if (attributesForced) {
								i = attributesForced.length;
								while (i--) {
									attr = attributesForced[i];
									name = attr.name;
									attrValue = attr.value;

									if (attrValue === '{$uid}') {
										attrValue = 'mce_' + idCount++;
									}

									attrList.map[name] = attrValue;
									attrList.push({name: name, value: attrValue});
								}
							}

							// Handle default attributes
							if (attributesDefault) {
								i = attributesDefault.length;
								while (i--) {
									attr = attributesDefault[i];
									name = attr.name;

									if (!(name in attrList.map)) {
										attrValue = attr.value;

										if (attrValue === '{$uid}') {
											attrValue = 'mce_' + idCount++;
										}

										attrList.map[name] = attrValue;
										attrList.push({name: name, value: attrValue});
									}
								}
							}

							// Handle required attributes
							if (attributesRequired) {
								i = attributesRequired.length;
								while (i--) {
									if (attributesRequired[i] in attrList.map) {
										break;
									}
								}

								// None of the required attributes where found
								if (i === -1) {
									isValidElement = false;
								}
							}

							// Invalidate element if it's marked as bogus
							if ((attr = attrList.map['data-mce-bogus'])) {
								if (attr === 'all') {
									index = findEndTag(schema, html, tokenRegExp.lastIndex);
									tokenRegExp.lastIndex = index;
									continue;
								}

								isValidElement = false;
							}
						}

						if (isValidElement) {
							self.start(value, attrList, isShortEnded);
						}
					} else {
						isValidElement = false;
					}

					// Treat script, noscript and style a bit different since they may include code that looks like elements
					if ((endRegExp = specialElements[value])) {
						endRegExp.lastIndex = index = matches.index + matches[0].length;

						if ((matches = endRegExp.exec(html))) {
							if (isValidElement) {
								text = html.substr(index, matches.index - index);
							}

							index = matches.index + matches[0].length;
						} else {
							text = html.substr(index);
							index = html.length;
						}

						if (isValidElement) {
							if (text.length > 0) {
								self.text(text, true);
							}

							self.end(value);
						}

						tokenRegExp.lastIndex = index;
						continue;
					}

					// Push value on to stack
					if (!isShortEnded) {
						if (!attribsValue || attribsValue.indexOf('/') != attribsValue.length - 1) {
							stack.push({name: value, valid: isValidElement});
						} else if (isValidElement) {
							self.end(value);
						}
					}
				} else if ((value = matches[1])) { // Comment
					// Padd comment value to avoid browsers from parsing invalid comments as HTML
					if (value.charAt(0) === '>') {
						value = ' ' + value;
					}

					if (!settings.allow_conditional_comments && value.substr(0, 3) === '[if') {
						value = ' ' + value;
					}

					self.comment(value);
				} else if ((value = matches[2])) { // CDATA
					self.cdata(value);
				} else if ((value = matches[3])) { // DOCTYPE
					self.doctype(value);
				} else if ((value = matches[4])) { // PI
					self.pi(value, matches[5]);
				}

				index = matches.index + matches[0].length;
			}

			// Text
			if (index < html.length) {
				self.text(decode(html.substr(index)));
			}

			// Close any open elements
			for (i = stack.length - 1; i >= 0; i--) {
				value = stack[i];

				if (value.valid) {
					self.end(value.name);
				}
			}
		};
	}

	SaxParser.findEndTag = findEndTag;

	return SaxParser;
});

// Included from: node_modules/tinymce/js/tinymce/classes/html/DomParser.js

/**
 * DomParser.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/**
 * This class parses HTML code into a DOM like structure of nodes it will remove redundant whitespace and make
 * sure that the node tree is valid according to the specified schema.
 * So for example: <p>a<p>b</p>c</p> will become <p>a</p><p>b</p><p>c</p>
 *
 * @example
 * var parser = new tinymce.html.DomParser({validate: true}, schema);
 * var rootNode = parser.parse('<h1>content</h1>');
 *
 * @class tinymce.html.DomParser
 * @version 3.4
 */
define("tinymce/html/DomParser", [
	"tinymce/html/Node",
	"tinymce/html/Schema",
	"tinymce/html/SaxParser",
	"tinymce/util/Tools"
], function(Node, Schema, SaxParser, Tools) {
	var makeMap = Tools.makeMap, each = Tools.each, explode = Tools.explode, extend = Tools.extend;

	/**
	 * Constructs a new DomParser instance.
	 *
	 * @constructor
	 * @method DomParser
	 * @param {Object} settings Name/value collection of settings. comment, cdata, text, start and end are callbacks.
	 * @param {tinymce.html.Schema} schema HTML Schema class to use when parsing.
	 */
	return function(settings, schema) {
		var self = this, nodeFilters = {}, attributeFilters = [], matchedNodes = {}, matchedAttributes = {};

		settings = settings || {};
		settings.validate = "validate" in settings ? settings.validate : true;
		settings.root_name = settings.root_name || 'body';
		self.schema = schema = schema || new Schema();

		function fixInvalidChildren(nodes) {
			var ni, node, parent, parents, newParent, currentNode, tempNode, childNode, i;
			var nonEmptyElements, nonSplitableElements, textBlockElements, specialElements, sibling, nextNode;

			nonSplitableElements = makeMap('tr,td,th,tbody,thead,tfoot,table');
			nonEmptyElements = schema.getNonEmptyElements();
			textBlockElements = schema.getTextBlockElements();
			specialElements = schema.getSpecialElements();

			for (ni = 0; ni < nodes.length; ni++) {
				node = nodes[ni];

				// Already removed or fixed
				if (!node.parent || node.fixed) {
					continue;
				}

				// If the invalid element is a text block and the text block is within a parent LI element
				// Then unwrap the first text block and convert other sibling text blocks to LI elements similar to Word/Open Office
				if (textBlockElements[node.name] && node.parent.name == 'li') {
					// Move sibling text blocks after LI element
					sibling = node.next;
					while (sibling) {
						if (textBlockElements[sibling.name]) {
							sibling.name = 'li';
							sibling.fixed = true;
							node.parent.insert(sibling, node.parent);
						} else {
							break;
						}

						sibling = sibling.next;
					}

					// Unwrap current text block
					node.unwrap(node);
					continue;
				}

				// Get list of all parent nodes until we find a valid parent to stick the child into
				parents = [node];
				for (parent = node.parent; parent && !schema.isValidChild(parent.name, node.name) &&
					!nonSplitableElements[parent.name]; parent = parent.parent) {
					parents.push(parent);
				}

				// Found a suitable parent
				if (parent && parents.length > 1) {
					// Reverse the array since it makes looping easier
					parents.reverse();

					// Clone the related parent and insert that after the moved node
					newParent = currentNode = self.filterNode(parents[0].clone());

					// Start cloning and moving children on the left side of the target node
					for (i = 0; i < parents.length - 1; i++) {
						if (schema.isValidChild(currentNode.name, parents[i].name)) {
							tempNode = self.filterNode(parents[i].clone());
							currentNode.append(tempNode);
						} else {
							tempNode = currentNode;
						}

						for (childNode = parents[i].firstChild; childNode && childNode != parents[i + 1];) {
							nextNode = childNode.next;
							tempNode.append(childNode);
							childNode = nextNode;
						}

						currentNode = tempNode;
					}

					if (!newParent.isEmpty(nonEmptyElements)) {
						parent.insert(newParent, parents[0], true);
						parent.insert(node, newParent);
					} else {
						parent.insert(node, parents[0], true);
					}

					// Check if the element is empty by looking through it's contents and special treatment for <p><br /></p>
					parent = parents[0];
					if (parent.isEmpty(nonEmptyElements) || parent.firstChild === parent.lastChild && parent.firstChild.name === 'br') {
						parent.empty().remove();
					}
				} else if (node.parent) {
					// If it's an LI try to find a UL/OL for it or wrap it
					if (node.name === 'li') {
						sibling = node.prev;
						if (sibling && (sibling.name === 'ul' || sibling.name === 'ul')) {
							sibling.append(node);
							continue;
						}

						sibling = node.next;
						if (sibling && (sibling.name === 'ul' || sibling.name === 'ul')) {
							sibling.insert(node, sibling.firstChild, true);
							continue;
						}

						node.wrap(self.filterNode(new Node('ul', 1)));
						continue;
					}

					// Try wrapping the element in a DIV
					if (schema.isValidChild(node.parent.name, 'div') && schema.isValidChild('div', node.name)) {
						node.wrap(self.filterNode(new Node('div', 1)));
					} else {
						// We failed wrapping it, then remove or unwrap it
						if (specialElements[node.name]) {
							node.empty().remove();
						} else {
							node.unwrap();
						}
					}
				}
			}
		}

		/**
		 * Runs the specified node though the element and attributes filters.
		 *
		 * @method filterNode
		 * @param {tinymce.html.Node} Node the node to run filters on.
		 * @return {tinymce.html.Node} The passed in node.
		 */
		self.filterNode = function(node) {
			var i, name, list;

			// Run element filters
			if (name in nodeFilters) {
				list = matchedNodes[name];

				if (list) {
					list.push(node);
				} else {
					matchedNodes[name] = [node];
				}
			}

			// Run attribute filters
			i = attributeFilters.length;
			while (i--) {
				name = attributeFilters[i].name;

				if (name in node.attributes.map) {
					list = matchedAttributes[name];

					if (list) {
						list.push(node);
					} else {
						matchedAttributes[name] = [node];
					}
				}
			}

			return node;
		};

		/**
		 * Adds a node filter function to the parser, the parser will collect the specified nodes by name
		 * and then execute the callback ones it has finished parsing the document.
		 *
		 * @example
		 * parser.addNodeFilter('p,h1', function(nodes, name) {
		 *		for (var i = 0; i < nodes.length; i++) {
		 *			console.log(nodes[i].name);
		 *		}
		 * });
		 * @method addNodeFilter
		 * @method {String} name Comma separated list of nodes to collect.
		 * @param {function} callback Callback function to execute once it has collected nodes.
		 */
		self.addNodeFilter = function(name, callback) {
			each(explode(name), function(name) {
				var list = nodeFilters[name];

				if (!list) {
					nodeFilters[name] = list = [];
				}

				list.push(callback);
			});
		};

		/**
		 * Adds a attribute filter function to the parser, the parser will collect nodes that has the specified attributes
		 * and then execute the callback ones it has finished parsing the document.
		 *
		 * @example
		 * parser.addAttributeFilter('src,href', function(nodes, name) {
		 *		for (var i = 0; i < nodes.length; i++) {
		 *			console.log(nodes[i].name);
		 *		}
		 * });
		 * @method addAttributeFilter
		 * @method {String} name Comma separated list of nodes to collect.
		 * @param {function} callback Callback function to execute once it has collected nodes.
		 */
		self.addAttributeFilter = function(name, callback) {
			each(explode(name), function(name) {
				var i;

				for (i = 0; i < attributeFilters.length; i++) {
					if (attributeFilters[i].name === name) {
						attributeFilters[i].callbacks.push(callback);
						return;
					}
				}

				attributeFilters.push({name: name, callbacks: [callback]});
			});
		};

		/**
		 * Parses the specified HTML string into a DOM like node tree and returns the result.
		 *
		 * @example
		 * var rootNode = new DomParser({...}).parse('<b>text</b>');
		 * @method parse
		 * @param {String} html Html string to sax parse.
		 * @param {Object} args Optional args object that gets passed to all filter functions.
		 * @return {tinymce.html.Node} Root node containing the tree.
		 */
		self.parse = function(html, args) {
			var parser, rootNode, node, nodes, i, l, fi, fl, list, name, validate;
			var blockElements, startWhiteSpaceRegExp, invalidChildren = [], isInWhiteSpacePreservedElement;
			var endWhiteSpaceRegExp, allWhiteSpaceRegExp, isAllWhiteSpaceRegExp, whiteSpaceElements;
			var children, nonEmptyElements, rootBlockName;

			args = args || {};
			matchedNodes = {};
			matchedAttributes = {};
			blockElements = extend(makeMap('script,style,head,html,body,title,meta,param'), schema.getBlockElements());
			nonEmptyElements = schema.getNonEmptyElements();
			children = schema.children;
			validate = settings.validate;
			rootBlockName = "forced_root_block" in args ? args.forced_root_block : settings.forced_root_block;

			whiteSpaceElements = schema.getWhiteSpaceElements();
			startWhiteSpaceRegExp = /^[ \t\r\n]+/;
			endWhiteSpaceRegExp = /[ \t\r\n]+$/;
			allWhiteSpaceRegExp = /[ \t\r\n]+/g;
			isAllWhiteSpaceRegExp = /^[ \t\r\n]+$/;

			function addRootBlocks() {
				var node = rootNode.firstChild, next, rootBlockNode;

				// Removes whitespace at beginning and end of block so:
				// <p> x </p> -> <p>x</p>
				function trim(rootBlockNode) {
					if (rootBlockNode) {
						node = rootBlockNode.firstChild;
						if (node && node.type == 3) {
							node.value = node.value.replace(startWhiteSpaceRegExp, '');
						}

						node = rootBlockNode.lastChild;
						if (node && node.type == 3) {
							node.value = node.value.replace(endWhiteSpaceRegExp, '');
						}
					}
				}

				// Check if rootBlock is valid within rootNode for example if P is valid in H1 if H1 is the contentEditabe root
				if (!schema.isValidChild(rootNode.name, rootBlockName.toLowerCase())) {
					return;
				}

				while (node) {
					next = node.next;

					if (node.type == 3 || (node.type == 1 && node.name !== 'p' &&
						!blockElements[node.name] && !node.attr('data-mce-type'))) {
						if (!rootBlockNode) {
							// Create a new root block element
							rootBlockNode = createNode(rootBlockName, 1);
							rootBlockNode.attr(settings.forced_root_block_attrs);
							rootNode.insert(rootBlockNode, node);
							rootBlockNode.append(node);
						} else {
							rootBlockNode.append(node);
						}
					} else {
						trim(rootBlockNode);
						rootBlockNode = null;
					}

					node = next;
				}

				trim(rootBlockNode);
			}

			function createNode(name, type) {
				var node = new Node(name, type), list;

				if (name in nodeFilters) {
					list = matchedNodes[name];

					if (list) {
						list.push(node);
					} else {
						matchedNodes[name] = [node];
					}
				}

				return node;
			}

			function removeWhitespaceBefore(node) {
				var textNode, textNodeNext, textVal, sibling, blockElements = schema.getBlockElements();

				for (textNode = node.prev; textNode && textNode.type === 3;) {
					textVal = textNode.value.replace(endWhiteSpaceRegExp, '');

					// Found a text node with non whitespace then trim that and break
					if (textVal.length > 0) {
						textNode.value = textVal;
						return;
					}

					textNodeNext = textNode.next;

					// Fix for bug #7543 where bogus nodes would produce empty
					// text nodes and these would be removed if a nested list was before it
					if (textNodeNext) {
						if (textNodeNext.type == 3 && textNodeNext.value.length) {
							textNode = textNode.prev;
							continue;
						}

						if (!blockElements[textNodeNext.name] && textNodeNext.name != 'script' && textNodeNext.name != 'style') {
							textNode = textNode.prev;
							continue;
						}
					}

					sibling = textNode.prev;
					textNode.remove();
					textNode = sibling;
				}
			}

			function cloneAndExcludeBlocks(input) {
				var name, output = {};

				for (name in input) {
					if (name !== 'li' && name != 'p') {
						output[name] = input[name];
					}
				}

				return output;
			}

			parser = new SaxParser({
				validate: validate,
				allow_script_urls: settings.allow_script_urls,
				allow_conditional_comments: settings.allow_conditional_comments,

				// Exclude P and LI from DOM parsing since it's treated better by the DOM parser
				self_closing_elements: cloneAndExcludeBlocks(schema.getSelfClosingElements()),

				cdata: function(text) {
					node.append(createNode('#cdata', 4)).value = text;
				},

				text: function(text, raw) {
					var textNode;

					// Trim all redundant whitespace on non white space elements
					if (!isInWhiteSpacePreservedElement) {
						text = text.replace(allWhiteSpaceRegExp, ' ');

						if (node.lastChild && blockElements[node.lastChild.name]) {
							text = text.replace(startWhiteSpaceRegExp, '');
						}
					}

					// Do we need to create the node
					if (text.length !== 0) {
						textNode = createNode('#text', 3);
						textNode.raw = !!raw;
						node.append(textNode).value = text;
					}
				},

				comment: function(text) {
					node.append(createNode('#comment', 8)).value = text;
				},

				pi: function(name, text) {
					node.append(createNode(name, 7)).value = text;
					removeWhitespaceBefore(node);
				},

				doctype: function(text) {
					var newNode;

					newNode = node.append(createNode('#doctype', 10));
					newNode.value = text;
					removeWhitespaceBefore(node);
				},

				start: function(name, attrs, empty) {
					var newNode, attrFiltersLen, elementRule, attrName, parent;

					elementRule = validate ? schema.getElementRule(name) : {};
					if (elementRule) {
						newNode = createNode(elementRule.outputName || name, 1);
						newNode.attributes = attrs;
						newNode.shortEnded = empty;

						node.append(newNode);

						// Check if node is valid child of the parent node is the child is
						// unknown we don't collect it since it's probably a custom element
						parent = children[node.name];
						if (parent && children[newNode.name] && !parent[newNode.name]) {
							invalidChildren.push(newNode);
						}

						attrFiltersLen = attributeFilters.length;
						while (attrFiltersLen--) {
							attrName = attributeFilters[attrFiltersLen].name;

							if (attrName in attrs.map) {
								list = matchedAttributes[attrName];

								if (list) {
									list.push(newNode);
								} else {
									matchedAttributes[attrName] = [newNode];
								}
							}
						}

						// Trim whitespace before block
						if (blockElements[name]) {
							removeWhitespaceBefore(newNode);
						}

						// Change current node if the element wasn't empty i.e not <br /> or <img />
						if (!empty) {
							node = newNode;
						}

						// Check if we are inside a whitespace preserved element
						if (!isInWhiteSpacePreservedElement && whiteSpaceElements[name]) {
							isInWhiteSpacePreservedElement = true;
						}
					}
				},

				end: function(name) {
					var textNode, elementRule, text, sibling, tempNode;

					elementRule = validate ? schema.getElementRule(name) : {};
					if (elementRule) {
						if (blockElements[name]) {
							if (!isInWhiteSpacePreservedElement) {
								// Trim whitespace of the first node in a block
								textNode = node.firstChild;
								if (textNode && textNode.type === 3) {
									text = textNode.value.replace(startWhiteSpaceRegExp, '');

									// Any characters left after trim or should we remove it
									if (text.length > 0) {
										textNode.value = text;
										textNode = textNode.next;
									} else {
										sibling = textNode.next;
										textNode.remove();
										textNode = sibling;

										// Remove any pure whitespace siblings
										while (textNode && textNode.type === 3) {
											text = textNode.value;
											sibling = textNode.next;

											if (text.length === 0 || isAllWhiteSpaceRegExp.test(text)) {
												textNode.remove();
												textNode = sibling;
											}

											textNode = sibling;
										}
									}
								}

								// Trim whitespace of the last node in a block
								textNode = node.lastChild;
								if (textNode && textNode.type === 3) {
									text = textNode.value.replace(endWhiteSpaceRegExp, '');

									// Any characters left after trim or should we remove it
									if (text.length > 0) {
										textNode.value = text;
										textNode = textNode.prev;
									} else {
										sibling = textNode.prev;
										textNode.remove();
										textNode = sibling;

										// Remove any pure whitespace siblings
										while (textNode && textNode.type === 3) {
											text = textNode.value;
											sibling = textNode.prev;

											if (text.length === 0 || isAllWhiteSpaceRegExp.test(text)) {
												textNode.remove();
												textNode = sibling;
											}

											textNode = sibling;
										}
									}
								}
							}

							// Trim start white space
							// Removed due to: #5424
							/*textNode = node.prev;
							if (textNode && textNode.type === 3) {
								text = textNode.value.replace(startWhiteSpaceRegExp, '');

								if (text.length > 0)
									textNode.value = text;
								else
									textNode.remove();
							}*/
						}

						// Check if we exited a whitespace preserved element
						if (isInWhiteSpacePreservedElement && whiteSpaceElements[name]) {
							isInWhiteSpacePreservedElement = false;
						}

						// Handle empty nodes
						if (elementRule.removeEmpty || elementRule.paddEmpty) {
							if (node.isEmpty(nonEmptyElements)) {
								if (elementRule.paddEmpty) {
									node.empty().append(new Node('#text', '3')).value = '\u00a0';
								} else {
									// Leave nodes that have a name like <a name="name">
									if (!node.attributes.map.name && !node.attributes.map.id) {
										tempNode = node.parent;

										if (blockElements[node.name]) {
											node.empty().remove();
										} else {
											node.unwrap();
										}

										node = tempNode;
										return;
									}
								}
							}
						}

						node = node.parent;
					}
				}
			}, schema);

			rootNode = node = new Node(args.context || settings.root_name, 11);

			parser.parse(html);

			// Fix invalid children or report invalid children in a contextual parsing
			if (validate && invalidChildren.length) {
				if (!args.context) {
					fixInvalidChildren(invalidChildren);
				} else {
					args.invalid = true;
				}
			}

			// Wrap nodes in the root into block elements if the root is body
			if (rootBlockName && (rootNode.name == 'body' || args.isRootContent)) {
				addRootBlocks();
			}

			// Run filters only when the contents is valid
			if (!args.invalid) {
				// Run node filters
				for (name in matchedNodes) {
					list = nodeFilters[name];
					nodes = matchedNodes[name];

					// Remove already removed children
					fi = nodes.length;
					while (fi--) {
						if (!nodes[fi].parent) {
							nodes.splice(fi, 1);
						}
					}

					for (i = 0, l = list.length; i < l; i++) {
						list[i](nodes, name, args);
					}
				}

				// Run attribute filters
				for (i = 0, l = attributeFilters.length; i < l; i++) {
					list = attributeFilters[i];

					if (list.name in matchedAttributes) {
						nodes = matchedAttributes[list.name];

						// Remove already removed children
						fi = nodes.length;
						while (fi--) {
							if (!nodes[fi].parent) {
								nodes.splice(fi, 1);
							}
						}

						for (fi = 0, fl = list.callbacks.length; fi < fl; fi++) {
							list.callbacks[fi](nodes, list.name, args);
						}
					}
				}
			}

			return rootNode;
		};

		// Remove <br> at end of block elements Gecko and WebKit injects BR elements to
		// make it possible to place the caret inside empty blocks. This logic tries to remove
		// these elements and keep br elements that where intended to be there intact
		if (settings.remove_trailing_brs) {
			self.addNodeFilter('br', function(nodes) {
				var i, l = nodes.length, node, blockElements = extend({}, schema.getBlockElements());
				var nonEmptyElements = schema.getNonEmptyElements(), parent, lastParent, prev, prevName;
				var elementRule, textNode;

				// Remove brs from body element as well
				blockElements.body = 1;

				// Must loop forwards since it will otherwise remove all brs in <p>a<br><br><br></p>
				for (i = 0; i < l; i++) {
					node = nodes[i];
					parent = node.parent;

					if (blockElements[node.parent.name] && node === parent.lastChild) {
						// Loop all nodes to the left of the current node and check for other BR elements
						// excluding bookmarks since they are invisible
						prev = node.prev;
						while (prev) {
							prevName = prev.name;

							// Ignore bookmarks
							if (prevName !== "span" || prev.attr('data-mce-type') !== 'bookmark') {
								// Found a non BR element
								if (prevName !== "br") {
									break;
								}

								// Found another br it's a <br><br> structure then don't remove anything
								if (prevName === 'br') {
									node = null;
									break;
								}
							}

							prev = prev.prev;
						}

						if (node) {
							node.remove();

							// Is the parent to be considered empty after we removed the BR
							if (parent.isEmpty(nonEmptyElements)) {
								elementRule = schema.getElementRule(parent.name);

								// Remove or padd the element depending on schema rule
								if (elementRule) {
									if (elementRule.removeEmpty) {
										parent.remove();
									} else if (elementRule.paddEmpty) {
										parent.empty().append(new Node('#text', 3)).value = '\u00a0';
									}
								}
							}
						}
					} else {
						// Replaces BR elements inside inline elements like <p><b><i><br></i></b></p>
						// so they become <p><b><i>&nbsp;</i></b></p>
						lastParent = node;
						while (parent && parent.firstChild === lastParent && parent.lastChild === lastParent) {
							lastParent = parent;

							if (blockElements[parent.name]) {
								break;
							}

							parent = parent.parent;
						}

						if (lastParent === parent) {
							textNode = new Node('#text', 3);
							textNode.value = '\u00a0';
							node.replace(textNode);
						}
					}
				}
			});
		}

		// Force anchor names closed, unless the setting "allow_html_in_named_anchor" is explicitly included.
		if (!settings.allow_html_in_named_anchor) {
			self.addAttributeFilter('id,name', function(nodes) {
				var i = nodes.length, sibling, prevSibling, parent, node;

				while (i--) {
					node = nodes[i];
					if (node.name === 'a' && node.firstChild && !node.attr('href')) {
						parent = node.parent;

						// Move children after current node
						sibling = node.lastChild;
						do {
							prevSibling = sibling.prev;
							parent.insert(sibling, node);
							sibling = prevSibling;
						} while (sibling);
					}
				}
			});
		}

		if (settings.validate && schema.getValidClasses()) {
			self.addAttributeFilter('class', function(nodes) {
				var i = nodes.length, node, classList, ci, className, classValue;
				var validClasses = schema.getValidClasses(), validClassesMap, valid;

				while (i--) {
					node = nodes[i];
					classList = node.attr('class').split(' ');
					classValue = '';

					for (ci = 0; ci < classList.length; ci++) {
						className = classList[ci];
						valid = false;

						validClassesMap = validClasses['*'];
						if (validClassesMap && validClassesMap[className]) {
							valid = true;
						}

						validClassesMap = validClasses[node.name];
						if (!valid && validClassesMap && validClassesMap[className]) {
							valid = true;
						}

						if (valid) {
							if (classValue) {
								classValue += ' ';
							}

							classValue += className;
						}
					}

					if (!classValue.length) {
						classValue = null;
					}

					node.attr('class', classValue);
				}
			});
		}
	};
});

// Included from: node_modules/tinymce/js/tinymce/classes/html/Writer.js

/**
 * Writer.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/**
 * This class is used to write HTML tags out it can be used with the Serializer or the SaxParser.
 *
 * @class tinymce.html.Writer
 * @example
 * var writer = new tinymce.html.Writer({indent: true});
 * var parser = new tinymce.html.SaxParser(writer).parse('<p><br></p>');
 * console.log(writer.getContent());
 *
 * @class tinymce.html.Writer
 * @version 3.4
 */
define("tinymce/html/Writer", [
	"tinymce/html/Entities",
	"tinymce/util/Tools"
], function(Entities, Tools) {
	var makeMap = Tools.makeMap;

	/**
	 * Constructs a new Writer instance.
	 *
	 * @constructor
	 * @method Writer
	 * @param {Object} settings Name/value settings object.
	 */
	return function(settings) {
		var html = [], indent, indentBefore, indentAfter, encode, htmlOutput;

		settings = settings || {};
		indent = settings.indent;
		indentBefore = makeMap(settings.indent_before || '');
		indentAfter = makeMap(settings.indent_after || '');
		encode = Entities.getEncodeFunc(settings.entity_encoding || 'raw', settings.entities);
		htmlOutput = settings.element_format == "html";

		return {
			/**
			 * Writes the a start element such as <p id="a">.
			 *
			 * @method start
			 * @param {String} name Name of the element.
			 * @param {Array} attrs Optional attribute array or undefined if it hasn't any.
			 * @param {Boolean} empty Optional empty state if the tag should end like <br />.
			 */
			start: function(name, attrs, empty) {
				var i, l, attr, value;

				if (indent && indentBefore[name] && html.length > 0) {
					value = html[html.length - 1];

					if (value.length > 0 && value !== '\n') {
						html.push('\n');
					}
				}

				html.push('<', name);

				if (attrs) {
					for (i = 0, l = attrs.length; i < l; i++) {
						attr = attrs[i];
						html.push(' ', attr.name, '="', encode(attr.value, true), '"');
					}
				}

				if (!empty || htmlOutput) {
					html[html.length] = '>';
				} else {
					html[html.length] = ' />';
				}

				if (empty && indent && indentAfter[name] && html.length > 0) {
					value = html[html.length - 1];

					if (value.length > 0 && value !== '\n') {
						html.push('\n');
					}
				}
			},

			/**
			 * Writes the a end element such as </p>.
			 *
			 * @method end
			 * @param {String} name Name of the element.
			 */
			end: function(name) {
				var value;

				/*if (indent && indentBefore[name] && html.length > 0) {
					value = html[html.length - 1];

					if (value.length > 0 && value !== '\n')
						html.push('\n');
				}*/

				html.push('</', name, '>');

				if (indent && indentAfter[name] && html.length > 0) {
					value = html[html.length - 1];

					if (value.length > 0 && value !== '\n') {
						html.push('\n');
					}
				}
			},

			/**
			 * Writes a text node.
			 *
			 * @method text
			 * @param {String} text String to write out.
			 * @param {Boolean} raw Optional raw state if true the contents wont get encoded.
			 */
			text: function(text, raw) {
				if (text.length > 0) {
					html[html.length] = raw ? text : encode(text);
				}
			},

			/**
			 * Writes a cdata node such as <![CDATA[data]]>.
			 *
			 * @method cdata
			 * @param {String} text String to write out inside the cdata.
			 */
			cdata: function(text) {
				html.push('<![CDATA[', text, ']]>');
			},

			/**
			 * Writes a comment node such as <!-- Comment -->.
			 *
			 * @method cdata
			 * @param {String} text String to write out inside the comment.
			 */
			comment: function(text) {
				html.push('<!--', text, '-->');
			},

			/**
			 * Writes a PI node such as <?xml attr="value" ?>.
			 *
			 * @method pi
			 * @param {String} name Name of the pi.
			 * @param {String} text String to write out inside the pi.
			 */
			pi: function(name, text) {
				if (text) {
					html.push('<?', name, ' ', encode(text), '?>');
				} else {
					html.push('<?', name, '?>');
				}

				if (indent) {
					html.push('\n');
				}
			},

			/**
			 * Writes a doctype node such as <!DOCTYPE data>.
			 *
			 * @method doctype
			 * @param {String} text String to write out inside the doctype.
			 */
			doctype: function(text) {
				html.push('<!DOCTYPE', text, '>', indent ? '\n' : '');
			},

			/**
			 * Resets the internal buffer if one wants to reuse the writer.
			 *
			 * @method reset
			 */
			reset: function() {
				html.length = 0;
			},

			/**
			 * Returns the contents that got serialized.
			 *
			 * @method getContent
			 * @return {String} HTML contents that got written down.
			 */
			getContent: function() {
				return html.join('').replace(/\n$/, '');
			}
		};
	};
});

// Included from: node_modules/tinymce/js/tinymce/classes/html/Serializer.js

/**
 * Serializer.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/**
 * This class is used to serialize down the DOM tree into a string using a Writer instance.
 *
 *
 * @example
 * new tinymce.html.Serializer().serialize(new tinymce.html.DomParser().parse('<p>text</p>'));
 * @class tinymce.html.Serializer
 * @version 3.4
 */
define("tinymce/html/Serializer", [
	"tinymce/html/Writer",
	"tinymce/html/Schema"
], function(Writer, Schema) {
	/**
	 * Constructs a new Serializer instance.
	 *
	 * @constructor
	 * @method Serializer
	 * @param {Object} settings Name/value settings object.
	 * @param {tinymce.html.Schema} schema Schema instance to use.
	 */
	return function(settings, schema) {
		var self = this, writer = new Writer(settings);

		settings = settings || {};
		settings.validate = "validate" in settings ? settings.validate : true;

		self.schema = schema = schema || new Schema();
		self.writer = writer;

		/**
		 * Serializes the specified node into a string.
		 *
		 * @example
		 * new tinymce.html.Serializer().serialize(new tinymce.html.DomParser().parse('<p>text</p>'));
		 * @method serialize
		 * @param {tinymce.html.Node} node Node instance to serialize.
		 * @return {String} String with HTML based on DOM tree.
		 */
		self.serialize = function(node) {
			var handlers, validate;

			validate = settings.validate;

			handlers = {
				// #text
				3: function(node) {
					writer.text(node.value, node.raw);
				},

				// #comment
				8: function(node) {
					writer.comment(node.value);
				},

				// Processing instruction
				7: function(node) {
					writer.pi(node.name, node.value);
				},

				// Doctype
				10: function(node) {
					writer.doctype(node.value);
				},

				// CDATA
				4: function(node) {
					writer.cdata(node.value);
				},

				// Document fragment
				11: function(node) {
					if ((node = node.firstChild)) {
						do {
							walk(node);
						} while ((node = node.next));
					}
				}
			};

			writer.reset();

			function walk(node) {
				var handler = handlers[node.type], name, isEmpty, attrs, attrName, attrValue, sortedAttrs, i, l, elementRule;

				if (!handler) {
					name = node.name;
					isEmpty = node.shortEnded;
					attrs = node.attributes;

					// Sort attributes
					if (validate && attrs && attrs.length > 1) {
						sortedAttrs = [];
						sortedAttrs.map = {};

						elementRule = schema.getElementRule(node.name);
						if (elementRule) {
							for (i = 0, l = elementRule.attributesOrder.length; i < l; i++) {
								attrName = elementRule.attributesOrder[i];

								if (attrName in attrs.map) {
									attrValue = attrs.map[attrName];
									sortedAttrs.map[attrName] = attrValue;
									sortedAttrs.push({name: attrName, value: attrValue});
								}
							}

							for (i = 0, l = attrs.length; i < l; i++) {
								attrName = attrs[i].name;

								if (!(attrName in sortedAttrs.map)) {
									attrValue = attrs.map[attrName];
									sortedAttrs.map[attrName] = attrValue;
									sortedAttrs.push({name: attrName, value: attrValue});
								}
							}

							attrs = sortedAttrs;
						}
					}

					writer.start(node.name, attrs, isEmpty);

					if (!isEmpty) {
						if ((node = node.firstChild)) {
							do {
								walk(node);
							} while ((node = node.next));
						}

						writer.end(name);
					}
				} else {
					handler(node);
				}
			}

			// Serialize element and treat all non elements as fragments
			if (node.type == 1 && !settings.inner) {
				walk(node);
			} else {
				handlers[11](node);
			}

			return writer.getContent();
		};
	};
});

expose(["tinymce/html/Node","tinymce/Env","tinymce/util/Tools","tinymce/html/Schema","tinymce/html/Entities","tinymce/html/SaxParser","tinymce/html/DomParser","tinymce/html/Writer","tinymce/html/Serializer"]);
})(this);
module.exports = exports.tinymce;