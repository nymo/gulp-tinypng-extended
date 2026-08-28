# gulp-tinypng-extended

[![NPM Version](https://img.shields.io/npm/v/gulp-tinypng-extended?label=npm)](https://www.npmjs.com/package/gulp-tinypng-extended)
[![NPM Downloads](https://img.shields.io/npm/dm/gulp-tinypng-extended?label=downloads)](https://www.npmjs.com/package/gulp-tinypng-extended)
[![CI](https://github.com/nymo/gulp-tinypng-extended/actions/workflows/test.yml/badge.svg)](https://github.com/nymo/gulp-tinypng-extended/actions/workflows/test.yml)
[![Lint](https://github.com/nymo/gulp-tinypng-extended/actions/workflows/lint.yml/badge.svg)](https://github.com/nymo/gulp-tinypng-extended/actions/workflows/lint.yml)
[![License](https://img.shields.io/github/license/nymo/gulp-tinypng-extended)](LICENSE)

> Compress PNG, JPEG, WebP, and other supported images in a Gulp pipeline using the official [Tinify API](https://tinypng.com/developers).

`gulp-tinypng-extended` is a Gulp plugin that sends image files to Tinify/TinyPNG, receives the optimized result, and returns it to your Gulp stream. It includes signature caching, retries, metadata preservation, parallel processing, useful logging, and safe handling of failed files.

## Why use this plugin?

- Integrates directly into an existing Gulp 4 workflow.
- Uses the maintained official [`tinify`](https://www.npmjs.com/package/tinify) Node.js client instead of an obsolete custom HTTP stack.
- Avoids recompressing unchanged files with an optional signature file.
- Supports concurrent processing for faster builds.
- Can write compressed files to the Gulp destination or overwrite the originals.
- Preserves selected metadata when required.
- Handles API errors without stopping the entire image pipeline when used with `gulp-plumber`.
- Includes retry support for temporary Tinify/API and network failures.
- Works with PNG and JPEG files and can process other formats supported by the Tinify API when they are included in the source glob.

## Requirements

- Node.js `14` or newer
- Gulp 4 or a compatible current Gulp release
- A [Tinify API key](https://tinypng.com/developers)

Tinify uploads image data to its API for processing. Do not use this plugin for images that must not leave your build environment.

## Installation

Install the plugin in your Gulp project:

```sh
npm install --save-dev gulp-tinypng-extended
```

## Quick start

Set the API key in your environment rather than committing it to your repository:

```sh
export TINYPNG_KEY=your_api_key
```

Create or update your `gulpfile.js`:

```js
const path = require('node:path');
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const tinypng = require('gulp-tinypng-extended');

const paths = {
  images: path.join(__dirname, 'src/images/**/*.{png,jpg,jpeg}'),
  destination: path.join(__dirname, 'dist/images'),
  signatures: path.join(__dirname, '.tinypng-sigs')
};

function compressImages() {
  if (!process.env.TINYPNG_KEY) {
    throw new Error('Set TINYPNG_KEY before running the compress task.');
  }

  return gulp.src(paths.images, { base: path.join(__dirname, 'src/images') })
    .pipe(plumber())
    .pipe(tinypng({
      key: process.env.TINYPNG_KEY,
      sigFile: paths.signatures,
      summarize: true,
      log: true
    }))
    .pipe(gulp.dest(paths.destination));
}

gulp.task('images', compressImages);
```

Run the task:

```sh
npx gulp images
```

The first run uploads each image. Later runs skip images whose source content has not changed when `sigFile` is enabled.

## Features

### Signature caching

Use `sigFile` to store an MD5 signature for each processed source image:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  sigFile: '.tinypng-sigs'
})
```

Commit the signature file if you want the cache to be shared by your team or CI builds. The signature is based on the source image, so changing the source causes it to be compressed again.

If the source and destination are the same, set `sameDest: true` so signatures are calculated against the compressed destination file correctly:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  sigFile: '.tinypng-sigs',
  sameDest: true
})
```

### Force processing

Force all files to be processed again:

```sh
npx gulp images --force
```

Force files matching a glob:

```sh
npx gulp images --force 'icons/*.png'
```

The `force` option can also be set in the plugin configuration:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  force: true
})
```

### Ignore files

Skip files matching a glob:

```sh
npx gulp images --ignore '**/icons/*.png'
```

Or configure it in the task:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  ignore: '**/icons/*.png'
})
```

### Preserve metadata

Tinify removes most metadata by default to achieve smaller files. Preserve copyright and creation metadata with:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  keepMetadata: true
})
```

Preserving metadata can increase the output size. The official Tinify client also supports location metadata; this plugin currently preserves the existing project behavior of requesting copyright and creation metadata.

### Write to a destination or overwrite the source

By default, compressed files are pushed into the Gulp stream and can be written with `gulp.dest()`:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  keepOriginal: true
})
```

To overwrite the original file instead, set `keepOriginal: false`:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  keepOriginal: false
})
```

When overwriting, the `gulp.dest()` output path is not used for the compressed file.

### Parallel processing

Parallel processing is enabled by default:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  parallel: true,
  parallelMax: 5
})
```

Increase `parallelMax` carefully. Every uploaded image consumes Tinify API quota, and aggressive concurrency may trigger rate limits.

Disable parallel processing when deterministic sequential behavior is preferred:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  parallel: false
})
```

### Logging and summaries

Enable per-file logging:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  log: true
})
```

Print a summary after processing:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  summarize: true
})
```

The older spelling `summarise` is also accepted for compatibility.

Example summary:

```text
Skipped: 2 images, Retries: 0, Compressed: 4 images, Savings: 18.42 KB (ratio: 0.6832)
```

## Configuration reference

Call the plugin with an options object or pass the API key directly as a string:

```js
tinypng({ key: process.env.TINYPNG_KEY });
```

```js
tinypng(process.env.TINYPNG_KEY);
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `key` | `string` | `''` | Tinify API key. Required. |
| `sigFile` | `string \| false` | `false` | File used to store source signatures. |
| `sameDest` | `boolean` | `false` | Use when source and destination are the same path. |
| `keepOriginal` | `boolean` | `true` | Push the compressed file into the stream. Set to `false` to overwrite the source. |
| `keepMetadata` | `boolean` | `false` | Preserve copyright and creation metadata. |
| `force` | `boolean \| string` | `false` | Process all files or files matching a glob regardless of signatures. |
| `ignore` | `boolean \| string` | `false` | Skip all files or files matching a glob. |
| `parallel` | `boolean` | `true` | Process files concurrently. |
| `parallelMax` | `integer` | `5` | Maximum number of concurrent files. |
| `retryAttempts` | `integer` | `10` | Maximum attempts for temporary API/network failures. |
| `retryDelay` | `integer` | `10000` | Delay in milliseconds between retry attempts. |
| `log` | `boolean` | `false` | Log processing messages and errors. |
| `summarize` | `boolean` | `false` | Print processing statistics when the stream completes. |
| `summarise` | `boolean` | `false` | Compatibility alias for `summarize`. |

## Error handling

The plugin emits errors through the stream. Use `gulp-plumber` if one failed image should not terminate the complete Gulp process:

```js
const plumber = require('gulp-plumber');

return gulp.src('src/images/**/*.{png,jpg,jpeg}')
  .pipe(plumber())
  .pipe(tinypng({ key: process.env.TINYPNG_KEY }))
  .pipe(gulp.dest('dist/images'));
```

The official Tinify client classifies API failures as account, client, server, or connection errors. Temporary server and connection failures are retried according to `retryAttempts` and `retryDelay`. Invalid image data and account problems should be fixed rather than retried indefinitely.

## API key security

Never commit an API key to `gulpfile.js`, source control, test fixtures, or published configuration.

Recommended approaches include:

```sh
export TINYPNG_KEY=your_api_key
```

or loading the key from your CI secret store.

The plugin uses the official Tinify client and HTTPS certificate verification. Images are uploaded to the Tinify API, so review Tinify's terms and your project's data-handling requirements before using the plugin in production.

## Major update: official Tinify API client

The current development line replaces the former custom HTTP implementation with the official [`tinify`](https://www.npmjs.com/package/tinify) Node.js client.

### What changed

- Removed the deprecated `request` and `requestretry` dependencies.
- Added `tinify@1.8.3` as the API client.
- Removed the custom upload/download HTTP code.
- Removed the insecure `strictSSL: false` behavior.
- Uses the official Tinify API error classes and retry implementation.
- Uses the official API response `Location` header and buffer-based compression flow.
- Preserves the Gulp/Vinyl stream layer, signature caching, logging, summaries, and project-specific options.
- Updated the test mocks to model real Tinify API responses.
- Updated Nock for compatibility with current Node.js versions.
- Updated `minimatch` to a maintained 5.x release, resolving the production ReDoS advisory.
- Raised the minimum Node.js version from 10 to 14 because the current Tinify client requires Node.js 14 or newer.

### Compatibility notes

This is a major internal transport change and is intended for the `4.0.0` release.

Most documented Gulp options remain available. The following behavior is intentionally different from the old implementation:

- The official client performs compression as a single buffer-based operation rather than exposing separate upload and download HTTP stages.
- Official Tinify error types and messages are now used as the source of API error details.
- The official API requires the upload response `Location` header; custom mocks and integrations must model that response correctly.
- Direct use of undocumented internal `request.upload()` and `request.download()` methods should not be relied upon. Use the Gulp plugin stream API instead.
- Node.js versions older than 14 are no longer supported.

### Migration checklist

1. Upgrade Node.js to version 14 or newer.
2. Replace any direct dependency on the old `request` or `requestretry` behavior in integrations.
3. Continue passing the API key through `key` or `TINYPNG_KEY`.
4. Keep using `sigFile`, `keepMetadata`, `keepOriginal`, `force`, `ignore`, and the other documented plugin options.
5. Update tests to mock the official Tinify API flow, including the `Location` response header.
6. Do not depend on the plugin's internal object structure; it is not part of the public API.

## Development

Install dependencies:

```sh
npm install
```

Run tests:

```sh
npm test
```

Run tests with coverage:

```sh
npm run coverage
```

Run the linter:

```sh
npm run lint
```

The repository also contains a small end-to-end demo project in [`../gulp-tinypng-extended-demo`](../gulp-tinypng-extended-demo). A live demo run requires a real API key and consumes Tinify quota.

## License

MIT © [Gregor Panek](https://github.com/nymo)

See [LICENSE](LICENSE) for the complete license text.
