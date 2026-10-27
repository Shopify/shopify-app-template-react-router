# Updating the older template

Normal contributions go to `main-cli`. Maintainers may selectively update `main`; contributors do not need to create duplicate PRs. Keeping `main` usable does not require feature parity or delaying current-template improvements.

## When to backport

For a small fix that is useful to older-template users, a maintainer can add `backport-main` to the original PR. The maintainer or weekly maintainer picks it up, reviews the actual `main` diff, and runs relevant existing checks. This label is a manual queue, not an automated cherry-pick or compatibility approval.

Use the constraints below instead of expecting reviewers to remember CLI internals. A clean cherry-pick is not proof of compatibility. If an optional backport needs substantial adaptation or new compatibility research, skip it and record why on the original PR; remove the queue label. The contributor's current-template PR can proceed independently.

For security issues or serious failures of initialization, development, or deployment, explicitly assess whether the older template is affected. Track any required work with an owner through the appropriate security or bug process; do not drop it merely because it exceeds the optional-backport effort. Keep sensitive details in the security process. Follow the applicable support/security policy rather than treating this guide as a new deprecation policy.

An intentional PR against `main` needs the maintainer-applied `legacy-template` label for **Check PR target**, plus normal review. For a merged backport, link it to the original PR, remove `backport-main`, and follow through on the generated `javascript` conversion PR too.

## Known constraints

These findings come from CLI source inspection, not a promise that every historical CLI works. CLI 3.85.0–3.90.1 selects `main`/`javascript` for the built-in React Router template; 3.91.0 switches to `main-cli`/`javascript-cli` ([before](https://github.com/Shopify/cli/blob/3.90.1/packages/app/src/cli/prompts/init/init.ts#L33-L44), [after](https://github.com/Shopify/cli/blob/3.91.0/packages/app/src/cli/prompts/init/init.ts#L33-L44)).

| If the change touches…            | Preserve or verify…                                                                                                                                                                                      | Why                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm settings                     | Do not rely on custom `pnpm-workspace.yaml` settings surviving old initialization. In particular, do not move required hoisting exclusively out of `.npmrc` or assume YAML build approvals will survive. | Old initialization overwrites the YAML before installing dependencies ([source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/services/init/init.ts#L111-L125)). Which settings the package manager itself supports is a separate version requirement. |
| The template's app configuration  | Keep a string `client_id` placeholder, currently `client_id = ""`, in the full template.                                                                                                                 | Older configuration classification uses that shape; flexible templates without it use a different path ([source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/models/app/loader.ts#L889-L916)).                                                       |
| Development environment variables | Keep the `HOST` → `SHOPIFY_APP_URL` handling in `vite.config.ts`, or verify an equivalent replacement.                                                                                                   | The older web runner supplies `HOST`, not `SHOPIFY_APP_URL` directly in its launch environment ([source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/services/dev/processes/web.ts#L130-L148)).                                                      |
| Custom-data examples              | Carry working definitions/setup and required scopes with the application code.                                                                                                                           | The sample writes assume those definitions exist. Copying the app code alone is not a complete feature.                                                                                                                                                                                                    |

### Things that are not automatically excluded

UI fixes, documentation, API-version updates, and application-library upgrades are not inherently newer-CLI requirements. Keep related dependencies, runtime requirements, and examples coherent, and do normal app verification. Older CLI support does not itself require keeping the app on older libraries or Node versions.

Liquid template files are also supported by older initialization ([source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/services/init/init.ts#L94-L101)); preserve manager-aware commands rather than replacing them merely to mirror another branch.

### Configuration features that need additional evidence

Do **not** use a blanket rule that declarative metafields, metaobjects, or Events require a newer CLI. Older CLIs can preserve these sections and load module descriptions supplied by Shopify ([module loading](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/services/generate/fetch-extension-specifications.ts#L60-L99)).

Preserving TOML is not proof the feature will be set up. Linked initialization, development, and deployment require applicable server-provided module descriptions; otherwise the CLI rejects unsupported sections ([source](https://github.com/Shopify/cli/blob/7d927e91dd7c8b5d8f4f86eb4aca4fd53ca67853/packages/app/src/cli/models/app/loader.ts#L644-L703)). Server-side availability was not established by this source audit. If a proposed backport depends on that unresolved behavior, it is not an inexpensive backport: skip the optional work or assign a focused investigation for a required fix.

When a new constraint is established, add its concrete failure, compatible alternative, and source/test evidence here so the next reviewer does not have to rediscover it. This guide is a reference, not a substitute for testing the changed behavior.
