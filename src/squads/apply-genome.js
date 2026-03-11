'use strict';

const { normalizeGenomeBindings } = require('../genomes/bindings');
const { applyGenomeBindingsToSquad } = require('./genome-binding-service');

async function applyGenomeToExistingSquad({ projectRoot, squadSlug, squad = [], executors = {} }) {
  const genomeBindings = normalizeGenomeBindings({
    squad,
    executors
  });

  return applyGenomeBindingsToSquad({
    projectRoot,
    squadSlug,
    genomeBindings
  });
}

module.exports = {
  applyGenomeToExistingSquad
};
