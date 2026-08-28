var minimatch = require('minimatch');

function createUtils(options) {
    var getOptions = options.getOptions,
        logger = options.logger,
        PluginError = options.PluginError,
        pluginName = options.pluginName;

    return {
        log: function(message, force) {
            var currentOptions = getOptions();

            if(currentOptions.log || force) logger(pluginName, message);

            return this;
        },

        apiError: function(err, file) {
            var message = err && err.message || 'Unknown TinyPNG API error',
                name = err && err.name || 'Error';

            return new PluginError(pluginName, name + ' for ' + file.relative + ': ' + message, {
                cause: err
            });
        },

        glob: function(file, glob, opt) {
            opt = opt || {};
            var result = false;

            if(typeof glob === 'boolean') return glob;

            try {
                result = minimatch(file.path, glob, opt);
            } catch(err) {}

            if(!result && !opt.matchBase) {
                opt.matchBase = true;
                return this.glob(file, glob, opt);
            }
            return result;
        },

        prettySize: function(bytes) {
            if(bytes === 0) return '0.00 B';

            var pos = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, pos)).toFixed(2) + ' ' + ' KMGTP'.charAt(pos) + 'B';
        }
    };
}

module.exports = createUtils;
