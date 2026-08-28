import crypto from 'node:crypto';
import fs from 'node:fs';

export interface SignatureFile {
    sigFile: string | false;
    sigs: Record<string, string>;
    changed?: boolean;
    calc(file: SignatureInput, callback?: (hash: string) => void): string | SignatureFile;
    update(file: SignatureInput, hash: string): SignatureFile;
    compare(file: SignatureInput, callback?: (match: boolean, hash: string) => void): SignatureComparison | SignatureFile;
    populate(): SignatureFile;
    write(): SignatureFile;
}

export interface SignatureInput {
    contents: Buffer;
    path: string;
    cwd: string;
}

export interface SignatureComparison {
    match: boolean;
    hash: string;
}

export default function createSignatureStore(sigFile?: string | false): SignatureFile {
    return {
        sigFile: sigFile || false,
        sigs: {},

        calc(file, callback) {
            const md5 = crypto.createHash('md5').update(file.contents).digest('hex');

            if (callback) callback(md5);

            return callback ? this : md5;
        },

        update(file, hash) {
            this.changed = true;
            this.sigs[file.path.replace(file.cwd, '')] = hash;

            return this;
        },

        compare(file, callback) {
            const md5 = this.calc(file) as string;
            const filepath = file.path.replace(file.cwd, '');
            const result = filepath in this.sigs && md5 === this.sigs[filepath];

            if (callback) callback(result, md5);

            return callback ? this : { match: result, hash: md5 };
        },

        populate() {
            let data: unknown = false;

            if (this.sigFile) {
                try {
                    data = JSON.parse(fs.readFileSync(this.sigFile, 'utf-8'));
                } catch {
                    // A missing or malformed cache should not stop image processing.
                }

                if (data && typeof data === 'object') this.sigs = data as Record<string, string>;
            }

            return this;
        },

        write() {
            if (this.changed) {
                try {
                    fs.writeFileSync(this.sigFile as string, JSON.stringify(this.sigs));
                } catch {
                    // A cache write failure should not discard compressed output.
                }
            }

            return this;
        }
    };
}
