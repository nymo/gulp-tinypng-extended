var fs = require('fs'),
    crypto = require('crypto');

function SignatureStore(sigFile) {
    return {
        sigFile: sigFile || false,
        sigs: {},

        calc: function(file, cb) {
            var md5 = crypto.createHash('md5').update(file.contents).digest('hex');

            cb && cb(md5);

            return cb ? this : md5;
        },

        update: function(file, hash) {
            this.changed = true;
            this.sigs[file.path.replace(file.cwd, '')] = hash;

            return this;
        },

        compare: function(file, cb) {
            var md5 = this.calc(file),
                filepath = file.path.replace(file.cwd, ''),
                result = (filepath in this.sigs && md5 === this.sigs[filepath]);

            cb && cb(result, md5);

            return cb ? this : { match: result, hash: md5 };
        },

        populate: function() {
            var data = false;

            if(this.sigFile) {
                try {
                    data = fs.readFileSync(this.sigFile, 'utf-8');
                    if(data) data = JSON.parse(data);
                } catch(err) {
                    // A missing or malformed cache should not stop image processing.
                }

                if(data) this.sigs = data;
            }

            return this;
        },

        write: function() {
            if(this.changed) {
                try {
                    fs.writeFileSync(this.sigFile, JSON.stringify(this.sigs));
                } catch(err) {
                    // A cache write failure should not discard compressed output.
                }
            }

            return this;
        }
    };
}

module.exports = SignatureStore;
