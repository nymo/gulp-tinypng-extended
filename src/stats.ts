export interface TinyPNGStats {
    total: {
        in: number;
        out: number;
    };
    compressed: number;
    skipped: number;
    retries: number;
    compressionCount: number | null;
    retried: Array<{
        file: string;
        attempts: number;
    }>;
}

export default function createStats(): TinyPNGStats {
    return {
        total: {
            in: 0,
            out: 0
        },
        compressed: 0,
        skipped: 0,
        retries: 0,
        compressionCount: null,
        retried: []
    };
}
