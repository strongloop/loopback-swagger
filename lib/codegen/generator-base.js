// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var ejs = require('ejs');
var util = require('util');
var _cloneDeep = require('lodash').cloneDeep;

var template = require('./model-template');

function BaseGenerator(options) {
  this.options = options || {};
}

function BaseOperation(op) {
  var copy = _cloneDeep(op || {});
  for (var p in copy) {
    this[p] = copy[p];
  }
}

BaseOperation.prototype.getAccepts = function() {
  if (this.accepts) {
    return this.accepts;
  }
  var accepts = this.parameters.map(this.parameter.bind(this));
  this.accepts = accepts;
  return this.accepts;
};

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

BaseGenerator.prototype.mapTagsToModels = function(spec) {
  var operations = this.getOperations(spec);

  function mapTag(tag) {
    if (!spec.definitions[tag]) {
      spec.definitions[tag] = {
        type: 'object',
        name: tag,
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
      if (Array.isArray(op.tags)) {
        op.tags.forEach(mapTag);
      } else {
        op.tags = ['SwaggerModel'];
      }
    }
  }
};

BaseGenerator.prototype.generateRemoteMethods = function(spec, options) {
  options = options || {};
  var modelName = options.modelName || 'SwaggerModel';
  var operations = this.getOperations(spec);

  // Operations by Tag
  var operationList = {};

  function mapTag(tag) {
    var ops = operationList[tag];
    if (!ops) {
      ops = operationList[tag] = [];
    }
    var copy = _cloneDeep(op);
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
  var code = this.generateCodeForOperations(operationList);
  return code;
};

BaseGenerator.prototype.generateCodeForOperations =
  function(operations) {
    var codeMap = {};
    for (var m in operations) {
      var code = ejs.render(template, {
        modelName: m || 'SwaggerModel',
        operations: operations[m],
      });
      codeMap[m] = code;
    }
    return codeMap;
  };

