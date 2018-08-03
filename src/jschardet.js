module.exports = (() => {
    try {
        return require('jschardet')
    } catch(err) {
        return {
            detect: () => ({encoding: 'UTF-8'})
        }
    }
})()
