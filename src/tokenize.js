const {createTokenizer, regexRule} = require('doken')
const iconv = require('./iconv-lite')
const jschardet = require('./jschardet')
const {unescapeString} = require('./helper')

const tokenizeInner = createTokenizer({
  rules: [
    regexRule('_whitespace', /\s+/y, {lineBreaks: true}),
    regexRule('parenthesis', /(\(|\))/y),
    regexRule('semicolon', /;/y),
    regexRule('prop_ident', /[A-Za-z]+/y),
    regexRule('c_value_type', /\[([^\\\]]|\\[^])*\]/y, {lineBreaks: true})
  ]
})

exports.tokenizeIter = function*(contents) {
  let length = contents.length

  for (let token of tokenizeInner(contents)) {
    token.progress = token.pos / (length - 1)
    delete token.length

    if (token.type == null) token.type = 'invalid'

    yield token
  }
}

exports.tokenizeBufferIter = function*(buffer, {encoding = null} = {}) {
  if (encoding != null) {
    yield* exports.tokenizeIter(iconv.decode(buffer, encoding))
    return
  }

  // Guess encoding

  let detectedEncoding = jschardet.detect(buffer.slice(0, 100)).encoding
  let contents = iconv.decode(buffer, detectedEncoding)
  let tokens = exports.tokenizeIter(contents)

  // Search for encoding

  let prelude = []
  let secondSemicolon = false
  let givenEncoding = detectedEncoding

  while (true) {
    let next = tokens.next()
    if (next.done) break

    let {type, value} = next.value
    let i = prelude.length

    prelude.push(next.value)

    if (type === 'semicolon') {
      if (!secondSemicolon) secondSemicolon = true
      else break
    } else if (
      type === 'c_value_type' &&
      i > 0 &&
      prelude[i - 1].type === 'prop_ident' &&
      prelude[i - 1].value === 'CA'
    ) {
      givenEncoding = unescapeString(value.slice(1, -1))
      break
    }
  }

  if (
    detectedEncoding !== givenEncoding &&
    iconv.encodingExists(givenEncoding)
  ) {
    yield* exports.tokenizeIter(iconv.decode(buffer, givenEncoding))
  } else {
    yield* prelude
    yield* tokens
  }
}

exports.tokenize = contents => [...exports.tokenizeIter(contents)]
exports.tokenizeBuffer = (buffer, opts) => [
  ...exports.tokenizeBufferIter(buffer, opts)
]
