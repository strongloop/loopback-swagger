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

BaseOperation.prototype.getReturns = function() {
  if (this.returns) {
    return this.returns;
  }
  var returns = [];
  this.errorTypes = [];
  this.returnType = 'Object';
  for (var code in this.responses) {
    var res = this.responses[code];
    if (code.match(/^2\d\d$/) || code === 'default') {
      if (res.schema && res.schema.$ref && res.schema.$ref.indexOf('#/definitions/') === 0) {
        var modelName = res.schema.$ref.substring('#/definitions/'.length);
        var model = this.models[modelName];
        var type = model ? modelName : 'Object';
        this.returnType = type;
        returns.push({
          description: res.description,
          type: type,
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

BaseOperation.prototype.getRemoting = function() {
  if (this.remoting) {
    return this.remoting;
  }
  var remoting = {isStatic: true};
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

BaseGenerator.prototype.generateRemoteMethods = function(spec, options) {
  options = options || {};

  var operations = this.getOperations(spec);
  var operationList = [];
  /* eslint-disable one-var */
  for (var path in operations) {
    for (var verb in operations[path]) {
      var op = operations[path][verb];
      operationList.push(op);
    }
  }
  /* eslint-enable one-var */
  var code = this.generateCodeForOperations(options.modelName,
    operationList);
  return code;
};

BaseGenerator.prototype.generateCodeForOperations =
  function(modelName, operations) {
    var code = ejs.render(template,
    {modelName: modelName || 'SwaggerModel', operations: operations});
    return code;
  };

