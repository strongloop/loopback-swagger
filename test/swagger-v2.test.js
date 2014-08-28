var expect = require('chai').expect;
var V2Generator = require('../lib/generator-v2');

function generate(spec, options) {
  var generator = new V2Generator();
  return generator.generateRemoteMethods(spec, options);
}

describe('Swagger spec v2 generator', function() {

  it('generates remote methods', function() {
    var petStoreV2Spec = require('../example/pet-store-2.0.json');
    var code = generate(petStoreV2Spec, {modelName: 'Store'});
    expect(code).to.be.string;
  });

});
