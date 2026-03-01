'use strict';

const { createLocaleScaffold } = require('../i18n/scaffold');

async function runI18nAdd({ args, options, logger, t }) {
  const requestedLocale = args[0];
  if (!requestedLocale) {
    throw new Error(t('i18n_add.usage_error'));
  }

  const force = Boolean(options.force);
  const dryRun = Boolean(options['dry-run']);

  let result;
  try {
    result = await createLocaleScaffold(requestedLocale, { force, dryRun });
  } catch (error) {
    if (error.code === 'INVALID_LOCALE') {
      throw new Error(t('i18n_add.invalid_locale', { locale: requestedLocale }));
    }
    if (error.code === 'BASE_LOCALE') {
      throw new Error(t('i18n_add.base_locale'));
    }
    if (error.code === 'LOCALE_EXISTS') {
      throw new Error(t('i18n_add.locale_exists', { path: error.path }));
    }
    throw error;
  }

  if (result.dryRun) {
    logger.log(
      result.overwritten
        ? t('i18n_add.dry_run_overwritten', { locale: result.locale })
        : t('i18n_add.dry_run_created', { locale: result.locale })
    );
  } else {
    logger.log(
      result.overwritten
        ? t('i18n_add.overwritten', { locale: result.locale })
        : t('i18n_add.created', { locale: result.locale })
    );
  }
  logger.log(t('i18n_add.file_path', { path: result.filePath }));
  logger.log(t('i18n_add.next_steps'));
  logger.log(t('i18n_add.step_translate'));
  logger.log(t('i18n_add.step_try', { locale: result.locale }));

  return {
    ok: true,
    ...result
  };
}

module.exports = {
  runI18nAdd
};
