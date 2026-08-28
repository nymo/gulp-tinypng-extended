# Changelog

All notable changes to `gulp-tinypng-extended` are documented here.

## [v4.0.0]

Version 4.0.0 modernizes the plugin around the official Tinify API client while preserving the existing Gulp/Vinyl stream integration and documented options wherever possible.

### Breaking changes and compatibility notes

- Requires Node.js `14` or newer; older Node.js versions are no longer supported.
- Replaced the deprecated `request` and `requestretry` dependencies with `tinify@1.8.3`.
- Removed the custom upload/download HTTP implementation and the insecure `strictSSL: false` behavior.
- Compression now uses the official client’s single buffer-based operation rather than separate upload and download HTTP stages.
- Tinify error classes and messages are now the source of API error details, and temporary server or connection failures are retried through the official client.
- The official API upload response must provide its `Location` header; tests and custom API mocks must model this response correctly.
- Direct use of undocumented internal `request.upload()` and `request.download()` methods is no longer supported. Use the Gulp plugin stream API instead.

### Features and improvements

- Migrated the implementation to TypeScript with compiled CommonJS output and TypeScript declarations.
- Added explicit PNG, JPEG, WebP, AVIF, and other supported image input handling when those extensions are included in the source glob.
- Added JPEG GPS location metadata preservation through `keepMetadata`, alongside copyright and creation metadata.
- Added account-wide monthly Tinify compression count reporting to summarized output.
- Added opt-in API-key validation through `tinypng.validate()`, with both promise and callback APIs for CI and deployment preflight checks.
- Preserved signature caching, including `sameDest` handling, to avoid recompressing unchanged files.
- Preserved parallel processing, logging, summaries, retry configuration, `keepOriginal`, metadata options, and safe handling of failed files.
- Updated the example and demo pipelines for modern image formats and the official client flow.

### Security and maintenance

- Updated vulnerable dependencies, including `ini`, `brace-expansion`, `lodash`, `minimist`, `mkdirp`, `json-schema`, `jsprim`, `y18n`, and `path-parse`.
- Updated `minimatch` to a maintained 5.x release to resolve the production ReDoS advisory.
- Added CodeQL analysis configuration.
- Migrated the test suite from Mocha/Chai to Vitest.
- Added ESLint, TypeScript ESLint support, refreshed project metadata and tooling, and added pull-request test pipeline configuration.
- Recorded `3.0.2` and `3.0.3` release commits; these versions do not have corresponding tags in the repository.

## [v3.0.1] - 2020-10-05

- Published version 3.0.1.

## [v3.0.0] - 2020-10-04

- Updated the yargs parser dependency.
- Published version 3.0.0.

## [v2.0.2] - 2019-09-20

- Fixed reported security issues.
- Published version 2.0.2.

## [v2.0.1] - 2019-03-19

- Made the file write synchronous when `keepOriginal` is `false`.
- Published version 2.0.1.

## [v2.0.0] - 2019-03-02

### Breaking changes

- Raised the minimum supported Node.js version from `0.10` to `6`.
- Updated the project to Gulp 4 conventions; existing Gulp 3 task definitions may need migration.
- Removed `gulp-util` and replaced its APIs with separate packages. Consumers relying on the plugin’s internal `gulp-util` behavior should review their integration.

### Changes

- Replaced the deprecated `gulp-util` dependency.
- Updated dependencies.
- Published version 2.0.0.

## [v1.5.0] - 2017-03-03

- Added retry attempts for failed uploads.
- Added error handling for downloaded image buffers.
- Skipped broken and empty images.
- Updated documentation.
- Published version 1.5.0.

## [v1.4.3] - 2017-02-09

- Added retry handling for gateway errors.
- Ensured the signature file is written for successfully compressed files when an error occurs.
- Updated the TinyPNG API URL.
- Published version 1.4.3.

## [v1.4.0] - 2017-01-13

### Breaking changes

- The package was renamed from `gulp-tinypng-compress` to `gulp-tinypng-extended`; consumers must update their dependency, `require()` path, and related configuration.
- The plugin name used in errors/logging changed to `gulp-tinypng-extended`.


### Changes

- Updated `minimatch` to version 3 to address issue #17.
- Fixed MD5 hashing to use `file.path`.
- Established the fork’s project settings and package name.
- Added the `keepOriginal` option to overwrite the source image.
- Added support for preserving image metadata.
- Published version 1.4.0.

## [1.2.1] - 2016-04-15

- Published version 1.2.1.

## [1.2.0] - 2015-10-29

- Published version 1.2.0.

## [1.1.8] - 2015-07-06

- Published version 1.1.8.

## [1.1.7] - 2015-07-03

- Published version 1.1.7.

## [1.1.6] - 2015-05-08

- Published version 1.1.6.

## [1.1.5] - 2015-04-27

- Added tests.
- Published version 1.1.5.

## [1.1.4] - 2015-04-26

- Fixed the strict SSL issue and object structure break.
- Published version 1.1.4.

## [v1.1.3] - 2015-04-24

### Compatibility note

- The TinyPNG object hierarchy was substantially restructured. The history does not document a public API migration, but integrations that accessed internal object members should be reviewed.

### Changes

- Restructured the TinyPNG object.
- Improved API error handling.
- Added the `log` option.
- Published version 1.1.3.

## [1.1.2] - 2015-04-14

- Fixed uncompressed files being pushed through the stream.
- Published version 1.1.2.

## [1.1.1] - 2015-04-13

- Published version 1.1.1.

[v4.0.0]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/v4.0.0
[v3.0.1]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/v3.0.1
[v3.0.0]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/v3.0.0
[v2.0.2]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/v2.0.2
[v2.0.1]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/v2.0.1
[v2.0.0]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/v2.0.0
[v1.5.0]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/v1.5.0
[v1.4.3]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/v1.4.3
[v1.4.0]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/v1.4.0
[1.2.1]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.2.1
[1.2.0]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.2.0
[1.1.8]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.1.8
[1.1.7]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.1.7
[1.1.6]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.1.6
[1.1.5]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.1.5
[1.1.4]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.1.4
[1.1.3]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.1.3
[1.1.2]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.1.2
[1.1.1]: https://github.com/nymo/gulp-tinypng-extended/releases/tag/1.1.1
