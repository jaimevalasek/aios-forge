'use strict';

module.exports = {
  cli: {
    title: 'AIOS Lite CLI',
    usage: 'Usage:',
    help_init: 'aios-lite init <project-name> [--force] [--dry-run] [--locale=en]',
    help_install: 'aios-lite install [path] [--force] [--dry-run] [--locale=en]',
    help_update: 'aios-lite update [path] [--dry-run] [--locale=en]',
    help_info: 'aios-lite info [path] [--locale=en]',
    help_doctor: 'aios-lite doctor [path] [--locale=en]',
    help_i18n_add: 'aios-lite i18n:add <locale> [--force] [--dry-run] [--locale=en]',
    unknown_command: 'Unknown command: {command}',
    error_prefix: 'Error: {message}'
  },
  init: {
    usage_error: 'Usage: aios-lite init <project-name> [--force] [--dry-run] [--locale=en]',
    non_empty_dir: 'Directory is not empty: {targetDir}. Use --force to continue.',
    created_at: 'Project created at: {targetDir}',
    files_copied: 'Files copied: {count}',
    files_skipped: 'Files skipped: {count}',
    next_steps: 'Next steps:',
    step_cd: '1. cd {projectName}',
    step_setup: '2. Open in your AI CLI and run @setup'
  },
  install: {
    framework_detected: 'Framework detected: {framework} ({evidence})',
    framework_not_detected: 'No framework detected. Installing in generic mode.',
    done_at: 'Installation completed at: {targetDir}',
    files_copied: 'Files copied: {count}',
    files_skipped: 'Files skipped: {count}'
  },
  update: {
    not_installed: 'No AIOS Lite installation found in {targetDir}.',
    done_at: 'Update completed at: {targetDir}',
    files_updated: 'Files updated: {count}',
    backups_created: 'Backups created: {count}'
  },
  info: {
    cli_version: 'AIOS Lite CLI: v{version}',
    directory: 'Directory: {targetDir}',
    installed_here: 'Installed in this directory: {value}',
    framework_detected: 'Framework detected: {framework}',
    evidence: 'Evidence: {evidence}',
    yes: 'yes',
    no: 'no',
    none: 'none'
  },
  doctor: {
    ok: 'OK',
    fail: 'FAIL',
    diagnosis_ok: 'Diagnosis: healthy installation.',
    diagnosis_fail: 'Diagnosis: {count} issue(s) found.',
    hint_prefix: '-> {hint}',
    required_file: 'Required file: {rel}',
    context_generated: 'Main context generated',
    context_hint: 'Run @setup to generate .aios-lite/context/project.context.md',
    node_version: 'Node.js >= 18 (current: {version})'
  },
  i18n_add: {
    usage_error: 'Usage: aios-lite i18n:add <locale> [--force] [--dry-run] [--locale=en]',
    invalid_locale: 'Invalid locale code: {locale}. Expected formats like en, fr, pt-br.',
    base_locale: 'Locale "en" is the base dictionary and cannot be scaffolded.',
    locale_exists: 'Locale file already exists: {path}. Use --force to overwrite.',
    dry_run_created: '[dry-run] Locale scaffold would be created: {locale}',
    dry_run_overwritten: '[dry-run] Locale scaffold would be overwritten: {locale}',
    created: 'Locale scaffold created: {locale}',
    overwritten: 'Locale scaffold overwritten: {locale}',
    file_path: 'Locale file: {path}',
    next_steps: 'Next steps:',
    step_translate: '1. Replace English strings with translated text in that file.',
    step_try: '2. Run the CLI with --locale={locale} to validate the new dictionary.'
  }
};
