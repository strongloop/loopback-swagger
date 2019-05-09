// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var expect = require('chai').expect;
var V2Generator = require('../../lib/codegen/generator-v2');
var generateModels = require('../../index').generateModels;

var petStoreV2Spec = require('../../example/pet-store-2.0.json');
var pet2 = require('./pet-expanded.json');
var pet3 = require('./pet-without-tags.json');
var pet4 = require('./pet-with-embedded-schema.json');
var note = require('./note.json');
var pet5 = require('./pet-with-refs.json');
var pet6 = require('./pet-with-special-names.json');
var generator = new V2Generator();

describe('Swagger spec v2 generator', function() {
  it('generates remote methods', function() {
    var code = generator.generateRemoteMethods(petStoreV2Spec,
      {modelName: 'Store'});
    expect(code.store).to.be.a('string');
  });

  it('generates remote methods without tags', function() {
    generator.mapTagsToModels(pet3);
    var models = generateModels(pet3);
    expect(models.SwaggerModel).to.be.a('object');
    var code = generator.generateRemoteMethods(pet3);
    expect(code.SwaggerModel).to.be.a('string');
    expect(Object.keys(code)).to.eql(['SwaggerModel']);
  });

  it('generates remote methods with special names', function() {
    generator.mapTagsToModels(pet6);
    var models = generateModels(pet6);
    expect(models.Pet_Controller).to.be.a('object');
    var code = generator.generateRemoteMethods(pet6);
    expect(code.Pet_Controller).to.be.a('string');
    var petController = code.Pet_Controller;
    expect(petController).to.contain(
      'Pet_Controller.petFindPets = function(tags, x_limit, callback) {'
    );
    expect(petController).to.contain(
      'Pet.find({limit: x_limit, where: {inq: tags}}, callback);'
    );
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

  it('parse operations with $REF', function() {
    var operations = generator.getOperations(pet5);
    expect(operations['/pet-app/pets'].get.returns).to.eql(
      [{
        description: 'pet response',
        type: ['pet'],
        arg: 'data',
        root: true,
      }]
    );
  });

  it('generates remote methods from expanded spec', function() {
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
      'Pet.find({limit: limit, where: {inq: tags}}, callback);'
    );
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

  it('generates remote methods without definitions', function() {
    var code = generator.generateRemoteMethods(pet4,
      {modelName: 'Pet'});
    expect(code.Pet).contain(
      'Pet.findPets = function(x_tags, x_limit, callback)'
    );
  });

  it('generates embedded models', function() {
    var code = generator.generateRemoteMethods(pet4);
    expect(pet4.definitions).to.eql({
      'findPets_response_200': {
        name: 'findPets_response_200',
        properties: {
          id: {
            type: 'number', required: true, format: 'int64',
          },
          name: {
            type: 'string', required: true,
          },
        },
      },
    });
  });
});
