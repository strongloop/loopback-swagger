// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var assert = require('assert');
var util = require('util');
var base = require('./generator-base');
var _ = require('lodash');

function V2Generator(options) {
  base.BaseGenerator.apply(this, arguments);
}

util.inherits(V2Generator, base.BaseGenerator);

function V2Operation(op) {
  base.BaseOperation.apply(this, arguments);
}

util.inherits(V2Operation, base.BaseOperation);

V2Operation.prototype.resolveTypeRef = function(ref) {
  if (typeof ref === 'string') {
    if (ref.indexOf('#/definitions/') === 0) {
      ref = ref.substring('#/definitions/'.length);
    }
  }
  return ref;
};

/**
 * Convert a swagger parameter to strong-remoting argument
 * @param {Object} p
 * @returns {Object}
 */
V2Operation.prototype.parameter = function(p) {
  var type = p.type;
  if (p.type === 'integer') {
    type = 'number';
  }
  if (p.type === 'array' && p.items) {
    type = [p.items.type || this.resolveTypeRef(p.items.$ref)];
  }
  if (p.schema && p.schema.$ref) {
    type = this.resolveTypeRef(p.schema.$ref);
  }

  return {
    arg: p.name,
    type: type || 'any',
    description: p.description,
    required: p.required,
    http: {
      source: p.in,
    },
  };
};

V2Operation.prototype.getReturns = function() {
  if (this.returns) {
    return this.returns;
  }
  var returns = [];
  this.errorTypes = [];
  this.returnType = 'any';
  var modelName, model, type, code;
  for (code in this.responses) {
    var res = this.responses[code];
    if (code.match(/^2\d\d$/)) {
      if (res.schema && res.schema.$ref) {
        modelName = this.resolveTypeRef(res.schema.$ref);
        model = this.models[modelName];
        type = model ? modelName : 'Object';
        this.returnType = type || 'any';
        returns.push({
          description: res.description,
          type: type || 'any',
          arg: 'data',
          root: true,
        });
      } else if (res.schema && res.schema.type === 'array' &&
        res.schema.items &&
        res.schema.items.$ref) {
        /**
         * schema:
         *   type: array
         *   items:
         *     $ref: '#/definitions/Organization'
         */
        modelName = this.resolveTypeRef(res.schema.items.$ref);
        model = this.models[modelName];
        type = model ? modelName : 'Object';
        this.returnType = [type];
        returns.push({
          description: res.description,
          type: [type],
          arg: 'data',
          root: true,
        });
      }
    } else {
      this.errorTypes.push({
        statusCode: code,
        message: res.description,
      });
    }
  }
  this.returns = returns;
  return this.returns;
};

var VERBS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

/**
 * Derive the prefix from the base path
 * @param spec {Object} The Swagger spec object
 * @returns {String} Path prefix
 */
function getPathPrefix(spec) {
  var basePath = spec.basePath;
  if (!basePath) return '';
  var prefix = basePath.split('/').filter(function(p) {
    return p !== '' && p !== '*';
  }).slice(1).join('/'); // The first part will be ignored
  if (!prefix) return '';
  else return '/' + prefix;
}

/**
 * Build a map of operations for the given Swagger spec
 * @param spec {Object} The Swagger spec object
 * @returns {Object} A map of operations keyed by path
 */
V2Generator.prototype.getOperations = function(spec) {
  assert(spec && spec.swagger === '2.0');
  // var info = spec.info;
  var prefix = getPathPrefix(spec);
  var models = spec.definitions;

  var operations = {};
  var templates = spec['x-implementation-templates'] || {};

  for (var path in spec.paths) {
    if (path.indexOf('x-') === 0) continue;
    var ops = spec.paths[path];
    /* eslint-disable one-var */
    for (var verb in ops) {
      // Skip non-verbs such as parameters or x-, $ref
      if (VERBS.indexOf(verb.toLowerCase()) === -1) continue;
      var op = ops[verb];

      if (!op.parameters) {
        op.parameters = [];
      }

      op.tags = op.tags || [];

      op.models = models;

      op.verb = verb.toLowerCase();
      // Replace {id} with :id
      op.path = path.replace(/{(([^{}])+)}/g, ':$1');

      // operationId is optional
      if (!op.operationId) {
        // Derive the operationId from verb & path
        op.operationId = op.verb.toLowerCase() + '_' + op.path;
      }

      // Camelize the operation id
      op.operationId = op.operationId.replace(/{(([^{}])+)}/g, '_$1');

      // Capture the short name
      op.name = op['x-operation-name'] || op.operationId;

      if (op.tags.length === 1) {
        var tag = op.tags[0].toLowerCase();
        // Remove prefix that matches the tag name
        if (op.name.toLowerCase().indexOf(tag) === 0) {
          op.name = op.name.substring(tag.length);
        }
        if (op.path.toLowerCase() === ('/' + tag) ||
          op.path.toLowerCase().indexOf('/' + tag + '/') === 0) {
          // Remove prefix for the path
          op.path = op.path.substring(tag.length + 1);
        }
      }

      var index = op.name.indexOf('.');
      if (index !== -1) {
        op.name = op.name.substring(index + 1);
        if (op.name.indexOf('prototype.') === 0) {
          op.name = 'prototype.' + _.camelCase(op.name.substring(10));
        } else {
          op.name = _.camelCase(op.name);
        }
      } else {
        op.name = _.camelCase(op.name);
      }

      op.operationId = _.camelCase(op.operationId);
      var implTemplate = op['x-implementation'] ||
        op['x-implementation-template'];

      if (implTemplate) {
        var template = implTemplate.template;
        if (template && template.$ref &&
          template.$ref.indexOf('#/x-implementation-templates/') === 0) {
          // The template is a ref to the global templates
          var templateName =
            template.$ref.substring('#/x-implementation-templates/'.length);
          if (templates[templateName]) {
            var templateStr = templates[templateName];
            if (templateStr.loopback) {
              // If there is a specific template for LoopBack, use it
              templateStr = templateStr.loopback;
            }
            if (Array.isArray(templateStr)) {
              // Allow the template to be string[]
              templateStr = templateStr.join('\n');
            }
            if (typeof templateStr === 'string') {
              var compiled = _.template(templateStr);
              op.implementation = compiled(implTemplate.parameters || {});
            }
          }
        } else {
          if (implTemplate.loopback) {
            // If there is a specific template for LoopBack, use it
            implTemplate = implTemplate.loopback;
          }
          // The template is code, either as string[] or string
          if (Array.isArray(implTemplate)) {
            implTemplate = implTemplate.join('\n');
            op.implementation = implTemplate;
          } else if (typeof implTemplate === 'string') {
            op.implementation = implTemplate;
          }
        }
      }

      var operation = new V2Operation(op);
      operation.getRemoting();

      // Append the prefix
      operation.path = prefix + operation.path;

      operations[operation.path] = operations[operation.path] || {};
      operations[operation.path][operation.verb] = operation;
    }
    /* eslint-enable one-var */
  }
  return operations;
};

module.exports = V2Generator;

