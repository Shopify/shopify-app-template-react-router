# How to contribute

The Shopify React Router app template is an open source project. We want to make it as easy and transparent as possible to contribute. If we are missing anything or can make the process easier in any way, please let us know by [opening an issue](https://github.com/Shopify/shopify-app-template-react-router/issues/new).

## Where should my pull request go?

Start your branch from **`main-cli`** and open **one pull request against `main-cli`**. This is the TypeScript template used by current Shopify CLIs. [Start a comparison against main-cli](https://github.com/Shopify/shopify-app-template-react-router/compare/main-cli...).

You do not need to duplicate your PR for the other branches. Maintainers handle JavaScript conversion and any selected older-template updates.

| Branch           | Purpose                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| `main-cli`       | Current-CLI TypeScript template; normal contribution target                       |
| `javascript-cli` | Current-CLI JavaScript template; conversion from `main-cli`                       |
| `main`           | Older-CLI TypeScript template; selective maintenance, not required feature parity |
| `javascript`     | Older-CLI JavaScript template; conversion from `main`                             |

GitHub may still suggest `main` until the repository default is changed. Select `main-cli` explicitly. If you already opened a PR against `main`, ask a maintainer to help retarget it without accidentally including unrelated changes.

### Maintainer completion checklist

- Review and merge the current-template change without waiting for optional older-template work.
- Check the **Update JavaScript CLI branch** workflow and its generated PR against `javascript-cli`. Review the converted diff, including dependency changes; if something is missing, maintainers supply the follow-up rather than asking the contributor to duplicate their PR. Conversion is not complete until that PR is merged.
- For an inexpensive older-template update, use the [older-template guide](LEGACY_TEMPLATE.md). No compatibility research or backport decision is required for every normal PR.

The **Check PR target** check catches accidental PRs to `main`. Maintainers use the `legacy-template` label only for an intentional older-template update; the label does not certify compatibility or replace normal review. [One-time rollout steps](CONTRIBUTION_ROLLOUT.md) describe how to activate the check and change the default branch.

## Code of conduct

We expect all participants to read our [code of conduct](https://github.com/Shopify/shopify-app-template-react-router/blob/main-cli/.github/CODE_OF_CONDUCT.md) to understand which actions are and aren’t tolerated.

## Open development

All work on the Shopify React Router app template happens directly on GitHub. Both team members and external contributors send pull requests which go through the same review process.

## Bugs

### Where to find known issues

We track all of our issues in GitHub and [bugs](https://github.com/Shopify/shopify-app-template-react-router/labels/Bug) are labeled accordingly. If you are planning to work on an issue, avoid ones which already have an assignee, where someone has commented within the last two weeks they are working on it, or the issue is labeled with [fix in progress](https://github.com/Shopify/shopify-app-template-react-router/labels/fix%20in%20progress). We will do our best to communicate when an issue is being worked on internally.

### Reporting new issues

To reduce duplicates, look through open issues before filing one. When [opening an issue](https://github.com/Shopify/shopify-app-template-react-router/issues/new?template=ISSUE.md), complete as much of the template as possible.

## Your first pull request

Working on your first pull request? You can learn how from this free video series:

[How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

To help you get familiar with our contribution process, we have a list of [good first issues](https://github.com/Shopify/shopify-app-template-react-router/labels/good%20first%20issue) that contain bugs with limited scope. This is a great place to get started.

If you decide to fix an issue, please check the comment thread in case somebody is already working on a fix. If nobody is working on it, leave a comment stating that you intend to work on it.

If somebody claims an issue but doesn’t follow up for more than two weeks, it’s fine to take it over but still leave a comment stating that you intend to work on it.

### Sending a pull request

We’ll review your pull request and either merge it, request changes to it, or close it with an explanation. We’ll do our best to provide updates and feedback throughout the process.

### Contributor License Agreement (CLA)

Each contributor is required to [sign a CLA](https://cla.shopify.com/). This process is automated as part of your first pull request and is only required once. If any contributor has not signed or does not have an associated GitHub account, the CLA check will fail and the pull request is unable to be merged.
