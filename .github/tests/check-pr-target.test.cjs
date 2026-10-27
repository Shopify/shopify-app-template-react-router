const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const workflow = fs.readFileSync(
  path.join(__dirname, "../workflows/check-pr-target.yml"),
  "utf8",
);
const block = workflow.match(/          script: \|\n([\s\S]+)$/);
assert.ok(
  block,
  "test the script used by the workflow, not a separate implementation",
);
const script = block[1].replace(/^            /gm, "");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const check = new AsyncFunction("github", "context", "core", script);

async function run(base, labels = []) {
  const failures = [];
  const requests = [];
  await check(
    {
      rest: {
        pulls: {
          get: async (request) => {
            requests.push(request);
            return {
              data: {
                base: { ref: base },
                labels: labels.map((name) => ({ name })),
              },
            };
          },
        },
      },
    },
    {
      repo: { owner: "Shopify", repo: "shopify-app-template-react-router" },
      issue: { number: 123 },
      // Deliberately stale: decisions must use the current API response.
      payload: {
        pull_request: {
          base: { ref: "main-cli" },
          labels: [{ name: "legacy-template" }],
        },
      },
    },
    {
      info() {},
      setFailed(message) {
        failures.push(message);
      },
    },
  );
  assert.deepEqual(requests, [
    {
      owner: "Shopify",
      repo: "shopify-app-template-react-router",
      pull_number: 123,
    },
  ]);
  return failures;
}

test("normal current-template PRs need no label", async () => {
  assert.deepEqual(await run("main-cli"), []);
});

test("an accidental main PR fails with actionable guidance, despite stale event metadata", async () => {
  const failures = await run("main");
  assert.equal(failures.length, 1);
  assert.match(failures[0], /Retarget this PR to main-cli/);
  assert.match(failures[0], /LEGACY_TEMPLATE\.md/);
});

test("an intentional main update passes; removing its label fails again", async () => {
  assert.deepEqual(await run("main", ["legacy-template"]), []);
  assert.equal((await run("main")).length, 1);
});

test("lookalike labels do not grant the exception", async () => {
  assert.equal(
    (await run("main", ["backport-main", "legacy-template-extra"])).length,
    1,
  );
});

test("JavaScript conversion and stacked feature PRs are not blocked", async () => {
  for (const base of ["javascript-cli", "javascript", "feature-parent"]) {
    assert.deepEqual(await run(base), []);
  }
});

test("failure to read current metadata does not silently pass", async () => {
  await assert.rejects(
    check(
      {
        rest: {
          pulls: {
            get: async () => {
              throw new Error("API unavailable");
            },
          },
        },
      },
      { repo: {}, issue: { number: 123 } },
      { info() {}, setFailed() {} },
    ),
    /API unavailable/,
  );
});

test("workflow reruns on retargeting, code updates, and exception-label changes", () => {
  for (const event of [
    "opened",
    "reopened",
    "edited",
    "synchronize",
    "labeled",
    "unlabeled",
  ]) {
    assert.match(workflow, new RegExp(`\\b${event}\\b`));
  }
  assert.match(workflow, /pull_request_target:/);
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /cancel-in-progress: true/);
  assert.doesNotMatch(
    workflow,
    /actions\/checkout|secrets\.|contents: write|pull-requests: write/,
  );
  assert.doesNotMatch(script, /\$\{\{|require\(|import\s|eval\(|exec\(/);
});
