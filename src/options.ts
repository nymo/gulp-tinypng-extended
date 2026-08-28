export {};

var DEFAULT_OPTIONS = {
    key: '',
    sigFile: false,
    log: false,
    force: false,
    ignore: false,
    sameDest: false,
    summarize: false,
    parallel: true,
    parallelMax: 5,
    keepOriginal: true,
    keepMetadata: false,
    retryAttempts: 10,
    retryDelay: 10000
};

function normalizeOptions(value, args) {
    var options = typeof value === 'object' && value !== null ? value : { key: value };

    options = Object.assign({}, DEFAULT_OPTIONS, options);

    if(!options.force) options.force = args.force || false;
    if(!options.ignore) options.ignore = args.ignore || false;
    if(options.summarise) options.summarize = true;

    return options;
}

module.exports = {
    DEFAULT_OPTIONS: DEFAULT_OPTIONS,
    normalizeOptions: normalizeOptions
};
