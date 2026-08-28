export interface TinyPNGOptions {
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

export const DEFAULT_OPTIONS = {
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

export function normalizeOptions(value: unknown, args: Record<string, unknown>): TinyPNGOptions {
    const input = typeof value === 'object' && value !== null ? value as Partial<TinyPNGOptions> : { key: value as string };
    const options = Object.assign({}, DEFAULT_OPTIONS, input) as TinyPNGOptions;

    if(!options.force) options.force = args.force as boolean | string || false;
    if(!options.ignore) options.ignore = args.ignore as boolean | string || false;
    if(options.summarise) options.summarize = true;

    return options;
}
