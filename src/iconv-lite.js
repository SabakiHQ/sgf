module.exports = (() => {
    try {
        return require('iconv-lite')
    } catch(err) {
        return {
            encodingExists: () => true,
            decode: buffer => buffer.toString()
        }
    }
})()
