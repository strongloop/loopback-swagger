// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var expect = require('chai').expect;
var V12Generator = require('../../lib/codegen/generator-v1.2.js');

function generate(spec, options) {
  var generator = new V12Generator();
  return generator.generateRemoteMethods(spec, options);
}

describe('Swagger spec v1.2 generator', function() {
  it('generates remote methods', function() {
    var petStoreV12Spec = require('../../example/pet-store-1.2.json');
    var code = generate(petStoreV12Spec, {modelName: 'Store'});
    expect(code.Store).to.be.a('string');
  });
});

