/*jslint node: true, white: true */
'use strict';

var util = require('utile')
  ;

var definers = {}
  , validStringFormats = {
      'url': true
    , 'email': true
    , 'ip-address': true
    , 'ipv6': true
    , 'date-time': true
    , 'date': true
    , 'time': true
    , 'color': true
    , 'host-name': true
    , 'utc-millisec': true
		}
  ;

function required(options, props) {
	if(options.required !== undefined) {
		if(options.required === true || options.required === false) {
			props.required = options.required;
		}
	}
}

function nullable(options, props) {
	if(options.nullable !== undefined) {
		if(options.nullable === true) {
			if(props.type instanceof Array) {
				props.type.push('null');
			} else {
				props.type = [props.type, 'null'];
			}
		}
	}
}

function numeric(options, name, props) {
	if(typeof options[name] === 'number') {
		props[name] = options[name];
	}
}

definers.array = function(name, options) {
	if(name === undefined) {
		throw new Error('array definer requires a name');
	}
	this.properties[name] = {type: 'array'};
	if(options) {
		required(options, this.properties[name]);
		nullable(options, this.properties[name]);
		numeric(options, 'minItems', this.properties[name]);
		numeric(options, 'maxItems', this.properties[name]);
		if(options.uniqueItems !== undefined) {
			if(options.uniqueItems === true || options.uniqueItems === false) {
				this.properties[name].uniqueItems = options.uniqueItems;
			}
		}
	}
};

definers.bool = function(name, options) {
	if(name === undefined) {
		throw new Error('bool definer requires a name');
	}
	this.properties[name] = {type: 'boolean'};
	if(options) {
		required(options, this.properties[name]);
		nullable(options, this.properties[name]);
	}
};

definers.datetime = function(name, options) {
	var needsCoercion = false
	  ;
	if(name === undefined) {
		throw new Error('datetime definer requires a name');
	}
	this.properties[name] = {type: 'number'};

	options = util.clone(options || {});
	if(options.minimum !== undefined) {
		options.minimum = options.minimum.valueOf();
		needsCoercion = true;
	}
	if(options.maximum !== undefined) {
		options.maximum = options.maximum.valueOf();
		needsCoercion = true;
	}
	if(options) {
		required(options, this.properties[name]);
		nullable(options, this.properties[name]);
		numeric(options, 'minimum', this.properties[name]);
		numeric(options, 'maximum', this.properties[name]);
	}
	if(needsCoercion) {
		this.coercedProperties.push(name);
	}
};

definers.id = function(options) {
	var isProperObject = typeof options !== 'object'
	                  || options instanceof Array
	                  || options instanceof Date
	                  || options === null
	  ;
	if(isProperObject) {
		throw new Error('id requires a configuration spec');
	}
	options = util.clone(options);
	options.nullable = true;
	delete options.required;
	
	this.string('_id', options);
};

definers.number = function(name, options) {
	if(name === undefined) {
		throw new Error('number definer requires a name');
	}
	this.properties[name] = {type: 'number'};
	if(options) {
		required(options, this.properties[name]);
		nullable(options, this.properties[name]);
		numeric(options, 'minimum', this.properties[name]);
		numeric(options, 'maximum', this.properties[name]);
		numeric(options, 'exclusiveMinimum', this.properties[name]);
		numeric(options, 'exclusiveMaximum', this.properties[name]);
		numeric(options, 'divisibleBy', this.properties[name]);
	}
};

definers.object = function(name, options, definer) {
	var subschema = {properties: {}};
	if(name === undefined) {
		throw new Error('object definer requires a name');
	}
	if(typeof options === 'function') {
		definer = options;
		options = arguments[arguments.length];
	}
	this.properties[name] = {type: 'object'};
	if(options) {
		required(options, this.properties[name]);
		nullable(options, this.properties[name]);
	}
	if(definer) {
		Object.keys(definers).forEach(function(key) {
			subschema[key] = function() {
				definers[key].apply(subschema, arguments);
			};
		});
		definer.call(subschema);
		Object.keys(definers).forEach(function(key) {
			delete subschema[key];
		});
		this.properties[name].properties = subschema.properties;
	}
};

definers.string = function(name, options) {
	if(name === undefined) {
		throw new Error('string definer requires a name');
	}
	this.properties[name] = {type: 'string'};
	if(options) {
		required(options, this.properties[name]);
		nullable(options, this.properties[name]);
		numeric(options, 'minLength', this.properties[name]);
		numeric(options, 'maxLength', this.properties[name]);

		if(typeof options.format === 'string') {
			if(validStringFormats[options.format]) {
				this.properties[name].format = options.format;
			}
		} else if(options.format instanceof RegExp) {
			this.properties[name].pattern = options.format;
		}
	}
};

module.exports = definers;