'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeProfile,
  parseServices,
  buildDeveloperProfile,
  recommendBeginnerProfile,
  buildTeamProfile
} = require('../src/onboarding');

test('normalizeProfile accepts numeric profile shortcuts', () => {
  assert.equal(normalizeProfile('1'), 'developer');
  assert.equal(normalizeProfile('2'), 'beginner');
  assert.equal(normalizeProfile('3'), 'team');
});

test('parseServices normalizes aliases and removes duplicates', () => {
  const parsed = parseServices('queues,redis,storage,s3,payments,stripe,search,algolia');
  assert.deepEqual(parsed, [
    'Queues (Redis/Horizon)',
    'Storage (S3-compatible)',
    'Payments',
    'Full-text Search'
  ]);
});

test('buildDeveloperProfile supports Laravel with Jetstream notes', () => {
  const profile = buildDeveloperProfile({
    backendChoice: '1',
    laravelVersion: '11',
    frontendChoice: '1',
    authChoice: '2',
    uiuxChoice: '2',
    databaseChoice: '1',
    servicesChoice: 'queues,storage,cache',
    teamsEnabled: true
  });

  assert.equal(profile.projectType, 'web_app');
  assert.equal(profile.framework, 'Laravel 11');
  assert.equal(profile.backend, 'Laravel');
  assert.equal(profile.auth, 'Jetstream + Livewire');
  assert.equal(profile.notes.some((note) => note.includes('Jetstream teams: enabled')), true);
  assert.equal(profile.services.includes('Cache (Redis)'), true);
});

test('recommendBeginnerProfile infers dapp recommendation from summary', () => {
  const profile = recommendBeginnerProfile({
    projectSummary: 'A wallet and NFT marketplace for creators',
    expectedUsers: '3',
    mobileRequirement: '2',
    hostingPreference: '3'
  });

  assert.equal(profile.profile, 'beginner');
  assert.equal(profile.projectType, 'dapp');
  assert.equal(profile.framework, 'Hardhat');
  assert.equal(profile.web3Enabled, true);
  assert.equal(profile.web3Networks, 'ethereum');
});

test('buildTeamProfile preserves explicit web3 stack and infers network', () => {
  const profile = buildTeamProfile({
    projectType: 'dapp',
    framework: 'Anchor',
    backend: 'Anchor',
    frontend: 'Next.js',
    database: 'PostgreSQL',
    services: 'payments,cache'
  });

  assert.equal(profile.profile, 'team');
  assert.equal(profile.projectType, 'dapp');
  assert.equal(profile.web3Enabled, true);
  assert.equal(profile.web3Networks, 'solana');
  assert.equal(profile.services.includes('Payments'), true);
});
