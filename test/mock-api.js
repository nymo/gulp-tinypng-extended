var fs = require('fs'),
    nock = require('nock'),
    compressedImage = fs.readFileSync(__dirname + '/assets/image_small.png');

module.exports = function mockTinyPngApi() {
    nock('https://api.tinify.com')
        .persist()
        .post('/shrink')
        .reply(201, {
            output: {
                url: 'https://api.tinify.com/output'
            }
        }, {
            location: 'https://api.tinify.com/output',
            'compression-count': '1'
        });

    nock('https://api.tinify.com')
        .persist()
        .get('/output')
        .reply(200, compressedImage);
};

