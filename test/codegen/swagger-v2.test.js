// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var expect = require('chai').expect;
var V2Generator = require('../../lib/codegen/generator-v2');

var petStoreV2Spec = require('../../example/pet-store-2.0.json');
var pet2 = require('./pet-expanded.json');
var pet3 = require('./pet-without-tags.json');
var note = require('./note.json');
var generator = new V2Generator();

describe('Swagger spec v2 generator', function() {
  it('generates remote methods', function() {
    var code = generator.generateRemoteMethods(petStoreV2Spec,
      {modelName: 'Store'});
    expect(code.store).to.be.a('string');
  });

  it('generates remote methods without tags', function() {
    generator.mapTagsToModels(pet3);
    var models = require('../../index').generateModels(pet3);
    expect(models.SwaggerModel).to.be.a('object');
    var code = generator.generateRemoteMethods(pet3);
    expect(code.SwaggerModel).to.be.a('string');
    expect(Object.keys(code)).to.eql(['SwaggerModel']);
  });

  it('parse operations', function() {
    var operations = generator.getOperations(pet2);
    expect(operations['/pet-app/pets'].get.returns).to.eql(
      [{
        description: 'pet response',
        type: ['pet'],
        arg: 'data',
        root: true,
      }]
    );
  });

  it('generates remote methods', function() {
    var code = generator.generateRemoteMethods(pet2,
      {modelName: 'Pet'}).Pet;
    expect(code).contain('Pet.findPets = function(tags, limit, callback)');
    expect(code).contain('Pet.remoteMethod(\'findPets\'');
    expect(code).contain('Pet.findPetByIdId = function(id, callback)');
    expect(code).contain('Pet.remoteMethod(\'findPetByIdId\'');
    expect(code).contain('Pet.deletePet = function(id, callback)');
    expect(code).contain('Pet.remoteMethod(\'deletePet\'');
    expect(code).contain('Pet.createPet = function(pet, callback)');
    expect(code).contain('Pet.remoteMethod(\'createPet\'');
    expect(code).contain('type: [ \'pet\' ],');
    expect(code).contain(
      'Pet.find({limit: limit, where: {inq: tags}}, callback);');
    expect(code).contain('Pet.create(pet, callback);');
    expect(code).contain('Pet.findById(id, callback);');
  });

  it('generates remote methods with tags', function() {
    var code = generator.generateRemoteMethods(note, {});
    expect(Object.keys(code)).eql(['User', 'Note']);
  });

  it('transform operations', function() {
    var operations = generator.getOperations(petStoreV2Spec);
    expect(operations).to.have.property('/createWithList');
    expect(operations['/createWithList']).to.have.property('post');
    var op = operations['/createWithList']['post'];
    expect(op.operationId).to.eql('createUsersWithListInput');
  });
});
