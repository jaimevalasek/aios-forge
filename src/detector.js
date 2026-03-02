'use strict';

const path = require('node:path');
const { exists, readTextIfExists } = require('./utils');

function safeJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function dependencyExists(pkg, names) {
  if (!pkg) return false;
  const sections = [
    pkg.require || {},
    pkg['require-dev'] || {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.peerDependencies || {},
    pkg.optionalDependencies || {}
  ];

  return sections.some((section) => names.some((name) => Object.prototype.hasOwnProperty.call(section, name)));
}

function includesToken(text, token) {
  if (!text) return false;
  return text.toLowerCase().includes(token.toLowerCase());
}

async function detectFramework(projectDir) {
  const checks = [];

  const packageJsonPath = path.join(projectDir, 'package.json');
  const composerJsonPath = path.join(projectDir, 'composer.json');
  const gemfilePath = path.join(projectDir, 'Gemfile');
  const requirementsPath = path.join(projectDir, 'requirements.txt');
  const pyprojectPath = path.join(projectDir, 'pyproject.toml');
  const cargoTomlPath = path.join(projectDir, 'Cargo.toml');

  const [packageText, composerText, gemfileText, requirementsText, pyprojectText, cargoTomlText] = await Promise.all([
    readTextIfExists(packageJsonPath),
    readTextIfExists(composerJsonPath),
    readTextIfExists(gemfilePath),
    readTextIfExists(requirementsPath),
    readTextIfExists(pyprojectPath),
    readTextIfExists(cargoTomlPath)
  ]);

  const packageJson = safeJsonParse(packageText || '');
  const composerJson = safeJsonParse(composerText || '');

  const hasArtisan = await exists(path.join(projectDir, 'artisan'));
  const hasLaravelComposer = dependencyExists(composerJson, ['laravel/framework']);
  if (hasArtisan || hasLaravelComposer) {
    checks.push({ framework: 'Laravel', installed: true, evidence: hasArtisan ? 'artisan' : 'composer.json:laravel/framework', confidence: 'high' });
  }

  const hasCodeIgniter4Spark = await exists(path.join(projectDir, 'spark'));
  const hasCodeIgniter4AppConfig = await exists(path.join(projectDir, 'app/Config/App.php'));
  const hasCodeIgniter4Composer = dependencyExists(composerJson, ['codeigniter4/framework']);
  if (hasCodeIgniter4Spark || hasCodeIgniter4AppConfig || hasCodeIgniter4Composer) {
    checks.push({
      framework: 'CodeIgniter 4',
      installed: true,
      evidence: hasCodeIgniter4Spark
        ? 'spark'
        : hasCodeIgniter4AppConfig
          ? 'app/Config/App.php'
          : 'composer.json:codeigniter4/framework',
      confidence: hasCodeIgniter4Spark || hasCodeIgniter4AppConfig ? 'high' : 'medium'
    });
  }

  const hasCodeIgniter3Core = await exists(path.join(projectDir, 'system/core/CodeIgniter.php'));
  const hasCodeIgniter3Config = await exists(path.join(projectDir, 'application/config/config.php'));
  if (hasCodeIgniter3Core || hasCodeIgniter3Config) {
    checks.push({
      framework: 'CodeIgniter 3',
      installed: true,
      evidence: hasCodeIgniter3Core ? 'system/core/CodeIgniter.php' : 'application/config/config.php',
      confidence: 'high'
    });
  }

  const hasSymfonyConsole = await exists(path.join(projectDir, 'bin/console'));
  const hasSymfonyComposer = dependencyExists(composerJson, ['symfony/framework-bundle']);
  if (hasSymfonyConsole || hasSymfonyComposer) {
    checks.push({ framework: 'Symfony', installed: true, evidence: hasSymfonyConsole ? 'bin/console' : 'composer.json:symfony/framework-bundle', confidence: 'high' });
  }

  const hasRailsApp = await exists(path.join(projectDir, 'config/application.rb'));
  const hasRailsGem = includesToken(gemfileText, 'gem "rails"') || includesToken(gemfileText, "gem 'rails'");
  if (hasRailsApp || hasRailsGem) {
    checks.push({ framework: 'Rails', installed: true, evidence: hasRailsApp ? 'config/application.rb' : 'Gemfile:rails', confidence: hasRailsApp ? 'high' : 'medium' });
  }

  const hasManagePy = await exists(path.join(projectDir, 'manage.py'));
  const hasDjangoReq = includesToken(requirementsText, 'django');
  const hasDjangoPyproject = includesToken(pyprojectText, 'django');
  if (hasManagePy || hasDjangoReq || hasDjangoPyproject) {
    checks.push({ framework: 'Django', installed: true, evidence: hasManagePy ? 'manage.py' : hasDjangoReq ? 'requirements.txt:django' : 'pyproject.toml:django', confidence: hasManagePy ? 'high' : 'medium' });
  }

  const hasHardhatConfig =
    (await exists(path.join(projectDir, 'hardhat.config.js'))) ||
    (await exists(path.join(projectDir, 'hardhat.config.ts')));
  const hasHardhatDep = dependencyExists(packageJson, ['hardhat']);
  if (hasHardhatConfig || hasHardhatDep) {
    checks.push({
      framework: 'Hardhat',
      installed: true,
      evidence: hasHardhatConfig ? 'hardhat.config.*' : 'package.json:hardhat',
      confidence: hasHardhatConfig ? 'high' : 'medium'
    });
  }

  const hasFoundryToml = await exists(path.join(projectDir, 'foundry.toml'));
  if (hasFoundryToml) {
    checks.push({
      framework: 'Foundry',
      installed: true,
      evidence: 'foundry.toml',
      confidence: 'high'
    });
  }

  const hasTruffleConfig =
    (await exists(path.join(projectDir, 'truffle-config.js'))) ||
    (await exists(path.join(projectDir, 'truffle-config.ts')));
  const hasTruffleDep = dependencyExists(packageJson, ['truffle']);
  if (hasTruffleConfig || hasTruffleDep) {
    checks.push({
      framework: 'Truffle',
      installed: true,
      evidence: hasTruffleConfig ? 'truffle-config.*' : 'package.json:truffle',
      confidence: hasTruffleConfig ? 'high' : 'medium'
    });
  }

  const hasAnchorToml = await exists(path.join(projectDir, 'Anchor.toml'));
  const hasAnchorDep = dependencyExists(packageJson, ['@coral-xyz/anchor']);
  const hasAnchorCargo = includesToken(cargoTomlText, 'anchor-lang');
  if (hasAnchorToml || hasAnchorDep || hasAnchorCargo) {
    checks.push({
      framework: 'Anchor',
      installed: true,
      evidence: hasAnchorToml
        ? 'Anchor.toml'
        : hasAnchorDep
          ? 'package.json:@coral-xyz/anchor'
          : 'Cargo.toml:anchor-lang',
      confidence: hasAnchorToml ? 'high' : 'medium'
    });
  }

  const hasSolanaWeb3Dep = dependencyExists(packageJson, ['@solana/web3.js']);
  if (hasSolanaWeb3Dep && !checks.some((check) => check.framework === 'Anchor')) {
    checks.push({
      framework: 'Solana Web3',
      installed: true,
      evidence: 'package.json:@solana/web3.js',
      confidence: 'medium'
    });
  }

  const hasAikenToml = await exists(path.join(projectDir, 'aiken.toml'));
  const hasCardanoDep = dependencyExists(packageJson, [
    'lucid-cardano',
    '@meshsdk/core',
    '@cardano-ogmios/client'
  ]);
  if (hasAikenToml || hasCardanoDep) {
    checks.push({
      framework: 'Cardano',
      installed: true,
      evidence: hasAikenToml ? 'aiken.toml' : 'package.json:cardano dependencies',
      confidence: hasAikenToml ? 'high' : 'medium'
    });
  }

  const hasNextConfig = (await exists(path.join(projectDir, 'next.config.js'))) || (await exists(path.join(projectDir, 'next.config.ts')));
  const hasNextDep = dependencyExists(packageJson, ['next']);
  if (hasNextConfig || hasNextDep) {
    checks.push({ framework: 'Next.js', installed: true, evidence: hasNextConfig ? 'next.config.*' : 'package.json:next', confidence: hasNextConfig ? 'high' : 'medium' });
  }

  const hasNuxtConfig = (await exists(path.join(projectDir, 'nuxt.config.js'))) || (await exists(path.join(projectDir, 'nuxt.config.ts')));
  const hasNuxtDep = dependencyExists(packageJson, ['nuxt']);
  if (hasNuxtConfig || hasNuxtDep) {
    checks.push({ framework: 'Nuxt', installed: true, evidence: hasNuxtConfig ? 'nuxt.config.*' : 'package.json:nuxt', confidence: hasNuxtConfig ? 'high' : 'medium' });
  }

  const hasSvelteConfig = await exists(path.join(projectDir, 'svelte.config.js'));
  const hasSvelteKitDep = dependencyExists(packageJson, ['@sveltejs/kit']);
  if (hasSvelteConfig || hasSvelteKitDep) {
    checks.push({ framework: 'SvelteKit', installed: true, evidence: hasSvelteConfig ? 'svelte.config.js' : 'package.json:@sveltejs/kit', confidence: hasSvelteConfig ? 'high' : 'medium' });
  }

  const hasRemixConfig = (await exists(path.join(projectDir, 'remix.config.js'))) || (await exists(path.join(projectDir, 'remix.config.ts')));
  const hasRemixDep = dependencyExists(packageJson, ['@remix-run/react', '@remix-run/node']);
  if (hasRemixConfig || hasRemixDep) {
    checks.push({ framework: 'Remix', installed: true, evidence: hasRemixConfig ? 'remix.config.*' : 'package.json:@remix-run/*', confidence: hasRemixConfig ? 'high' : 'medium' });
  }

  const hasAdonisAce = await exists(path.join(projectDir, 'ace'));
  const hasAdonisDep = dependencyExists(packageJson, ['@adonisjs/core']);
  if (hasAdonisAce || hasAdonisDep) {
    checks.push({ framework: 'AdonisJS', installed: true, evidence: hasAdonisAce ? 'ace' : 'package.json:@adonisjs/core', confidence: hasAdonisAce ? 'high' : 'medium' });
  }

  const hasNodePackage = await exists(packageJsonPath);
  if (checks.length === 0 && hasNodePackage) {
    checks.push({ framework: 'Node', installed: true, evidence: 'package.json', confidence: 'low' });
  }

  if (checks.length === 0) {
    return {
      framework: null,
      installed: false,
      evidence: null,
      confidence: 'none',
      matches: []
    };
  }

  return {
    framework: checks[0].framework,
    installed: true,
    evidence: checks[0].evidence,
    confidence: checks[0].confidence,
    matches: checks
  };
}

const WEB3_FRAMEWORKS = new Set(['Hardhat', 'Foundry', 'Truffle', 'Anchor', 'Solana Web3', 'Cardano']);
const BACKEND_FRAMEWORKS = new Set(['Laravel', 'Rails', 'Django', 'Symfony', 'AdonisJS', 'CodeIgniter 4', 'CodeIgniter 3']);
const FRONTEND_FRAMEWORKS = new Set(['Next.js', 'Nuxt', 'SvelteKit', 'Remix']);

/**
 * Returns true when detection found both a Web3 framework and a backend or
 * frontend framework in the same directory — typical of monorepos that bundle
 * smart contracts alongside a web application.
 */
function isMonorepoDetection(detection) {
  if (!detection || !Array.isArray(detection.matches) || detection.matches.length < 2) return false;
  const names = detection.matches.map((m) => m.framework);
  const hasWeb3 = names.some((n) => WEB3_FRAMEWORKS.has(n));
  const hasBackend = names.some((n) => BACKEND_FRAMEWORKS.has(n));
  const hasFrontend = names.some((n) => FRONTEND_FRAMEWORKS.has(n));
  return hasWeb3 && (hasBackend || hasFrontend);
}

module.exports = {
  detectFramework,
  isMonorepoDetection,
  safeJsonParse,
  dependencyExists
};
