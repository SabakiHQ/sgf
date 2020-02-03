let jschardet = (() => {
  try {
    let m = require('jschardet')
    if (m == null) throw new Error()

    return m
  } catch (err) {
    return {
      detect: () => ({encoding: 'UTF-8'}),
      detectBuffers() {
        return this.detect()
      }
    }
  }
})()

module.exports = {
  detectBuffers(buffers) {
    let u = new jschardet.UniversalDetector()
    u.reset()

    for (let buf of buffers) {
      u.feed(buf.toString('binary'))
    }

    u.close()
    return u.result
  },
  ...jschardet
}
