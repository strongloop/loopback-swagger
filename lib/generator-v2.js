var assert = require('assert');
var util = require('util');
var base = require('./generator-base');

function V2Generator(options) {
  base.BaseGenerator.apply(this, arguments);
}

util.inherits(V2Generator, base.BaseGenerator);

function V2Operation(op) {
  base.BaseOperation.apply(this, arguments);
}

util.inherits(V2Operation, base.BaseOperation);

/**
 * Convert a swagger parameter to strong-remoting argument
 * @param {Object} p
 * @returns {Object}
 */
V2Operation.prototype.parameter = function (p) {
  var type = p.type;
  if (p.type === 'integer') {
    type = 'number';
  }
  if (p.schema && p.schema.$ref && p.schema.$ref.indexOf('#/definitions/') === 0) {
    var modelName = p.schema.$ref.substring('#/definitions/'.length);
    var model = this.models[modelName];
    type = model ? modelName : 'string';
    p.type = type;
  }
  return {
    arg: p.name,
    type: type,
    description: p.description,
    required: p.required,
    http: {
      source: p.in
    }
  };
};

V2Operation.prototype.getReturns = function () {
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
          type: type
        });
      }
    } else {
      this.errorTypes.push({
        statusCode: code,
        message: res.description
      });
    }
  }
  this.returns = returns;
  return this.returns;
};

V2Generator.prototype.getOperations = function(spec) {
  assert(spec && spec.swagger === 2);
  // var info = spec.info;
  // var basePath = spec.basePath;
  var models = spec.definitions;

  var operations = {};

  for (var path in spec.paths) {
    var ops = spec.paths[path];
    for (var verb in ops) {
      var op = ops[verb];

      if (!op.parameters) {
        op.parameters = [];
      }

      op.models = models;

      op.verb = verb;
      // Replace {id} with :id
      op.path = path.replace(/{(([^{}])+)}/g, ':$1');

      var operation = new V2Operation(op);
      operation.getRemoting();

      operations[operation.method + ' ' + operation.path] = operation;
    }
  }
  return operations;
};

module.exports = V2Generator;


