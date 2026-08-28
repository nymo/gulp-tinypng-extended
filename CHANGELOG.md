# Changelog

All notable changes to `gulp-tinypng-extended` are documented here.

## [Unreleased]

Changes committed after `v3.0.1`:

- Updated vulnerable dependencies, including `ini`, `brace-expansion`, `lodash`, `minimist`, `mkdirp`, `json-schema`, `jsprim`, `y18n`, and `path-parse`.
- Added CodeQL analysis configuration.
- Migrated the test suite from Mocha/Chai to Vitest.
- Added ESLint and refreshed project metadata and tooling.
- Added pull-request test pipeline configuration and updated project documentation.
- Recorded `3.0.2` and `3.0.3` release commits; these versions do not have corresponding tags in the repository.
- Added the official Tinify client for API communication and removed the deprecated request stack.
- Migrated the implementation to TypeScript with compiled CommonJS output and declarations.
- Added explicit AVIF and WebP input support in the example and demo pipelines.
- Added Tinify's monthly compression count to summarized output.
- Added explicit promise and callback APIs for Tinify API-key validation.

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

[Unreleased]: https://github.com/nymo/gulp-tinypng-extended/compare/v3.0.1...HEAD
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
