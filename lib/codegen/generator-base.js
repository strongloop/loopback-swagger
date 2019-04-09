// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var ejs = require('ejs');
var util = require('util');
var _cloneDeep = require('lodash').cloneDeep;

var template = require('./model-template');

function normalizeName(name) {
  return name.replace(/[\-\.\s]/g, '_');
}

function BaseGenerator(options) {
  this.options = options || {};
}

function BaseOperation(op) {
  var copy = _cloneDeep(op || {});
  for (var p in copy) {
    this[p] = copy[p];
  }
  this.models = op.models;
}

/**
 * Build parameters
 * @returns {Array|*}
 */
BaseOperation.prototype.getAccepts = function() {
  if (this.accepts) {
    return this.accepts;
  }
  var accepts = this.parameters.map(this.parameter.bind(this));
  this.accepts = accepts;
  return this.accepts;
};

/**
 * Build remoting metadata
 * @returns {{isStatic: boolean}|*}
 */
BaseOperation.prototype.getRemoting = function() {
  if (this.remoting) {
    return this.remoting;
  }
  var isStatic = this.isStatic === undefined ? true : !!this.isStatic;
  var remoting = {isStatic: isStatic};
  if (this.consumes) {
    remoting.consumes = this.consumes;
  }
  if (this.produces) {
    remoting.produces = this.produces;
  }
  remoting.accepts = this.getAccepts();
  remoting.returns = this.getReturns();
  remoting.http = {
    verb: this.verb,
    path: this.path,
  };
  remoting.description = this.description;
  this.remoting = remoting;
  return this.remoting;
};

BaseOperation.prototype.printRemoting = function() {
  return util.inspect(this.getRemoting(), {depth: null});
};

exports.BaseOperation = BaseOperation;
exports.BaseGenerator = BaseGenerator;

function getDefaultModelName(options) {
  options = options || {};
  return options.modelName || 'SwaggerModel';
}

/**
 * Map tags to special models as controllers for REST APIs. The spec object
 * will be mutated for operation.tags and root-level tags.
 *
 * @param spec {Object} The Swagger spec
 * @param options {Object} Options
 */
BaseGenerator.prototype.mapTagsToModels = function(spec, options) {
  options = options || {};
  var defaultModelName = getDefaultModelName(options);
  var operations = this.getOperations(spec);
  var definitions = spec.definitions || spec.models;

  function mapTag(tag) {
    var modelName = normalizeName(tag);
    if (!definitions[modelName]) {
      // Add a controller to definitions so that it will be generated
      // as a model
      definitions[modelName] = {
        type: 'object',
        name: modelName,
        'x-base-type': 'Model',
        properties: {},
      };
    }
    // Add tags to spec top level
    spec.tags = spec.tags || [];
    var found = false;
    for (var i = 0, n = spec.tags.length; i < n; i++) {
      if (spec.tags[i].name === tag) {
        found = true;
        break;
      }
    }
    if (!found) {
      spec.tags.push({name: tag});
    }
  }

  /* eslint-disable one-var */
  for (var path in operations) {
    for (var verb in operations[path]) {
      var op = operations[path][verb];
      if (!Array.isArray(op.tags) || op.tags.length === 0) {
        // Default to the SwaggerModel controller
        op.tags = [defaultModelName];
      }
      op.tags.forEach(mapTag);
    }
  }
};

/**
 * Generate remote methods for a Swagger spec
 * @param spec {Object} The swagger spec object
 * @param options {Object} Options
 * @returns An object keyed by model names, with each value as a string for
 * the generated code
 */
BaseGenerator.prototype.generateRemoteMethods = function(spec, options) {
  options = options || {};
  spec.definitions = spec.definitions || {};
  var modelName = getDefaultModelName(options);
  var operations = this.getOperations(spec);

  // Operations by Tag
  var operationList = {};

  function mapTag(tag) {
    var modelName = normalizeName(tag);
    var ops = operationList[modelName];
    if (!ops) {
      ops = operationList[modelName] = [];
    }
    var copy = _cloneDeep(op);
    copy.models = op.models; // Keep the same ref to models
    copy.operationId = op.name;
    if (op.name && op.name.indexOf('prototype.') === 0) {
      copy.isStatic = false;
      copy.accepts = copy.accepts.filter(function(a) {
        return a.arg !== 'id';
      });
      delete copy.remoting;
    }
    ops.push(copy);
  }

  /* eslint-disable one-var */
  for (var path in operations) {
    for (var verb in operations[path]) {
      var op = operations[path][verb];
      if (!Array.isArray(op.tags) || op.tags.length === 0) {
        op.tags = [modelName];
      }
      op.tags.forEach(mapTag);
    }
  }
  /* eslint-enable one-var */
  var code = this.generateCodeForOperations(operationList, options);
  return code;
};

/**
 * Generate code for operations
 * @param operations {Object} modelName ==> an array of operations for the given
 * model
 * @param options {Object} Options
 * @returns An object keyed by model names, with each value as a string for
 * the generated code
 */
BaseGenerator.prototype.generateCodeForOperations =
  function(operations, options) {
    var modelName = getDefaultModelName(options);
    var codeMap = {};
    for (var m in operations) {
      var code = ejs.render(template, {
        modelName: m || modelName,
        operations: operations[m],
      });
      codeMap[m] = code;
    }
    return codeMap;
  };

