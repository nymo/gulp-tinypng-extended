import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const fs = require('node:fs');
const nock = require('nock');
const Vinyl = require('vinyl');
const TinyPNG = require('../index');

const key = 'coverage-test-key';
const image = fs.readFileSync(new URL('./assets/image.png', import.meta.url));

function file(contents = image, path = 'image.png') {
  return new Vinyl({ path, contents });
}

function streamResult(stream) {
  return new Promise((resolve, reject) => {
    const files = [];
    stream.on('data', (item) => files.push(item));
    stream.on('error', reject);
    stream.on('end', () => resolve(files));
  });
}

function runStream(instance, item) {
  const stream = instance.stream();
  const result = streamResult(stream);
  stream.end(item);
  return result;
}

function mockSuccessfulApi(options = {}) {
  nock('https://api.tinify.com')
    .post('/shrink')
    .reply(201, { output: { url: 'https://api.tinify.com/output' } }, {
      location: 'https://api.tinify.com/output',
      'compression-count': '1',
      ...(options.uploadHeaders || {})
    });
  nock('https://api.tinify.com').get('/output').reply(200, fs.readFileSync(new URL('./assets/image_small.png', import.meta.url)));
}

afterEach(() => nock.cleanAll());

describe('additional TinyPNG coverage', () => {
  it('handles option aliases and utility edge cases', () => {
    const instance = new TinyPNG({ key, summarise: true });

    expect(instance.conf.options.summarize).toBe(true);
    expect(instance.utils.glob(file(), true)).toBe(true);
    expect(instance.utils.glob(file(), false)).toBe(false);
    expect(instance.utils.glob(file(), '[')).toBe(false);
    expect(instance.utils.prettySize(0)).toBe('0.00 B');
    expect(instance.utils.prettySize(1024)).toBe('1.00 KB');
    expect(instance.utils.log('hidden')).toBe(instance.utils);
    expect(new TinyPNG({ key, log: true }).utils.log('visible')).toBeDefined();
  });

  it.each(['webp', 'avif'])('compresses %s files through the official Tinify client', async (format) => {
    mockSuccessfulApi();
    const instance = new TinyPNG({ key, retryAttempts: 1 });
    const result = await runStream(instance, file(image, `image.${format}`));

    expect(result).toHaveLength(1);
    expect(result[0].relative).toBe(`image.${format}`);
    expect(result[0].contents).toEqual(fs.readFileSync(new URL('./assets/image_small.png', import.meta.url)));
    expect(instance.stats.compressionCount).toBe(1);
  });

  it('handles successful upload metadata preservation', async () => {
    mockSuccessfulApi();
    nock('https://api.tinify.com')
      .post('/output', { preserve: ['copyright', 'creation', 'location'] })
      .reply(201, fs.readFileSync(new URL('./assets/image_small.png', import.meta.url)));
    const instance = new TinyPNG({ key, keepMetadata: true, retryAttempts: 1 });
    const result = await new Promise((resolve, reject) => instance.request(file()).get((error, data) => error ? reject(error) : resolve(data)));

    expect(result.contents).toEqual(fs.readFileSync(new URL('./assets/image_small.png', import.meta.url)));
  });

  it.each([
    ['invalid JSON', () => nock('https://api.tinify.com').post('/shrink').reply(500, 'not-json'), /ParseError/],
    ['API error', () => nock('https://api.tinify.com').post('/shrink').reply(429, { error: 'TooManyRequests', message: 'slow down' }), /TooManyRequests/],
    ['invalid response', () => nock('https://api.tinify.com').post('/shrink').reply(400, { error: 'BadRequest', message: 'invalid image' }), /BadRequest/],
    ['empty response', () => nock('https://api.tinify.com').post('/shrink').reply(500), /ParseError/]
  ])('reports %s upload responses', async (_name, mock, expected) => {
    mock();
    const instance = new TinyPNG({ key, retryAttempts: 1 });
    const error = await new Promise((resolve) => instance.request(file()).upload((uploadError) => resolve(uploadError)));

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(expected);
  });



  it('returns the request file when get cannot upload or download', async () => {
    const uploadError = await new Promise((resolve) => new TinyPNG({ key }).request(file(null)).get((error, original) => resolve({ error, original })));
    expect(uploadError.error).toBeInstanceOf(Error);
    expect(uploadError.original.path).toContain('image.png');

    nock('https://api.tinify.com').post('/shrink').reply(502, { error: 'ServerError', message: 'temporary failure' });
    const instance = new TinyPNG({ key, retryAttempts: 1, retryDelay: 0 });
    const downloadError = await new Promise((resolve) => instance.request(file()).get((error, original) => resolve({ error, original })));
    expect(downloadError.error).toBeInstanceOf(Error);
    expect(downloadError.original.path).toContain('image.png');
  });

  it('supports null files, streams, ignored files, and overwriting originals', async () => {
    const overwritePath = new URL('./assets/overwrite.png', import.meta.url);
    const instance = new TinyPNG({ key, keepOriginal: false, ignore: '*ignored.png', parallel: false });
    const nullFile = file(null, 'null.png');
    const streamFile = file(Readable.from(image), 'stream.png');
    const ignoredFile = file(image, 'ignored.png');

    const nullStream = instance.stream();
    await new Promise((resolve) => nullStream.write(nullFile, resolve));
    nullStream.destroy();

    const stream = instance.stream();
    const streamError = new Promise((resolve) => stream.once('error', resolve));
    stream.write(streamFile);
    expect((await streamError).message).toMatch(/Streams not supported/);
    stream.destroy();

    const ignoredStream = instance.stream();
    await new Promise((resolve) => ignoredStream.write(ignoredFile, resolve));
    ignoredStream.destroy();

    mockSuccessfulApi();
    const output = instance.stream();
    output.end(file(image, overwritePath.pathname));
    await new Promise((resolve, reject) => {
      output.once('error', reject);
      output.once('finish', resolve);
    });
    expect(fs.readFileSync(overwritePath)).toEqual(fs.readFileSync(new URL('./assets/image_small.png', import.meta.url)));
    fs.unlinkSync(overwritePath);
  }, 30000);

  it('uses stream mode when NODE_ENV is not test', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'normal';
    delete require.cache[require.resolve('../index')];
    const stream = require('../index')({ key });
    expect(stream).toHaveProperty('write');
    stream.destroy();
    process.env.NODE_ENV = previous;
    delete require.cache[require.resolve('../index')];
    require('../index');
  });

  it('skips matching signatures and writes signatures after compression', async () => {
    const instance = new TinyPNG({ key, sigFile: '.coverage-sigs', summarize: true });
    const source = file();
    const hash = instance.hash.calc(source);
    instance.hash.update(source, hash);
    instance.hash.write();

    const skipped = await runStream(instance, source);
    expect(skipped).toHaveLength(0);
    expect(instance.stats.skipped).toBe(1);
    if (fs.existsSync('.coverage-sigs')) fs.unlinkSync('.coverage-sigs');
  });
});
