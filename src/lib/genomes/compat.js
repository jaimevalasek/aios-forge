'use strict';

const {
  parseGenomeMarkdown,
  serializeGenomeMarkdown
} = require('../../genome-format');
const { isGenomeV2, normalizeGenome } = require('../../genomes');
const { mergeGenomeBindings, normalizeGenomeBindings } = require('../../genomes/bindings');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasLegacyObjectSignals(input) {
  return Boolean(
    input &&
      (
        input.genome ||
        input.slug ||
        input.domain ||
        input.title ||
        input.name ||
        isObject(input.sections) ||
        Array.isArray(input.knowledge) ||
        Array.isArray(input.mentes) ||
        Array.isArray(input.skills)
      )
  );
}

function buildSectionsFromLegacyObject(input = {}) {
  if (isObject(input.sections)) {
    return input.sections;
  }

  return {
    knowledge: Array.isArray(input.knowledge) ? input.knowledge : [],
    philosophies: Array.isArray(input.philosophies) ? input.philosophies : [],
    mentalModels: Array.isArray(input.mentalModels) ? input.mentalModels : [],
    heuristics: Array.isArray(input.heuristics) ? input.heuristics : [],
    frameworks: Array.isArray(input.frameworks) ? input.frameworks : [],
    methodologies: Array.isArray(input.methodologies) ? input.methodologies : [],
    mentes: Array.isArray(input.mentes) ? input.mentes : Array.isArray(input.minds) ? input.minds : [],
    skills: Array.isArray(input.skills) ? input.skills : [],
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    applicationNotes: Array.isArray(input.applicationNotes) ? input.applicationNotes : []
  };
}

function hasExplicitV2MarkdownMarkers(input) {
  const text = String(input || '');
  return (
    /\nformat:\s*genome-v2\s*$/im.test(text) ||
    /\nversion:\s*2\s*$/im.test(text) ||
    /\nevidence_mode:\s*.+$/im.test(text) ||
    /\nsources_count:\s*\d+\s*$/im.test(text) ||
    /^##\s+(Filosofias|Modelos mentais|Heurísticas|Heuristicas|Frameworks|Metodologias|Evidence|Application notes)\s*$/im.test(text)
  );
}

function hasLegacyMarkdownSignals(input) {
  const text = String(input || '');
  return (
    /^\s*---\s*$/m.test(text) ||
    /\n(?:genome|slug):\s*.+$/im.test(text) ||
    /^#\s+(Genome|Genoma)\s*:/im.test(text) ||
    /^##\s+(O que saber|Mentes|Skills)\s*$/im.test(text)
  );
}

function toV2GenomeDocument(input, options = {}) {
  return normalizeGenome({
    ...(isObject(input) ? input : {}),
    sections: buildSectionsFromLegacyObject(input),
    legacyFormat: false,
    hasFrontmatter: true,
    version: 2,
    format: 'genome-v2',
    sourcePath: options.filePath || null
  });
}

function detectGenomeFormat(input) {
  if (!input) return 'unknown';

  if (typeof input === 'string') {
    try {
      if (hasExplicitV2MarkdownMarkers(input)) return 'v2-markdown';
      if (hasLegacyMarkdownSignals(input)) return 'legacy-markdown';
      const genome = parseGenomeMarkdown(input);
      if (isGenomeV2(genome)) return 'v2-markdown';
      if (genome.legacyFormat) return 'legacy-markdown';
    } catch {
      return 'unknown';
    }
    return 'unknown';
  }

  if (isObject(input)) {
    if (isGenomeV2(input)) return 'v2-object';
    if (hasLegacyObjectSignals(input)) return 'legacy-object';
  }

  return 'unknown';
}

function loadCompatibleGenome(input, options = {}) {
  const format = detectGenomeFormat(input);

  if (format === 'v2-markdown' || format === 'legacy-markdown') {
    const parsed = parseGenomeMarkdown(input);
    return {
      format,
      document: toV2GenomeDocument(parsed, options),
      migrated: format === 'legacy-markdown'
    };
  }

  if (format === 'v2-object') {
    return {
      format,
      document: toV2GenomeDocument(input, options),
      migrated: false
    };
  }

  if (format === 'legacy-object') {
    return {
      format,
      document: toV2GenomeDocument(
        {
          slug: input.slug || input.genome,
          domain: input.domain || input.title || input.name || input.slug || input.genome,
          type: input.type,
          language: input.language,
          depth: input.depth,
          evidenceMode: input.evidenceMode || input.evidence_mode,
          sourceCount: input.sourceCount ?? input.sourcesCount ?? input.sources_count,
          generated: input.generated,
          sections: buildSectionsFromLegacyObject(input)
        },
        options
      ),
      migrated: true
    };
  }

  throw new Error('Unsupported genome format.');
}

function serializeCompatibleGenome(document, options = {}) {
  return serializeGenomeMarkdown(toV2GenomeDocument(document, options));
}

function normalizeCompatibleBindings(bindings = {}) {
  return normalizeGenomeBindings(bindings);
}

function hasLegacySquadGenomeSignals(manifest = {}) {
  return Boolean(
    Array.isArray(manifest.genomes) ||
      isObject(manifest.genomes) ||
      isObject(manifest.genomeBindings) ||
      (Array.isArray(manifest.executors) &&
        manifest.executors.some((executor) => Array.isArray(executor && executor.genomes) && executor.genomes.length > 0))
  );
}

function normalizeLegacySquadGenomes(manifest = {}) {
  if (!isObject(manifest)) return {};
  if (!hasLegacySquadGenomeSignals(manifest)) return { ...manifest };

  const genomeBindings = mergeGenomeBindings({
    blueprintBindings: manifest.genomeBindings,
    manifestBindings: manifest.genomeBindings || manifest.genomes,
    legacyExecutors: manifest.executors
  });

  return {
    ...manifest,
    genomeBindings
  };
}

module.exports = {
  detectGenomeFormat,
  loadCompatibleGenome,
  serializeCompatibleGenome,
  normalizeCompatibleBindings,
  normalizeLegacySquadGenomes
};
