import through from 'through2';
import throughParallel from 'through2-concurrent';
import chalk from 'ansi-colors';
import tinify from 'tinify';
import util from 'node:util';

import fs from 'node:fs';
import PluginError from 'plugin-error';
import minimist from 'minimist';
import log from 'fancy-log';
import { DEFAULT_OPTIONS, normalizeOptions, TinyPNGOptions } from './options';
import createStats from './stats';
import createSignatureStore from './signature-store';
import createUtils from './utils';

const test = process.env.NODE_ENV === 'test';
const parseArgs = minimist(process.argv.slice(2));
const PLUGIN_NAME = 'gulp-tinypng-extended';
interface PluginInstance {
    stream(): NodeJS.ReadWriteStream;
}

type ValidationCallback = (error?: Error) => void;

interface TinypngPlugin {
    (options: string | TinyPNGOptions): NodeJS.ReadWriteStream;
    validate(key: string): Promise<void>;
    validate(key: string, callback: ValidationCallback): void;
}

function TinyPNG(opt: string | TinyPNGOptions): NodeJS.ReadWriteStream;
function TinyPNG(opt: unknown, obj?: boolean): unknown {

    if(!(this instanceof TinyPNG)) {
        const instance = Object.create(TinyPNG.prototype) as PluginInstance;
        TinyPNG.call(instance, opt, true);
        return test ? instance : instance.stream();
    }

    const getPlugin = () => this;

    this.conf = {
        token: null,
        options: Object.assign({}, DEFAULT_OPTIONS)
    };

    this.stats = createStats();

    this.init = function(opt) {
        opt = normalizeOptions(opt, parseArgs);

        if(!opt.key) throw new PluginError(PLUGIN_NAME, 'Missing API key!');

        this.conf.options = opt; // export opts

        this.conf.token = Buffer.from('api:' + opt.key).toString('base64'); // compatibility value
        tinify.key = opt.key;
        if(tinify.Client) {
            const client = tinify.Client as typeof tinify.Client & { RETRY_COUNT: number; RETRY_DELAY: number };
            client.RETRY_COUNT = Math.max(0, opt.retryAttempts - 1);
            client.RETRY_DELAY = opt.retryDelay;
        }
        this.hash = new this.hasher(opt.sigFile).populate(); // init hasher class

        return this;
    };

    this.stream = function() {
        const getStream = () => this,
            opt = this.conf.options;

        return (opt.parallel ? throughParallel : through).obj({maxConcurrency: opt.parallelMax}, function(file, enc, cb) {
            if(getStream().utils.glob(file, opt.ignore)) return cb();

            if(file.isNull()) {
                return cb();
            }

            if(file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported'));
                return cb();
            }

            if(file.isBuffer()) {
                let hash = null;

                if(opt.sigFile && !getStream().utils.glob(file, opt.force)) {
                    const result = getStream().hash.compare(file);

                    hash = result.hash;

                    if(result.match) {
                        getStream().utils.log('[skipping] ' + chalk.green('✔ ') + file.relative);
                        getStream().stats.skipped++;

                        return cb();
                    }
                }

                getStream().request(file).get(function(err, tinyFile) {
                    if(err) {
                        this.emit('error', new PluginError(PLUGIN_NAME, err));
                        return cb();
                    }

                    getStream().utils.log('[compressing] ' + chalk.green('✔ ') + file.relative + chalk.gray(' (done)'));
                    getStream().stats.compressed++;

                    getStream().stats.total.in += file.contents.toString().length;
                    getStream().stats.total.out += tinyFile.contents.toString().length;

                    if(opt.sigFile) {
                        const curr = {
                            file: file,
                            hash: hash
                        };

                        if(opt.sameDest) {
                            curr.file = tinyFile;
                            curr.hash = getStream().hash.calc(tinyFile);
                        }

                        getStream().hash.update(curr.file, curr.hash);
                    }
                    if (opt.keepOriginal === false) {
                        fs.writeFileSync(file.path, tinyFile.contents);
                    } else {
                        this.push(tinyFile);
                    }

                    return cb();
                }.bind(this)); // maintain stream context
            }
        })
        .on('error', function(err) {
            console.log(err.message);
            getStream().stats.skipped++;
            getStream().utils.log(err.message);
        })
        .on('end', function() {
            if(opt.sigFile) {
                // write sigs after complete or but also when error occured in order to keep track of already compressed files
                getStream().hash.write();
            }
            if(opt.summarize) {
                const stats = getStream().stats;
                let info = util.format('Skipped: %s image%s, Retries: %s, Compressed: %s image%s, Savings: %s (ratio: %s)',
                        stats.skipped,
                        stats.skipped == 1 ? '' : 's',
                        stats.retries,
                        stats.compressed,
                        stats.compressed == 1 ? '' : 's',
                        (getStream().utils.prettySize(stats.total.in - stats.total.out)),
                        (stats.total.in ? Math.round(stats.total.out / stats.total.in * 10000) / 10000 : 0)
                    );

                if(typeof stats.compressionCount === 'number') {
                    info += util.format(', Monthly compressions: %s', stats.compressionCount);
                }

                getStream().utils.log(info, true);

                if(stats.retries > 0) {
                    getStream().utils.log('Retry Attempts:', true);
                    stats.retried.forEach(function(item) {
                        getStream().utils.log(item.file + ': ' + item.attempts + ' attempts', true);
                    });
                }
            }
        });
    };

    this.request = function(file) {
        const getRequest = () => this;
        let compressed;

        return {
            file: file,

            upload: function(cb) {
                const file = this.file;
                if(!file || !file.contents || file.contents.length === 0) {
                    return cb(new Error('Error: Empty or broken images could not be send ' + (file && file.relative || '')));
                }

                try {
                    let source = tinify.fromBuffer(file.contents);
                    if(getRequest().conf.options.keepMetadata) {
                        source = source.preserve('copyright', 'creation', 'location');
                    }

                    source.toBuffer().then(function(data) {
                        compressed = Buffer.from(data);
                        if(typeof tinify.compressionCount === 'number') {
                            getPlugin().stats.compressionCount = tinify.compressionCount;
                        }
                        cb(null, {
                            url: true,
                            count: tinify.compressionCount || 0
                        });
                    }).catch(function(err) {
                        cb(getPlugin().utils.apiError(err, file));
                    });
                } catch(err) {
                    cb(getPlugin().utils.apiError(err, file));
                }
            },

            download: function(url, cb) {
                if(compressed) return cb(null, compressed);
                cb(new Error('No compressed image is available for ' + (url || file.relative)));
            },

            handler: function(data, status) {
                return new Error((data.error || 'Unknown') + ' (' + status + '): ' + (data.message || 'No message returned') + ' for ' + file.relative);
            },

            get: function(cb) {
                const getRequest = () => this;
                const file = this.file;

                getRequest().upload(function(err) {
                    if(err) return cb(err, file);

                    const tinyFile = file.clone();
                    tinyFile.contents = compressed;
                    cb(null, tinyFile);
                });

                return this;
            }
        };
    };

    this.hasher = createSignatureStore;

    this.utils = createUtils({
        getOptions: function() {
            return getPlugin().conf.options;
        },
        logger: log,
        pluginName: PLUGIN_NAME
    });

    return (obj || test) ? this.init(opt) : this.init(opt).stream();
}

const plugin = TinyPNG as unknown as TinypngPlugin;

plugin.validate = ((key: string, callback?: ValidationCallback): Promise<void> | void => {
    tinify.key = key;

    if (callback) {
        tinify.validate().then(() => callback(), callback);
        return;
    }

    return tinify.validate();
}) as TinypngPlugin['validate'];

export = plugin;
