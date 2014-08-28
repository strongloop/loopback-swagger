var assert = require('assert');
var util = require('util');
var base = require('./generator-base');

function V12Generator(options) {
  base.BaseGenerator.apply(this, arguments);
}

util.inherits(V12Generator, base.BaseGenerator);

function V12Operation(op) {
  base.BaseOperation.apply(this, arguments);
}

util.inherits(V12Operation, base.BaseOperation);

/**
 * Convert a swagger parameter to strong-remoting argument
 * @param {Object} p
 * @returns {Object}
 */
V12Operation.prototype.parameter = function(p) {
  var type = p.type;
  if (p.type === 'integer') {
    type = 'number';
  }
  return {
    arg: p.name,
    type: type,
    description: p.description,
    required: p.required,
    http: {
      source: p.paramType
    }
  };
};

V12Operation.prototype.getReturns = function() {
  if (this.returns) {
    return this.returns;
  }
  var returns = [
  ];

  if (this.type === 'integer') {
    this.type = 'number';
  }
  if (this.type && this.type !== 'void') {
    returns.push({
      description: this.description,
      type: this.type
    });
  }
  this.errorTypes = [];
  this.returnType = this.type || 'Object';
  if (this.responseMessages) {
    for (var i = 0, n = this.responseMessages.length; i < n; i++) {
      var res = this.responseMessages[i];

      this.errorTypes.push({
        statusCode: res.code,
        message: res.message
      });
    }
  }
  this.returns = returns;
  return this.returns;
};

V12Generator.prototype.getOperations = function(spec) {
  assert(spec && spec.swaggerVersion === '1.2');
// var resourcePath = spec.resourcePath;
// var basePath = spec.basePath;
  var models = spec.models;

  var operations = {};
  for (var i = 0, n = spec.apis.length; i < n; i++) {
    var api = spec.apis[i];
    var path = api.path;

    for (var j = 0, k = api.operations.length; j < k; j++) {
      var op = api.operations[j];

      if (!op.parameters) {
        op.parameters = [];
      }

      op.consumes = op.consumes || spec.consumes;
      op.produces = op.produces || spec.produces;

      op.operationId = op.nickname;
      op.models = models;

      // Replace {id} with :id
      op.path = path.replace(/{(([^{}])+)}/g, ':$1');
      op.verb = op.method && op.method.toLowerCase();

      var operation = new V12Operation(op);
      operation.getRemoting();

      operations[operation.method + ' ' + operation.path] = operation;
    }
  }
  return operations;
};

module.exports = V12Generator;


