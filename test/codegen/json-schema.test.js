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
    expect(models.petGroup.properties.pets.type).to.eql(['pet']);
    expect(models.newPet).have.property('base', 'pet');
    expect(models.newPet.properties).have.property('kind');
  });
});
