const {createTokenizer, regexRule} = require('doken')
const iconv = require('./iconv-lite')
const jschardet = require('./jschardet')
const {unescapeString} = require('./helper')

const encodingDetectionProps = [
  'EV',
  'GN',
  'GC',
  'AN',
  'BT',
  'WT',
  'PW',
  'PB',
  'C'
]

const _tokenize = createTokenizer({
  rules: [
    regexRule('_whitespace', /\s+/y, {lineBreaks: true}),
    regexRule('parenthesis', /(\(|\))/y),
    regexRule('semicolon', /;/y),
    regexRule('prop_ident', /[A-Za-z]+/y),
    regexRule('c_value_type', /\[([^\\\]]|\\[^])*\]/y, {lineBreaks: true}),
    {
      type: 'invalid',
      match: (input, position) => ({length: 1})
    }
  ]
})

exports.tokenizeIter = function*(contents) {
  for (let token of _tokenize(contents)) {
    token.progress = token.pos / (contents.length - 1)
    delete token.length

    yield token
  }
}

exports.tokenizeBufferIter = function*(buffer, {encoding = null} = {}) {
  if (encoding != null) {
    yield* exports.tokenizeIter(iconv.decode(buffer, encoding))
    return
  }

  // Guess encoding

  let detectedEncoding = jschardet.detect(buffer.slice(0, 300)).encoding
  let contents = iconv.decode(buffer, detectedEncoding)
  let tokens = exports.tokenizeIter(contents)

  // Search for encoding

  let prelude = []

  while (true) {
    let next = tokens.next()
    if (next.done) break

    let {type, value} = next.value
    let lastToken = prelude[prelude.length - 1]

    prelude.push(next.value)

    if (
      type === 'c_value_type' &&
      lastToken != null &&
      lastToken.type === 'prop_ident' &&
      lastToken.value === 'CA'
    ) {
      encoding = unescapeString(value.slice(1, -1))
      break
    }
  }

  if (
    encoding != null &&
    encoding != detectedEncoding &&
    iconv.encodingExists(encoding)
  ) {
    yield* exports.tokenizeIter(iconv.decode(buffer, encoding))
  } else {
    yield* prelude
    yield* tokens
  }
}

exports.tokenize = contents => [...exports.tokenizeIter(contents)]

exports.tokenizeBuffer = (buffer, opts) => [
  ...exports.tokenizeBufferIter(buffer, opts)
]
