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
    expect(models).have.property('pet');
    expect(models).have.property('newPet');
    expect(models).have.property('errorModel');
    expect(models.pet.properties.tags.type).to.eql(['string']);
    expect(models.petGroup.relations.pets.type).to.eql('hasMany');
    expect(models.petGroup.relations.pets.model).to.eql('pet');
    expect(models.newPet).have.property('base', 'pet');
    expect(models.newPet.properties).have.property('kind');
  });
});
