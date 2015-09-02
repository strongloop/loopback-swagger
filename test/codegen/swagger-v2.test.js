var expect = require('chai').expect;
var V2Generator = require('../../lib/codegen/generator-v2');

var petStoreV2Spec = require('../../example/pet-store-2.0.json');
var generator = new V2Generator();

describe('Swagger spec v2 generator', function() {

  it('generates remote methods', function() {
    var code = generator.generateRemoteMethods(petStoreV2Spec,
      {modelName: 'Store'});
    expect(code).to.be.string;
  });

  it('transform operations', function() {
    var operations = generator.getOperations(petStoreV2Spec);
    expect(operations).to.have.property('/user/createWithList');
    expect(operations['/user/createWithList']).to.have.property('post');
    var op = operations['/user/createWithList']['post'];
    expect(op.operationId).to.eql('createUsersWithListInput');
  });

});
