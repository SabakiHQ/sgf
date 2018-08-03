module.exports = (() => {
    try {
        return require('iconv-lite')
    } catch(err) {}

    return {
        encodingExists(encoding) {
            return true
        },

        decode(buffer) {
            return buffer.toString()
        }
    }
})()
