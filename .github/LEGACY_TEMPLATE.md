# Older-template compatibility

Selectively backport small, useful fixes to `main` without delaying current-template updates. Assess security issues and serious breakage separately.

Do not backport changes that:

- **Depend on custom `pnpm-workspace.yaml` settings surviving `app init`.** Older initialization overwrites that file before installing dependencies ([CLI source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/services/init/init.ts#L111-L125)).
- **Remove the string `client_id` placeholder from the full template.** The older loader uses it to identify the app configuration ([CLI source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/models/app/loader.ts#L889-L916)).
- **Remove handling for `HOST` when setting `SHOPIFY_APP_URL`.** The older development runner supplies `HOST` rather than `SHOPIFY_APP_URL` ([CLI source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/services/dev/processes/web.ts#L130-L148)).
