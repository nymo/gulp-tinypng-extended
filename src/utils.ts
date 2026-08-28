import minimatch from 'minimatch';
import PluginError from 'plugin-error';

export interface UtilityFile {
    path: string;
    relative: string;
}

export interface PluginUtils {
    log(message: string, force?: boolean): PluginUtils;
    apiError(error: unknown, file: UtilityFile): PluginError;
    glob(file: UtilityFile, pattern: boolean | string, options?: minimatch.IOptions): boolean;
    prettySize(bytes: number): string;
}

interface UtilsOptions {
    getOptions(): { log?: boolean };
    logger: (...messages: unknown[]) => void;
    pluginName: string;
}

export default function createUtils(options: UtilsOptions): PluginUtils {
    return {
        log(message, force) {
            const currentOptions = options.getOptions();

            if (currentOptions.log || force) options.logger(options.pluginName, message);

            return this;
        },

        apiError(error, file) {
            const originalError = error instanceof Error ? error : new Error(String(error));
            const message = `${originalError.name} for ${file.relative}: ${originalError.message}`;

            return new PluginError(options.pluginName, message);
        },

        glob(file, pattern, globOptions = {}) {
            if (typeof pattern === 'boolean') return pattern;

            try {
                if (minimatch(file.path, pattern, globOptions)) return true;
                if (!globOptions.matchBase) return minimatch(file.path, pattern, { ...globOptions, matchBase: true });
            } catch {
                return false;
            }

            return false;
        },

        prettySize(bytes) {
            if (bytes === 0) return '0.00 B';

            const position = Math.floor(Math.log(bytes) / Math.log(1024));
            return `${(bytes / Math.pow(1024, position)).toFixed(2)} ${' KMGTP'.charAt(position)}B`;
        }
    };
}
