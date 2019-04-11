// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback-swagger
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

/* global describe, it */
var schemaParser = require('../../lib/codegen/json-schema');
var spec = require('./pet-expanded.json');
var expect = require('chai').expect;

describe('json schema converter', function() {
  it('should handle allOf', function() {
    var models = schemaParser(spec.definitions);
    expect(models).have.property('Pet');
    expect(models).have.property('NewPet');
    expect(models).have.property('ErrorModel');
    expect(models.Pet.properties.tags.type).to.eql(['string']);
    expect(models.PetGroup.relations.pets.type).to.eql('hasMany');
    expect(models.PetGroup.relations.pets.model).to.eql('pet');
    expect(models.NewPet).have.property('base', 'Pet');
    expect(models.NewPet.properties).have.property('kind');
  });
});
