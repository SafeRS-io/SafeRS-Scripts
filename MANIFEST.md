# `safers.plugin.json` reference

Every script folder needs one. The folder that contains it is the script.

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | The store plugin id, `plg_…`. Must match a plugin whose **Source repository** is this repo, or the folder is skipped. |
| `runtime` | yes | Always `"lua"`. |
| `version` | yes | Shown in the store. Bump it for every release. |
| `entry` | bundles | The file that runs first, relative to `src`, e.g. `"main.lua"`. |
| `src` | bundles | Folder to package, relative to the manifest. Use `"."` for the script folder. |
| `artifact` | single files | Instead of `src` + `entry`: one `.lua` file to ship as-is, e.g. `"./my_script.lua"`. |
| `exclude` | no | Extra paths to leave out of the package, e.g. `["scratch/**", "*.bak"]`. |
| `noDefaultExclude` | no | `true` keeps the files normally left out (docs, tests, `.py`). Rarely needed. |
| `deps` | no | Repo paths outside the folder whose changes should also rebuild this script, e.g. `["shared"]`. They are **not** packaged; see below. |

## Bundle or single file?

- **Bundle** (`src` + `entry`): a folder with `main.lua` and modules under
  `lib/`. Modules load with `require "lib.util"`, which resolves to
  `lib/util.lua` inside the folder. Recommended for anything over a few
  hundred lines.
- **Single file** (`artifact`): one `.lua` file, nothing else.

Pick one and keep it. Switching a live script between the two is supported,
but there's no reason to.

## What gets packaged

Everything under `src` except:

```
safers.plugin.json   test/**   tests/**   **/*.md   **/*.py   **/*.rar   **/.DS_Store
```

plus anything in `exclude`. Files are sorted and stored with fixed
timestamps, so the same files always produce the same package.

## Shared code across scripts

Only the script's own folder is packaged. A `require` can't reach files
outside it. If several scripts share code, copy it into each script's `lib/`.
`deps` only tells the pipeline to rebuild a script when those shared paths
change; it doesn't bundle them.
