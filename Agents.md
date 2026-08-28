# Agent instructions

## Project overview

`gulp-tinypng-extended` is a CommonJS Gulp plugin that uploads PNG and JPEG images to the TinyPNG/Tinify API, downloads compressed results, and returns them through a Vinyl stream. The package targets Node.js and uses a callback/stream-based style consistent with its existing dependencies.

## Repository layout

- `index.js` — CommonJS compatibility entry point, Tinify client integration, and Vinyl stream behavior.
- `lib/options.js` — option defaults and CLI option normalization.
- `lib/stats.js` — compression statistics factory.
- `lib/signature-store.js` — source signature calculation, comparison, loading, and persistence.
- `lib/utils.js` — Gulp-oriented logging, glob matching, API error wrapping, and size formatting.
- `gulpfile.js` — local Gulp task for manually exercising image compression.
- `test/init.test.mjs` — primary behavior and integration-style test suite.
- `test/coverage.test.mjs` — additional branch and edge-case coverage.
- `test/mock-api.js` — Nock fixtures for the official Tinify API flow.
- `test/assets/` — image and download fixtures used by tests.
- `package.json` — package metadata and npm scripts.
- `README.md` — public API and usage documentation.

## Development conventions

- Preserve the existing JavaScript style unless a change requires otherwise: CommonJS modules, `var`, callbacks, and the existing indentation/formatting patterns.
- Keep the official Tinify API interaction in `index.js` until the TypeScript adapter migration; keep plugin-specific utilities in `lib/`.
- Keep changes focused on the requested behavior. Avoid broad refactors or dependency upgrades unless explicitly needed.
- Preserve the plugin’s stream semantics and callback behavior. Be especially careful with error events, retries, concurrent uploads, skipped files, and signature-file updates.
- TinyPNG requests should be mocked in automated tests; tests must not depend on a live API or consume API quota.
- Never add or expose real TinyPNG API keys. Use environment variables for manual runs (`TINYPNG_KEY`) and non-secret test values or mocks in tests.
- Update `README.md` when changing public options, defaults, CLI behavior, or user-visible error/log output.

## Common commands

Install dependencies:

```sh
npm install
```

Run the test suite:

```sh
npm test
```

Run tests without API-dependent cases:

```sh
PNG_DRY=1 npm test
```

Run the local Gulp task manually with a key supplied through the environment:

```sh
TINYPNG_KEY=your_api_key ./node_modules/.bin/gulp tinypng
```

Do not run the manual Gulp task unless an API request is intentionally desired. It can upload an image and consume TinyPNG quota.

## Testing guidance

- Add regression coverage in `test/init.js` for behavior changes.
- Use the existing Nock setup in `test/mock-api.js` or add isolated Nock responses for HTTP and retry scenarios.
- Use the fixtures in `test/assets/` where possible; avoid committing generated output. Temporary output belongs under `test/assets/tmp`, which is ignored by Git.
- Run `npm test` after implementation changes. If a test requires network access or a real credential, replace that dependency with a mock rather than weakening the test.

## Change checklist

1. Inspect the relevant implementation and existing tests before editing.
2. Make the smallest compatible change in `index.js` or the relevant test/ documentation file.
3. Add or update tests for changed behavior, including error and edge cases where applicable.
4. Run `npm test` and review diagnostics or failures.
5. Update `README.md` for public-facing changes.
6. Do not commit changes unless explicitly requested.
