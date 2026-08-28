var test = process.env.NODE_ENV == 'test',
    through = require('through2'),
    throughParallel = require('through2-concurrent'),
    chalk = require('ansi-colors'),
    tinify = require('tinify'),
    path = require('path'),
    util = require('util'),
    fs = require('fs'),
    PluginError = require('plugin-error'),
    parseArgs = require('minimist')(process.argv.slice(2)),
    log = require('fancy-log'),
    optionsModule = require('./options'),
    createStats = require('./stats'),
    SignatureStore = require('./signature-store'),
    createUtils = require('./utils');

var PLUGIN_NAME = 'gulp-tinypng-extended',
    DEFAULT_OPTIONS = optionsModule.DEFAULT_OPTIONS,
    normalizeOptions = optionsModule.normalizeOptions;

/**
 * TinyPNG class

 */
namespace TinyPNG {
    export interface Options {
        key: string;
        sigFile?: string | false;
        sameDest?: boolean;
        keepOriginal?: boolean;
        keepMetadata?: boolean;
        force?: boolean | string;
        ignore?: boolean | string;
        parallel?: boolean;
        parallelMax?: number;
        retryAttempts?: number;
        retryDelay?: number;
        log?: boolean;
        summarize?: boolean;
        summarise?: boolean;
    }
}

function TinyPNG(opt: string | TinyPNG.Options): NodeJS.ReadWriteStream;
function TinyPNG(opt: any, obj?: any): any {

    if(!(this instanceof TinyPNG)) {
        var instance: any = Object.create(TinyPNG.prototype);
        TinyPNG.call(instance, opt, true);
        return test ? instance : instance.stream();
    }

    var self = this;

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
            tinify.Client.RETRY_COUNT = Math.max(0, opt.retryAttempts - 1);
            tinify.Client.RETRY_DELAY = opt.retryDelay;
        }
        this.hash = new this.hasher(opt.sigFile).populate(); // init hasher class

        return this;
    };

    this.stream = function() {
        var self = this,
            opt = this.conf.options;

        return (opt.parallel ? throughParallel : through).obj({maxConcurrency: opt.parallelMax}, function(file, enc, cb) {
            if(self.utils.glob(file, opt.ignore)) return cb();

            if(file.isNull()) {
                return cb();
            }

            if(file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported'));
                return cb();
            }

            if(file.isBuffer()) {
                var hash = null;

                if(opt.sigFile && !self.utils.glob(file, opt.force)) {
                    var result = self.hash.compare(file);

                    hash = result.hash;

                    if(result.match) {
                        self.utils.log('[skipping] ' + chalk.green('✔ ') + file.relative);
                        self.stats.skipped++;

                        return cb();
                    }
                }

                self.request(file).get(function(err, tinyFile) {
                    if(err) {
                        this.emit('error', new PluginError(PLUGIN_NAME, err));
                        return cb();
                    }

                    self.utils.log('[compressing] ' + chalk.green('✔ ') + file.relative + chalk.gray(' (done)'));
                    self.stats.compressed++;

                    self.stats.total.in += file.contents.toString().length;
                    self.stats.total.out += tinyFile.contents.toString().length;

                    if(opt.sigFile) {
                        var curr = {
                            file: file,
                            hash: hash
                        };

                        if(opt.sameDest) {
                            curr.file = tinyFile;
                            curr.hash = self.hash.calc(tinyFile);
                        }

                        self.hash.update(curr.file, curr.hash);
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
            self.stats.skipped++;
            self.utils.log(err.message);
        })
        .on('end', function() {
            if(opt.sigFile) {
                // write sigs after complete or but also when error occured in order to keep track of already compressed files
                self.hash.write();
            }
            if(opt.summarize) {
                var stats = self.stats,
                    info = util.format('Skipped: %s image%s, Retries: %s, Compressed: %s image%s, Savings: %s (ratio: %s)',
                        stats.skipped,
                        stats.skipped == 1 ? '' : 's',
                        stats.retries,
                        stats.compressed,
                        stats.compressed == 1 ? '' : 's',
                        (self.utils.prettySize(stats.total.in - stats.total.out)),
                        (stats.total.in ? Math.round(stats.total.out / stats.total.in * 10000) / 10000 : 0)
                    );

                self.utils.log(info, true);

                if(stats.retries > 0) {
                    self.utils.log('Retry Attempts:', true);
                    stats.retried.forEach(function(item) {
                        self.utils.log(item.file + ': ' + item.attempts + ' attempts', true);
                    });
                }
            }
        });
    };

    this.request = function(file, cb) {
        var self = this,
            compressed;

        return {
            file: file,

            upload: function(cb) {
                var file = this.file,
                    source;

                if(!file || !file.contents || file.contents.length === 0) {
                    return cb(new Error('Error: Empty or broken images could not be send ' + (file && file.relative || '')));
                }

                try {
                    source = tinify.fromBuffer(file.contents);
                    if(self.conf.options.keepMetadata) {
                        source = source.preserve('copyright', 'creation');
                    }

                    source.toBuffer().then(function(data) {
                        compressed = Buffer.from(data);
                        cb(null, {
                            url: true,
                            count: tinify.compressionCount || 0
                        });
                    }).catch(function(err) {
                        cb(self.utils.apiError(err, file));
                    });
                } catch(err) {
                    cb(self.utils.apiError(err, file));
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
                var request = this,
                    file = this.file;

                request.upload(function(err) {
                    if(err) return cb(err, file);

                    var tinyFile = file.clone();
                    tinyFile.contents = compressed;
                    cb(null, tinyFile);
                });

                return this;
            }
        };
    };

    this.hasher = SignatureStore;

    this.utils = createUtils({
        getOptions: function() {
            return self.conf.options;
        },
        logger: log,
        PluginError: PluginError,
        pluginName: PLUGIN_NAME
    });

    return (obj || test) ? this.init(opt) : this.init(opt).stream();
}

export = TinyPNG;
