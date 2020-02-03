module.exports = (() => {
  try {
    let m = require('iconv-lite')
    if (m == null) throw new Error()

    return m
  } catch (err) {
    return {
      encodingExists: () => true,
      decode: buffer => buffer.toString()
    }
  }
})()
