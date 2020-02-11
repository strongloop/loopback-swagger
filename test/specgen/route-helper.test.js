// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var routeHelper = require('../../lib/specgen/route-helper');
var TypeRegistry = require('../../lib/specgen/type-registry');
var expect = require('chai').expect;
var _defaults = require('lodash').defaults;
var loopback = require('loopback');

describe('route-helper', function() {
  it('returns "object" when a route has multiple return values', function() {
    const TestModel = loopback.createModel('TestModel', {street: String});
    const remotingSpec = {
      returns: [
        {arg: 'max', type: 'number'},
        {arg: 'min', type: 'number'},
        {name: 'avg', type: 'number'},
        {name: 'str', type: String},
        {name: 'strArray', type: [String]},
        {name: 'testModel', type: TestModel},
        {name: 'testModelStr', type: 'TestModel'},
        {name: 'testModelArray', type: [TestModel]},
        {name: 'testModelArrayArray', type: [[TestModel]]},
        {name: 'unknownModel', type: 'UnknownModel'},
        {name: 'requiredStr', type: String, required: true},
      ],
    };
    const typeRegistry = new TypeRegistry();
    typeRegistry.registerLoopbackType(TestModel.definition.name, TestModel.definition);
    const entry = createAPIDoc(remotingSpec, null, typeRegistry);
    const responseMessage = getResponseMessage(entry.operation);
    (((responseMessage || {}).schema || {}).required || []).sort(); // sort the array for the comparison below
    expect(responseMessage)
      .to.have.property('schema').eql({
        type: 'object',
        properties: {
          max: {type: 'number', format: 'double'},
          min: {type: 'number', format: 'double'},
          avg: {type: 'number', format: 'double'},
          str: {type: 'string'},
          strArray: {
            items: {
              type: 'string',
            },
            type: 'array',
          },
          testModel: {
            $ref: '#/definitions/TestModel',
          },
          testModelArray: {
            items: {
              $ref: '#/definitions/TestModel',
            },
            type: 'array',
          },
          testModelArrayArray: {
            items: {
              items: {
                $ref: '#/definitions/TestModel',
              },
              type: 'array',
            },
            type: 'array',
          },
          testModelStr: {
            $ref: '#/definitions/TestModel',
          },
          unknownModel: {
            type: 'object', // unknown model is converted to plain object
          },
          requiredStr: {type: 'string'},
        },
        required: [
          'requiredStr',
        ],
      });
  });

  it('does not include arguments having http.target set to header|status', function() {
    var TestModel = loopback.createModel('TestModel', {street: String});
    var entry = createAPIDoc({
      returns: [
        {name: 'changes', type: 'ReadableStream'},
        {name: 'status', type: 'number', http: {target: 'status'}},
        {name: 'header', type: 'string', http: {target: 'header'}},
      ],
    });
    var responseMessage = getResponseMessage(entry.operation);
    expect(responseMessage)
      .to.have.property('schema').eql({
        type: 'file',
      });
  });

  it('does not produce required array if no required property is defined', function() {
    var TestModel = loopback.createModel('TestModel', {street: String});
    var entry = createAPIDoc({
      returns: [
        {arg: 'max', type: 'number'},
        {arg: 'min', type: 'number'},
      ],
    });
    var responseMessage = getResponseMessage(entry.operation);
    expect(responseMessage.schema).to.not.have.property('required');
  });

  it('converts { type: ReadableStream\' } to { schema: { type: \'file\' } }', function() {
    var TestModel = loopback.createModel('TestModel', {street: String});
    var entry = createAPIDoc({
      returns: [
        {name: 'changes', type: 'ReadableStream'},
      ],
    });
    var responseMessage = getResponseMessage(entry.operation);
    expect(responseMessage)
      .to.have.property('schema').eql({
        type: 'file',
      });
  });

  it('converts { type: file\' } to { schema: { type: \'file\' } }', function() {
    var TestModel = loopback.createModel('TestModel', {street: String});
    var entry = createAPIDoc({
      accepts: [
        {name: 'changes', type: 'file'},
      ],
    });
    var paramDoc = entry.operation.parameters[0];
    expect(paramDoc).to.have.property('type', 'file');
    expect(paramDoc).to.have.property('in', 'formData');
    expect(paramDoc).to.have.property('allowMultiple', false);
    expect(paramDoc).to.have.property('description', 'File to upload');
  });

  it('converts path params when they exist in the route name', function() {
    var entry = createAPIDoc({
      accepts: [
        {arg: 'id', type: 'string'},
      ],
      path: '/test/:id',
    });
    var paramDoc = entry.operation.parameters[0];
    expect(paramDoc).to.have.property('in', 'path');
    expect(paramDoc).to.have.property('name', 'id');
    expect(paramDoc).to.have.property('required', true);
  });

  it('sets required to be true for path params', function() {
    var entry = createAPIDoc({
      accepts: [
        {arg: 'id', type: 'string', http: {source: 'path'}},
      ],
      path: '/test/:id',
    });
    var paramDoc = entry.operation.parameters[0];
    expect(paramDoc).to.have.property('in', 'path');
    expect(paramDoc).to.have.property('name', 'id');
    expect(paramDoc).to.have.property('required', true);
  });

  // FIXME need regex in routeHelper.acceptToParameter
  xit('won\'t convert path params when they don\'t exist in the route name', function() {
    var doc = createAPIDoc({
      accepts: [
        {arg: 'id', type: 'string'},
      ],
      path: '/test/:identifier',
    });
    var paramDoc = doc.operation.parameters[0];
    expect(paramDoc.in).to.equal('query');
  });

  it('correctly coerces param types', function() {
    var doc = createAPIDoc({
      accepts: [
        {arg: 'binaryData', type: 'buffer'},
      ],
    });
    var paramDoc = doc.operation.parameters[0];
    expect(paramDoc).to.have.property('in', 'query');
    expect(paramDoc).to.have.property('type', 'string');
    expect(paramDoc).to.have.property('format', 'byte');
  });

  it('correctly removes undocumented accepts', function() {
    var doc = createAPIDoc({
      accepts: [
        {arg: 'id', type: 'string'},
        {arg: 'undocumented', type: 'string', documented: false},
      ],
    });
    expect(doc.operation.parameters.length).to.equal(1);
    var paramDoc = doc.operation.parameters[0];
    expect(paramDoc).to.have.property('in', 'query');
    expect(paramDoc).to.have.property('type', 'string');
    expect(paramDoc).to.have.property('name', 'id');
  });

  it('correctly converts root return types (arrays)', function() {
    var doc = createAPIDoc({
      returns: [
        {arg: 'data', type: ['customType'], root: true},
      ],
    });
    var opDoc = doc.operation;

    var responseSchema = getResponseMessage(opDoc).schema;
    expect(responseSchema).to.have.property('type', 'array');
    expect(responseSchema).to.have.property('items')
      .eql({$ref: '#/definitions/customType'});
  });

  it('correctly converts non root return types (arrays)', function() {
    const doc = createAPIDoc({
      returns: [
        {arg: 'data', type: ['customType']},
      ],
    });
    const opDoc = doc.operation;

    const responseSchema = getResponseMessage(opDoc).schema;
    expect(responseSchema)
      .to.eql({
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      });
  });

  it('correctly converts registered non root return types', function() {
    const customType = loopback.createModel('customType', {foo: String});
    const typeRegistry = new TypeRegistry();
    typeRegistry.registerLoopbackType(customType.definition.name, customType.definition);
    const remotingSpec = {
      returns: [
        {
          arg: 'data',
          type: ['customType'],
        },
      ],
    };
    const doc = createAPIDoc(remotingSpec, null, typeRegistry);
    const opDoc = doc.operation;

    const responseSchema = getResponseMessage(opDoc).schema;
    expect(responseSchema)
      .to.eql({
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/definitions/customType',
            },
          },
        },
      });
  });

  it('correctly converts return types (format)', function() {
    var doc = createAPIDoc({
      returns: [
        {arg: 'data', type: 'buffer', root: true},
      ],
    });

    var responseSchema = getResponseMessage(doc.operation).schema;
    expect(responseSchema.type).to.equal('string');
    expect(responseSchema.format).to.equal('byte');
  });

  it('includes `notes` metadata as `description`', function() {
    var doc = createAPIDoc({
      notes: 'some notes',
    });
    expect(doc.operation).to.have.property('description', 'some notes');
  });

  describe('#acceptToParameter', function() {
    var A_CLASS_DEF = {name: 'TestModelName'};

    it('returns fn converting description from array to string', function() {
      var f = routeHelper.acceptToParameter(
        {verb: 'get', path: 'path'},
        A_CLASS_DEF,
        new TypeRegistry()
      );
      var result = f({description: ['1', '2', '3']});
      expect(result.description).to.eql('1\n2\n3');
    });

    it('coerces `form` to `formData` when checking http settings', function() {
      var f = routeHelper.acceptToParameter(
        {verb: 'put', path: 'path'},
        A_CLASS_DEF,
        new TypeRegistry()
      );
      var result = f({http: {source: 'form'}});
      expect(result.in).to.equal('formData');
    });
  });

  describe('#routeToPathEntry', function() {
    it('converts route.description from array to string', function() {
      var result = routeHelper.routeToPathEntry({
        method: 'someMethod',
        verb: 'get',
        path: 'path',
        description: ['1', '2', '3'],
      }, null, new TypeRegistry(), Object.create(null));
      expect(result.operation.summary).to.eql('1\n2\n3');
    });

    it('converts route.notes from array of string to string', function() {
      var result = routeHelper.routeToPathEntry({
        method: 'someMethod',
        verb: 'get',
        path: 'path',
        notes: ['1', '2', '3'],
      }, null, new TypeRegistry(), Object.create(null));
      expect(result.operation.description).to.eql('1\n2\n3');
    });
  });

  it('includes `deprecated` metadata', function() {
    var doc = createAPIDoc({
      deprecated: 'true',
    });
    expect(doc.operation).to.have.property('deprecated', true);
  });

  it('joins array description/summary', function() {
    var doc = createAPIDoc({
      description: ['line1', 'line2'],
    });
    expect(doc.operation.summary).to.equal('line1\nline2');
  });

  it('joins array notes', function() {
    var doc = createAPIDoc({
      notes: ['line1', 'line2'],
    });
    expect(doc.operation.description).to.equal('line1\nline2');
  });

  it('joins array description/summary of an input arg', function() {
    var doc = createAPIDoc({
      accepts: [{name: 'arg', description: ['line1', 'line2']}],
    });
    expect(doc.operation.parameters[0].description).to.equal('line1\nline2');
  });

  it('correctly does not include context params', function() {
    var doc = createAPIDoc({
      accepts: [
        {arg: 'ctx', http: {source: 'context'}},
      ],
      path: '/test',
    });
    var params = doc.operation.parameters;
    expect(params.length).to.equal(0);
  });

  it('correctly does not include request params', function() {
    var doc = createAPIDoc({
      accepts: [
        {arg: 'req', http: {source: 'req'}},
      ],
      path: '/test',
    });
    var params = doc.operation.parameters;
    expect(params.length).to.equal(0);
  });

  it('correctly does not include response params', function() {
    var doc = createAPIDoc({
      accepts: [
        {arg: 'res', http: {source: 'res'}},
      ],
      path: '/test',
    });
    var params = doc.operation.parameters;
    expect(params.length).to.equal(0);
  });

  it('preserves `enum` accepts arg metadata', function() {
    var doc = createAPIDoc({
      accepts: [{name: 'arg', type: 'number', enum: [1, 2, 3]}],
    });
    expect(doc.operation.parameters[0])
      .to.have.property('enum').eql([1, 2, 3]);
  });

  it('includes the default response message with code 200', function() {
    var doc = createAPIDoc({
      returns: [{name: 'result', type: 'object', root: true}],
    });
    expect(doc.operation.responses).to.eql({
      200: {
        description: 'Request was successful',
        schema: {type: 'object'},
      },
    });
  });

  it('uses the response code 204 when `returns` is empty', function() {
    var doc = createAPIDoc({
      returns: [],
    });
    expect(doc.operation.responses).to.eql({
      204: {
        description: 'Request was successful',
        schema: undefined,
      },
    });
  });

  it('includes custom error response in `responseMessages`', function() {
    var doc = createAPIDoc({
      errors: [{
        code: 422,
        message: 'Validation failed',
        responseModel: 'ValidationError',
      }],
    });
    expect(doc.operation.responses).to.have.property(422).eql({
      description: 'Validation failed',
      schema: {$ref: '#/definitions/ValidationError'},
    });
  });

  it('allows setting null for `responseModel`', function() {
    var doc = createAPIDoc({
      errors: [{
        code: 422,
        message: 'Validation',
        responseModel: null,
      }],
    });
    expect(doc.schema).to.equal(undefined);
  });

  it('allows omitting the `responseModel`', function() {
    var doc = createAPIDoc({
      errors: [{
        code: 422,
        message: 'Validation',
      }],
    });
    expect(doc.schema).to.equal(undefined);
  });

  it('includes custom http status code and override default ' +
    'success code in `responseMessages`', function() {
    var doc = createAPIDoc({
      http: {
        status: 201,
      },
    });
    expect(doc.operation.responses).to.have.property(201).eql({
      description: 'Request was successful',
      schema: undefined,
    });
    expect(doc.operation.responses).to.not.have.property(200);
    expect(doc.operation.responses).to.not.have.property(204);
  });

  it('includes custom http errorStatus', function() {
    const doc = createAPIDoc({
      http: {
        status: 201,
        errorStatus: 404,
      },
    });

    const responses = doc.operation.responses;
    expect(Object.keys(responses)).to.eql(['201', '404']);
    expect(responses['404']).to.eql({
      description: 'Unknown error',
    });
  });

  it('does not include `undefined` error response in `responseMessages` when ' +
    'http is set, but erorrStatus is not set', function() {
    const doc = createAPIDoc({
      http: {
        status: 201,
      },
    });

    expect(Object.keys(doc.operation.responses)).to.eql(['201']);
  });

  it('supports example responses', function() {
    var doc = createAPIDoc({
      returns: [
        {arg: 'something', http: {source: 'body'}, example: {foo: 'bar'}},
      ],
      path: '/test',
    });
    expect(doc.operation.responses['200']).to.property('examples');
    expect(doc.operation.responses['200'].examples).to.have.property('application/json');
    expect(doc.operation.responses['200'].examples['application/json']).to.eql({foo: 'bar'});
  });

  it('includes custom http error status code in `responseMessages`', function() {
    var doc = createAPIDoc({
      http: {
        errorStatus: 508,
      },
    });
    expect(doc.operation.responses).to.have.property(508).eql({
      description: 'Unknown error',
    });
  });

  it('route operationId DOES include model name.', function() {
    var doc = createAPIDoc({method: 'User.login'});
    expect(doc.operation.operationId).to.equal('User.login');
  });

  it('adds class name to `tags`', function() {
    var doc = createAPIDoc(
      {method: 'User.login'},
      {name: 'User'}
    );
    expect(doc.operation.tags).to.contain('User');
  });

  it('converts non-primitive param types to JSON strings', function() {
    var doc = createAPIDoc({
      accepts: [{arg: 'filter', type: 'object', http: {source: 'query'}}],
    });
    var param = doc.operation.parameters[0];
    expect(param).to.have.property('type', 'string');
    expect(param).to.have.property('format', 'JSON');
  });

  it('converts single "data" body arg to Model type', function() {
    var doc = createAPIDoc(
      {
        accepts: [{arg: 'data', type: 'object', http: {source: 'body'}}],
      },
      {name: 'User'}
    );
    var param = doc.operation.parameters[0];
    expect(param)
      .to.have.property('schema')
      .eql({$ref: '#/definitions/User'});
  });

  it('supports `model` property', function() {
    var doc = createAPIDoc(
      {
        accepts: [{
          arg: 'result',
          type: 'object',
          model: 'User',
          http: {source: 'body'},
        }],
      },
      {name: 'User'}
    );
    var param = doc.operation.parameters[0];
    expect(param)
      .to.have.property('schema')
      .eql({$ref: '#/definitions/User'});
  });

  it('allows a custom `tag` name to be set', function() {
    var doc = createAPIDoc(
      {},
      {name: 'User', ctor: {settings: {swagger: {tag: {name: 'Member'}}}}}
    );
    expect(doc.operation.tags[0])
      .to.eql('Member');
  });
});

// Easy wrapper around createRoute
function createAPIDoc(def, classDef, typeRegistry) {
  if (!typeRegistry) typeRegistry = new TypeRegistry();

  return routeHelper.routeToPathEntry(_defaults(def || {}, {
    path: '/test',
    verb: 'GET',
    method: 'test.get',
  }), classDef, typeRegistry, Object.create(null));
}

function getResponseMessage(operationDoc) {
  return operationDoc.responses[200] || operationDoc.responses[204] ||
    operationDoc.responses.default;
}
