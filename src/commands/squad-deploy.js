'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

async function runSquadDeploy({ args, options, logger }) {
  const squadSlug = args[0] || options.squad;
  const projectDir = path.resolve(args[1] || options.path || '.');
  const provider = options.provider || 'cloudpanel';

  if (!squadSlug) {
    logger.log('Uso: aioson squad:deploy <squad> [dir] --provider=cloudpanel');
    return { ok: false };
  }

  const squadJsonPath = path.join(projectDir, '.aioson', 'squads', squadSlug, 'squad.json');
  let squadConfig;
  try {
    squadConfig = JSON.parse(await fs.readFile(squadJsonPath, 'utf8'));
  } catch {
    logger.log(`Squad "${squadSlug}" não encontrado em ${squadJsonPath}`);
    return { ok: false, error: 'squad_not_found' };
  }

  const port = squadConfig.port || 3001;
  const deployDir = path.join(projectDir, '.aioson', 'squads', squadSlug, 'deploy');
  await fs.mkdir(deployDir, { recursive: true });

  const nginxConf = generateNginxConf(squadSlug, port, provider);
  const outPath = path.join(deployDir, 'nginx.conf');
  await fs.writeFile(outPath, nginxConf);

  logger.log(`✓ Configuração nginx gerada: ${outPath}`);
  logger.log('');
  logger.log('Instruções CloudPanel:');
  logger.log('  1. Acesse CloudPanel → Websites → [seu site] → Nginx');
  logger.log('  2. Cole o conteúdo do arquivo nginx.conf em "Custom Nginx Directives"');
  logger.log('  3. Salve e aguarde o reload automático do nginx');
  logger.log(`  4. Certifique-se que o daemon está rodando: aioson squad:daemon ${squadSlug} start`);

  return { ok: true, path: outPath };
}

function generateNginxConf(slug, port, provider) {
  return [
    `# Squad: ${slug} — gerado por aioson squad:deploy`,
    `# Provider: ${provider}`,
    `# Cole em: CloudPanel → Website → Nginx → Custom Nginx Directives`,
    `#`,
    `# Pré-requisito: aioson squad:daemon ${slug} start`,
    ``,
    `location /${slug}/webhook/ {`,
    `    proxy_pass http://127.0.0.1:${port}/webhook/;`,
    `    proxy_http_version 1.1;`,
    `    proxy_set_header Host $host;`,
    `    proxy_set_header X-Real-IP $remote_addr;`,
    `    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`,
    `    proxy_read_timeout 30s;`,
    `    proxy_connect_timeout 5s;`,
    `}`,
  ].join('\n');
}

module.exports = { runSquadDeploy, generateNginxConf };
