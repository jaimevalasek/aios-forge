'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pkg = require('../package.json');

test('package exposes both aios and aios-forge CLI bins', () => {
  assert.equal(pkg.bin.aios, 'bin/aios-forge.js');
  assert.equal(pkg.bin['aios-forge'], 'bin/aios-forge.js');
});
