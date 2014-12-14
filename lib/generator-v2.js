var assert = require('assert');
var util = require('util');
var base = require('./generator-base');
var _s = require('underscore.string');

function V2Generator(options) {
  base.BaseGenerator.apply(this, arguments);
}

util.inherits(V2Generator, base.BaseGenerator);

function V2Operation(op) {
  base.BaseOperation.apply(this, arguments);
}

util.inherits(V2Operation, base.BaseOperation);

V2Operation.prototype.resolveTypeRef = function (ref) {
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
V2Operation.prototype.parameter = function (p) {
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
  this.returnType = 'any';
  for (var code in this.responses) {
    var res = this.responses[code];
    if (code.match(/^2\d\d$/) || code === 'default') {
      if (res.schema && res.schema.$ref) {
        var modelName = this.resolveTypeRef(res.schema.$ref);
        var model = this.models[modelName];
        var type = model ? modelName : 'Object';
        this.returnType = type || 'any';
        returns.push({
          description: res.description,
          type: type || 'any',
          arg: 'data',
          root: true
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

V2Generator.prototype.getOperations = function (spec) {
  assert(spec && spec.swagger === '2.0');
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

      op.verb = verb.toLowerCase();
      // Replace {id} with :id
      op.path = path.replace(/{(([^{}])+)}/g, ':$1');

      // operationId is optional
      if (!op.operationId) {
        // Derive the operationId from verb & path
        op.operationId = op.verb.toLowerCase() + '_' + op.path;
      }

      // Camelize the operation id
      op.operationId = _s.camelize(op.operationId.split(/[\s\/-:]+/).join('_'));

      var operation = new V2Operation(op);
      operation.getRemoting();

      operations[operation.path] = operations[operation.path] || {};
      operations[operation.path][operation.verb] = operation;
    }
  }
  return operations;
};

module.exports = V2Generator;


