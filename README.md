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
- Preserves copyright, creation, and JPEG GPS metadata when requested.
- Handles API errors without stopping the entire image pipeline when used with `gulp-plumber`.
- Includes retry support for temporary Tinify/API and network failures.
- Supports PNG, JPEG, WebP, and AVIF input when those extensions are included in the source glob.
- Reports Tinify's current monthly compression count in build summaries, helping teams monitor API usage and quota.
- Provides an explicit API-key validation method for CI and preflight checks.

## Standout features

### Modern image-format support

Process modern image assets alongside traditional formats in the same Gulp task:

```js
gulp.src('src/images/**/*.{png,jpg,jpeg,webp,avif}')
  .pipe(tinypng({ key: process.env.TINYPNG_KEY }))
  .pipe(gulp.dest('dist/images'));
```

WebP and AVIF files are sent to the official Tinify API as buffers and returned through the normal Vinyl stream. Existing paths and extensions are preserved, so adding modern formats does not require a separate pipeline.

### GPS metadata preservation

Set `keepMetadata: true` to preserve the metadata supported by Tinify, including copyright information, creation date, and GPS location data for JPEG images:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  keepMetadata: true
})
```

GPS location metadata is supported for JPEG files. Metadata preservation can increase the output size and should only be enabled when the information is required.

### Built-in API usage visibility

Enable `summarize: true` to see both file savings and the Tinify account's current monthly compression count:

```text
Skipped: 2 images, Retries: 0, Compressed: 4 images, Savings: 18.42 KB (ratio: 0.6832), Monthly compressions: 27
```

This makes API usage visible in local builds and CI logs without requiring a separate Tinify API request. The monthly count is account-wide, not limited to the current task.

## Requirements

- Node.js `14` or newer
- Gulp 4 or a compatible current Gulp release
- A [Tinify API key](https://tinypng.com/developers)
- An image source that preserves binary file contents (use `encoding: false` with `gulp.src()`)

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
  images: path.join(__dirname, 'src/images/**/*.{png,jpg,jpeg,webp,avif}'),
  destination: path.join(__dirname, 'dist/images'),
  signatures: path.join(__dirname, '.tinypng-sigs')
};

function compressImages() {
  if (!process.env.TINYPNG_KEY) {
    throw new Error('Set TINYPNG_KEY before running the compress task.');
  }

  return gulp.src(paths.images, {
    base: path.join(__dirname, 'src/images'),
    // Images must remain binary Buffers; do not decode them as UTF-8.
    encoding: false
  })
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

The first run uploads each image. Later runs skip images whose source content has not changed when `sigFile` is enabled. The plugin preserves each file's original path and extension; it does not convert or resize images.

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

Tinify removes most metadata by default to achieve smaller files. Preserve copyright, creation, and JPEG GPS location metadata with:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  keepMetadata: true
})
```

Preserving metadata can increase the output size. GPS location metadata is supported for JPEG images; it is not added to formats where Tinify does not support location metadata.

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
Skipped: 2 images, Retries: 0, Compressed: 4 images, Savings: 18.42 KB (ratio: 0.6832), Monthly compressions: 27
```

`Monthly compressions` is the account-wide compression count returned by Tinify for the current month. It is not the number of files processed by the current Gulp stream. The value is shown when Tinify returns it and `summarize` is enabled.

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
| `keepMetadata` | `boolean` | `false` | Preserve copyright, creation, and JPEG GPS location metadata. |
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

## Validate an API key

Use `tinypng.validate()` to perform an explicit Tinify API-key and connectivity check before starting a build. It supports both promises and callbacks:

```js
const tinypng = require('gulp-tinypng-extended');

await tinypng.validate(process.env.TINYPNG_KEY);
console.log('Tinify API key is valid.');
```

Callback form:

```js
tinypng.validate(process.env.TINYPNG_KEY, function(error) {
  if (error) throw error;
  console.log('Tinify API key is valid.');
});
```

Validation is opt-in and makes an API request. It is useful in CI or deployment preflight checks, but it is not run automatically for every Gulp task.

## Version 4.0.0: official Tinify API client

`4.0.0` is the modernized release of `gulp-tinypng-extended`. It replaces the former custom HTTP implementation with the official [`tinify`](https://www.npmjs.com/package/tinify) Node.js client and establishes a maintained TypeScript-based foundation for the plugin.

### What changed in 4.0.0

- Replaced the deprecated `request` and `requestretry` dependencies with `tinify@1.8.3`.
- Removed the custom TinyPNG upload/download HTTP implementation.
- Removed the insecure `strictSSL: false` behavior.
- Uses the official Tinify API error classes and retry implementation.
- Uses the official API response `Location` header and buffer-based compression flow.
- Added TypeScript source, compiled CommonJS output, and TypeScript declarations.
- Added explicit support for PNG, JPEG, WebP, and AVIF input files.
- Added JPEG GPS location metadata preservation through `keepMetadata`.
- Added account-wide monthly compression count reporting to summarized output.
- Added opt-in API-key validation through `tinypng.validate()`.
- Preserved the Gulp/Vinyl stream layer, signature caching, logging, summaries, retries, and project-specific options.
- Updated `minimatch` to a maintained 5.x release to resolve the production ReDoS advisory.
- Updated the test suite and demo application for the official client flow.
- Updated the minimum supported Node.js version to `14`.

### Compatibility notes

Most documented Gulp options remain available in `4.0.0`. The following changes are intentional:

- The official client performs compression as a single buffer-based operation rather than exposing separate upload and download HTTP stages.
- Tinify error types and messages are now used as the source of API error details.
- The official API requires the upload response `Location` header; tests and custom API mocks must model the official response correctly.
- Direct use of undocumented internal `request.upload()` and `request.download()` methods is no longer supported. Use the Gulp plugin stream API instead.
- Node.js versions older than `14` are no longer supported.
- Input files must reach the plugin as binary Buffers. When using `gulp.src()`, set `encoding: false`; decoding PNG/JPEG/WebP/AVIF data as UTF-8 corrupts the image and can result in HTTP 415 errors.

## Migrating from 3.0.3 to 4.0.0

### 1. Upgrade Node.js

Version `4.0.0` requires Node.js `14` or newer:

```sh
node --version
```

Upgrade Node.js before installing the new release if the command reports a version below `14`.

### 2. Update the package

Update the dependency in your project:

```sh
npm install --save-dev gulp-tinypng-extended@4
```

Or install the exact release:

```sh
npm install --save-dev gulp-tinypng-extended@4.0.0
```

### 3. Keep your existing Gulp configuration

The normal Gulp integration remains compatible:

```js
const gulp = require('gulp');
const tinypng = require('gulp-tinypng-extended');

function compressImages() {
  return gulp.src('src/images/**/*.{png,jpg,jpeg,webp,avif}')
    .pipe(tinypng({
      key: process.env.TINYPNG_KEY,
      sigFile: '.tinypng-sigs',
      keepMetadata: true,
      summarize: true
    }))
    .pipe(gulp.dest('dist/images'));
}

gulp.task('images', compressImages);
```

The existing options `key`, `sigFile`, `sameDest`, `keepOriginal`, `keepMetadata`, `force`, `ignore`, `parallel`, `parallelMax`, `retryAttempts`, `retryDelay`, `log`, `summarize`, and `summarise` remain available.

### 4. Review API-key and error handling

Continue supplying the key through an environment variable or CI secret:

```sh
export TINYPNG_KEY=your_api_key
```

If your build scripts inspect exact error messages from `3.0.3`, update them to handle the official Tinify error classes and the new plugin error context instead.

You can add an optional preflight validation step:

```js
const tinypng = require('gulp-tinypng-extended');

async function validateTinify() {
  await tinypng.validate(process.env.TINYPNG_KEY);
}
```

Validation is opt-in and should not be added automatically to every build unless the extra API request is intentional.

### 5. Review custom tests and mocks

Tests that use the documented Gulp stream API should normally continue to work. Tests that exercise the old internal HTTP methods must be updated or removed.

The official API flow should be mocked with:

- A `POST /shrink` response containing a `Location` header
- A subsequent response for the compressed image, where applicable
- Official Tinify error status codes and response formats

Do not use a live API key in automated tests.

### 6. Use the new format and metadata features

Add modern formats to your source glob when required:

```js
gulp.src('src/images/**/*.{png,jpg,jpeg,webp,avif}')
```

Enable GPS location, copyright, and creation metadata preservation with:

```js
tinypng({
  key: process.env.TINYPNG_KEY,
  keepMetadata: true
})
```

GPS location preservation applies to JPEG images supported by Tinify.

## Development

The TypeScript source is located in `src/`. The compiled CommonJS JavaScript and declaration files are generated in `dist/`; this directory is created during builds and npm packaging.

Install dependencies:

```sh
npm install
```

Build the TypeScript source:

```sh
npm run build
```

Run tests. The test command builds the project first:

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

Check the files that will be published:

```sh
npm pack --dry-run
```


## License

MIT © [Gregor Panek](https://github.com/nymo)

See [LICENSE](LICENSE) for the complete license text.
