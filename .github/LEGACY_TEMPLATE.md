# Older-template compatibility

Normal contributions go to `main-cli`. Update `main` selectively when a useful fix is inexpensive; current-template work need not wait. Contributors do not need duplicate PRs. Assess security issues and serious breakage explicitly through the appropriate security or bug process.

Known constraints from older CLI source:

- **pnpm:** older initialization overwrites `pnpm-workspace.yaml` before installing. Do not rely on custom hoisting/build approvals in that file surviving ([source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/services/init/init.ts#L111-L125)). Package-manager version requirements are separate.
- **App configuration:** keep the string `client_id = ""` placeholder in the full template for older configuration loading ([source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/models/app/loader.ts#L889-L916)).
- **Development URL:** preserve the `HOST` → `SHOPIFY_APP_URL` handling in `vite.config.ts`, or verify an equivalent replacement; older CLI launches supply `HOST` ([source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/services/dev/processes/web.ts#L130-L148)).
- **Custom-data/Events features:** do not assume these require a newer CLI. Older CLIs load server-provided module descriptions ([source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/services/generate/fetch-extension-specifications.ts#L60-L99)); preservation alone does not prove provisioning. Keep working definitions/setup and scopes with any dependent app code. Server-side availability remains unverified by this source audit.

Documentation, UI fixes, API-version updates, and library upgrades are not inherently newer-CLI requirements. Review the actual diff and verify the changed behavior; a clean cherry-pick alone is not enough. If an optional backport needs fresh compatibility research, skip it rather than requiring every maintainer to repeat that work. Record any newly established constraint here with its evidence. For a selected `main` update, maintainers also review and merge its generated JavaScript PR.
