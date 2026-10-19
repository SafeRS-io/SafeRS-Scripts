# SafeRS script template

Start here to publish Lua scripts on the SafeRS store (the SDN). Keep your
scripts in your own **private** GitHub repo. Every push to your default branch
is picked up automatically, packaged and published. You never upload files by
hand.

```
your private repo ──push──▶ SafeRS GitHub App ──▶ SDN build + review ──▶ store
```

One repo can hold any number of scripts. A push only rebuilds the scripts
whose folders changed.

## 1. Make your repo from this template

1. Click **Use this template → Create a new repository** (or clone this repo
   and push it to a new one).
2. Set it to **Private**. The SafeRS App only ever *reads* it.
3. Rename `example_script/` to your script, or delete it once you've added your own.

## 2. Create the plugin in the store

1. Sign in to the store with your scripter account and create a new plugin
   (name, category, pricing, description, media).
2. In the plugin's **Source repository (GitHub)** field, paste your repo URL,
   e.g. `https://github.com/you/my-safers-scripts`, and save.
3. Copy the plugin's id (`plg_…`). You'll put it in the script's manifest.

New plugins stay **pending** until SafeRS approves them for listing. You can
push builds before then; they aren't visible to users until approval.

## 3. Install the SafeRS GitHub App on your repo

1. Open **https://github.com/apps/__APP_SLUG__/installations/new**.
2. Choose the account that owns your repo.
3. Pick **Only select repositories** and select this repo. Don't grant it
   repos you don't publish from.
4. Click **Install**.

The App asks for **Contents: read** and **Metadata: read** only. It can't
push, open PRs, or see your other repos. You can remove it any time under
GitHub → Settings → Applications → Installed GitHub Apps.

## 4. Point the manifest at your plugin

Each script lives in its own folder with a `safers.plugin.json`:

```json
{
  "id": "plg_xxxxxxxx",
  "runtime": "lua",
  "version": "1.0.0",
  "entry": "main.lua",
  "src": "."
}
```

Replace `id` with the id from step 2. See [MANIFEST.md](MANIFEST.md) for every
field.

## 5. Push

Commit and push to your default branch (`main`). That's it. The pipeline:

1. works out which script folders changed since the last publish,
2. checks and packages each changed script,
3. runs it through review, then
4. publishes it to the store under the manifest's `version`.

Pushes to other branches are ignored, so use branches for work in progress
and merge to `main` to release.

## Rules

- **Lua only.** Native (C++) plugins are restricted to the SafeRS team, and a
  manifest with `"runtime": "cpp"` fails the build.
- **No raw memory access.** Any `mem.` or `mem:` in a `.lua` file fails the
  build, even in a comment or a table of your own called `mem`, so name your
  tables something else. Use the `srs.*` API:
  <https://seqcoding.github.io/SafeRS-Native-Docs/>
- **One folder per script, one id per script.** Two manifests with the same id
  fail the build.
- **Only your script ships.** Everything in the script folder is packaged,
  except `safers.plugin.json`, `test/`, `tests/`, `*.md`, `*.py`, `*.rar` and
  `.DS_Store`. Never commit secrets, tokens or account details.

## Releasing an update

- **Bump `version`** in `safers.plugin.json` for every release. The store
  shows it, and it's how users see there's an update. (If you also call
  `script.declareInfo { version = … }`, keep the two in sync.)
- If the packaged files are byte-for-byte identical to what's live, the
  publish is skipped, so a version bump with no code change doesn't
  release anything.
- Change your store listing (description, price, media) in the store. Change
  code and version only through this repo.

## Checking your work before you push

This repo includes a check that runs on every push and pull request
(`.github/workflows/validate.yml`). It catches the mistakes that would fail
the real build: bad JSON, a placeholder or malformed id, a missing entry file,
`mem.` calls, duplicate ids, and a `declareInfo` version that doesn't match the
manifest. Run it locally with Node 18+:

```
node tools/validate.mjs
```

## Layout

```
example_script/          one folder per script
  safers.plugin.json     manifest: store id, version, entry point
  main.lua               entry point (the top-level chunk runs on install)
  lib/util.lua           require "lib.util" — modules are paths inside the folder
MANIFEST.md              manifest field reference
tools/validate.mjs       pre-push check (Node built-ins only)
```

## Help

- API reference: <https://seqcoding.github.io/SafeRS-Native-Docs/>
- Problems with publishing: contact SafeRS staff with your repo name and the
  commit you pushed.
