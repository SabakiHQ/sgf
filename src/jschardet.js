module.exports = (() => {
    try {
        return require('jschardet')
    } catch(err) {}

    return {
        detect(buffer) {
            return {
                encoding: 'UTF-8',
                confidence: 1
            }
        }
    }
})()
