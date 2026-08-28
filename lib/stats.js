function createStats() {
    return {
        total: {
            in: 0,
            out: 0
        },
        compressed: 0,
        skipped: 0,
        retries: 0,
        retried: []
    };
}

module.exports = createStats;
