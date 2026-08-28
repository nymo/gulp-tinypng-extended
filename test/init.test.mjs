import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it as vitestIt, beforeAll, afterAll, afterEach, expect } from 'vitest';

const require = createRequire(import.meta.url);

function it(name, test) {
	if (test.length === 0) return vitestIt(name, test);

	return vitestIt(name, function() {
		return new Promise(function(resolve, reject) {
			try {
				test(function(error) {
					try {
						if (error) reject(error);
						else resolve();
					} catch(error) {
						reject(error);
					}
				});
			} catch(error) {
				reject(error);
			}
		});
	}, 30000);
}

process.env.NODE_ENV = 'test';
process.env.NO_PROXY = 'localhost,127.0.0.1';
process.env.no_proxy = process.env.NO_PROXY;

var fs = require('fs'),
	spawn = require('child_process').spawn,
	crypto = require('crypto'),
	nock = require('nock'),
	Vinyl = require('vinyl'),

	dry = process.env.PNG_DRY ? true : false,

	TinyPNG = require('../index'),
	mockTinyPngApi = require('./mock-api');

var key = 'KHOsJMrP6w-X3FVuyXdevV-vCnDDbqo9',
	cwd = fileURLToPath(new URL('.', import.meta.url)), 
	TestFile = function(type) {
		var file = cwd + '/assets/image' + (type ? '_' + type : '') + '.png';

		return new Vinyl({
			path: 'image.png',
			contents: fs.readFileSync(file)
		});
	};

if(dry) console.info('dry flag set, skipping API tests...');

describe('tinypng', function() {
	it('has correct bound object', function() {
		var struct = ['conf', 'init', 'stream', 'request', 'hasher', 'utils', 'hash', 'stats'],
			inst = new TinyPNG(key);

		expect(Object.keys(inst).sort()).toEqual(struct.sort());
	});

	it('transforms key into config object', function() {
		var inst = new TinyPNG('test_string_0');

		expect(inst.conf.options.key).toBe('test_string_0');
	});

	it('init hashing object', function() {
		var struct = ['sigFile', 'sigs', 'calc', 'update', 'compare', 'populate', 'write'],
			inst = new TinyPNG(key);

		expect(Object.keys(inst.hash).sort()).toEqual(struct.sort());
	});

	describe('#init', function() {
		it('sets object configuration', function() {
			var inst = new TinyPNG({
				key: 'test_string_0',
				sigFile: 'test_string_1'
			});

			expect(inst.conf.options.key).toBe('test_string_0');
			expect(inst.conf.options.sigFile).toBe('test_string_1');

			expect(inst.conf.token).toBe(Buffer.from('api:test_string_0').toString('base64'));
		});

		it('throws error on missing API key', function() {
			expect(TinyPNG).to.throw(Error, /missing api key/i);
		});
	});

	describe('#request', function() {
		var struct = ['file', 'upload', 'download', 'handler', 'get'],
			inst = new TinyPNG(key),
			image = new TestFile(),
			empty_image = new TestFile('empty');

		it('returns correct object', function() {
			expect(inst.request()).to.have.all.keys(struct);
			expect(new inst.request()).to.have.all.keys(struct);
		});

		describe('#upload', function() {
			it('uploads and returns object', function(done) {

				if(dry) return done();

				mockTinyPngApi();
				inst.request(image).upload(function(err, data) {
					expect(err).to.not.be.instanceof(Error);
					expect(data).to.have.all.keys(['url', 'count']);

					nock.cleanAll();
					done();
				});
			});

			it('uploads and and tries to retry on bad gateway error', function(done) {

				var gateway = nock('https://api.tinify.com')
								.post('/shrink')
								.reply(502, '<html><head><title>502 Bad Gateway</title></head><body><h1>502 Bad Gateway</h1></body></html>');

				new TinyPNG({key: key, retryAttempts: 1, retryDelay: 0}).request(image).upload(function(err, data) {
					expect(err).to.be.instanceof(Error);
					nock.cleanAll();
					done();
				});

			});

			it('upload empty file should throw error, skip and not break the plugin', function(done) {

				inst.request(empty_image).upload(function(err, data) {
					expect(err).to.be.instanceof(Error);
					expect(err.message).to.equal('Error: Empty or broken images could not be send image.png');
					done();
				});

			});
		});


		describe('#handler', function() {
			it('returns correct unknown error', function() {
				var request = new inst.request(new TestFile());

				expect(request.handler({ error: 'TestError'}, 500).message).to.equal('TestError (500): No message returned for image.png');
				expect(request.handler({ error: 'TestError', message: 'test'}, 500).message).to.equal('TestError (500): test for image.png');
			});
		});

		describe('#get', function() {
			it('returns compressed image', function(done) {

				if(dry) return done();

				mockTinyPngApi();
				inst.request(image).get(function(err, file) {
					expect(err).to.not.be.instanceof(Error);
					expect(file.contents).to.deep.equal(fs.readFileSync(cwd + '/assets/image_small.png'));

					nock.cleanAll();
					done();
				});
			});
		});
	});

	describe('#hasher', function() {
		var struct = ['sigFile', 'sigs', 'calc', 'update', 'compare', 'populate', 'write'],
			inst = new TinyPNG(key),
			hash = new inst.hasher('test/location');

		it('returns correct object', function() {
			expect(inst.hasher()).to.have.all.keys(struct);
			expect(new inst.hasher()).to.have.all.keys(struct);
		});

		it('sets signature file location', function() {
			expect(hash).to.have.property('sigFile', 'test/location');
		});

		describe('#calc', function() {
			it('returns md5 hash', function(done) {
				var file = new TestFile();

				hash.calc(file, function(md5) {
					expect(md5).to.equal(crypto.createHash('md5').update(file.contents).digest('hex'));

					done();
				});
			});
		});

		describe('#update', function() {
			it('updates internal signature cache', function() {
				var file = new TestFile(),
					hash = new inst.hasher();

				hash.update(file, 'test_hash');

				expect(hash.sigs).to.have.property(file.relative, 'test_hash');
				expect(hash.changed).to.equal(true);
			});
		});

		describe('#compare', function() {
			it('compares and succeeds', function(done) {
				var file = new TestFile(),
					hash = new inst.hasher();

				hash.calc(file, function(md5) {
					hash.update(file, md5);

					hash.compare(file, function(result, sig) {
						expect(result).to.equal(true);
						expect(sig).to.equal(md5);

						done();
					});
				});
			});

			it('compares and fails', function(done) {
				var file = new TestFile(),
					hash = new inst.hasher();

				hash.calc(file, function(md5) {
					hash.compare(file, function(result, sig) {
						expect(result).to.equal(false);
						expect(sig).to.equal(md5);

						done();
					});
				});
			});
		});

		describe('#populate', function() {
			afterEach(function() {
				try {
					fs.unlinkSync('.test');
				} catch(err) {}
			});

			it('reads from sig file and populate internal signature cache', function() {
				fs.writeFileSync('.test', JSON.stringify({'test.png': 'test_hash'}));

				var hash = new inst.hasher('.test').populate();

				expect(hash.sigs).to.have.property('test.png', 'test_hash');
			});

			it('fails silently on failed read of sig file', function() {
				var hash = new inst.hasher('.test');

				expect(hash.populate()).to.equal(hash);
			});

			it('doesn\'t error on failed JSON parse', function() {
				var hash = new inst.hasher('/etc/hosts');

				expect(hash.populate).to.not.throw(Error);
				expect(hash.populate()).to.not.be.instanceof(Error);
			});
		});

		describe('#write', function() {
			afterEach(function() {
				try {
					fs.unlinkSync('.test');
				} catch(err) {}
			});

			it('writes signature file with correct data', function() {
				var file = new TestFile(),
					hash = new inst.hasher('.test');

				hash.update(file, 'test_hash');
				hash.write();

				expect(fs.readFileSync('.test').toString()).to.equal(JSON.stringify(hash.sigs));
			});

			it('fails silently on failed write of sig file', function() {
				var file = new TestFile(),
					hash = new inst.hasher();

				hash.update(file, 'test_hash');

				expect(hash.write()).to.equal(hash);
			});
		});
	});

	describe('utils', function() {
		describe('#glob', function() {
			var inst = new TinyPNG(key);

			it('returns proper value on correct glob match', function() {
				var file = new TestFile();

				expect(inst.utils.glob(file, '*ge.png')).to.equal(true);
				expect(inst.utils.glob(file, '*go.png')).to.equal(false);
			});
		});
	});
});

describe('tinypng gulp', function() {
	var target = cwd + '/assets/tmp/image.png';

	beforeAll(function() {
		process.env.TINYPNG_SIGS = true;
		process.env.TINYPNG_KEY = key;
	});

	afterAll(function() {
		process.env.TINYPNG_SIGS = false;
	});

	afterEach(function() {
		try {
			fs.unlinkSync(target); fs.unlinkSync('.sigs');
		} catch(err) {}
	});

	it('returns compressed files', function(done) {
		if(dry) return done();

		var file = new TestFile();

		var sh = spawn('node', ['node_modules/gulp/bin/gulp.js', 'tinypng'], {
			env: Object.assign({}, process.env, {
				NODE_OPTIONS: '--require ' + cwd + '/mock-api-loader.js'
			})
		});

		sh.on('close', function() {
			expect(fs.existsSync(target)).to.equal(true, 'compressed output file created');
			expect(fs.readFileSync(target)).to.have.length.lessThan(file.contents.length);

			done();
		});
	});

	it('ignores files on the cli', function(done) {

		var sh = spawn('node', ['node_modules/gulp/bin/gulp.js', 'tinypng', '--ignore', '*ge.png'], {
			env: Object.assign({}, process.env, {
				NODE_OPTIONS: '--require ' + cwd + '/mock-api-loader.js'
			})
		});

		sh.on('close', function() {
			expect(fs.existsSync(target)).to.equal(false);

			done();
		});
	});

	it('forces files on the cli', function(done) {
		if(dry) return done();

		var inst = new TinyPNG(key),
			hash = new inst.hasher('.sigs'),
			file = new TestFile();

		hash.calc(file, function(md5) {
			hash.update(file, md5);
			hash.write();

			var sh = spawn('node', ['node_modules/gulp/bin/gulp.js', 'tinypng', '--force', '*ge.png'], {
				env: Object.assign({}, process.env, {
					NODE_OPTIONS: '--require ' + cwd + '/mock-api-loader.js'
				})
			});

			sh.on('close', function() {
				expect(fs.existsSync(target)).to.equal(true, 'compressed output file created');
				expect(fs.readFileSync(target)).to.have.length.lessThan(file.contents.length);

				done();
			});
		});
	});
});
