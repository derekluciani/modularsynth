# Modular Synth app

This React and Web Audio app uses [Vite+](https://viteplus.dev/guide/). Install the `vp` CLI, then run these commands from `app/`:

```sh
vp install
vp run dev
```

Open the local URL printed by the dev server. Press `Ctrl+C` to stop it.

## Before committing

```sh
vp check
vp test --run
vp run build
```

## Vite+ command reference

| Command                        | What it does                                                     |
| ------------------------------ | ---------------------------------------------------------------- |
| `vp install`                   | Install dependencies. Run after pulling dependency changes.      |
| `vp install --frozen-lockfile` | Install from the lockfile without allowing updates.              |
| `vp run dev`                   | Start the development server with hot reload.                    |
| `vp check`                     | Check formatting, lint, and types without editing files.         |
| `vp fmt`                       | Apply formatting to project files.                               |
| `vp run lint`                  | Run the project's lint script.                                   |
| `vp test`                      | Start tests in watch mode in an interactive terminal.            |
| `vp test --run`                | Run the test suite once and exit.                                |
| `vp run build`                 | Run `tsc -b`, then build the production app into `dist/`.        |
| `vp run preview`               | Serve the production build locally. Run the build first.         |
| `vp env doctor`                | Diagnose Node.js, npm, and Vite+ PATH setup.                     |
| `vp toolchain`                 | Show the active tool versions.                                   |
| `vp why <package>`             | Show the package-manager dependency graph.                       |
| `vp help`                      | List commands. Use `vp <command> --help` for flags and examples. |

See [the app README](app/README.md#vite-command-reference) for the Vite+ command reference, including tests, formatting, builds, and local preview.

## Running Scripts

- Use `vp run <script>` for this app's `package.json` scripts. For example, `vp run build` includes the TypeScript build step, while the built-in `vp build` only bundles the app.
- Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.
