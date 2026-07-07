const {createTokenizer, regexRule} = require('doken')
const iconv = require('./iconv-lite')
const jschardet = require('./jschardet')
const {unescapeString} = require('./helper')

// Encodings tried, in priority order, when the charset can't be read from a
// CA[] property, isn't valid UTF-8, and jschardet isn't confident. Covers the
// common CJK and Cyrillic legacy encodings. gb18030 is listed before euc-kr so
// that pure-Han (Chinese) text isn't mistaken for a spurious hangul decode.
const recoveryCandidates = [
  'shift_jis',
  'gb18030',
  'big5',
  'euc-jp',
  'euc-kr',
  'windows-1251',
  'koi8-r'
]

// jschardet is reliable when it has enough high-byte content; below this
// confidence (short files like a single-game kifu) it guesses wrong, so we
// defer to the coherence scorer instead.
const jschardetConfidenceThreshold = 0.85

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

// The value of the first CA[] property, read losslessly (latin1 preserves every
// byte, and CA and its value are ASCII), or null.
function findCharsetProperty(buffer) {
  let contents = iconv.decode(buffer, 'latin1')
  let lastToken = null

  for (let token of exports.tokenizeIter(contents)) {
    if (
      token.type === 'c_value_type' &&
      lastToken != null &&
      lastToken.type === 'prop_ident' &&
      lastToken.value === 'CA'
    ) {
      return unescapeString(token.value.slice(1, -1))
    }

    lastToken = token
  }

  return null
}

function isValidUtf8(buffer) {
  try {
    new TextDecoder('utf-8', {fatal: true}).decode(buffer)
    return true
  } catch (err) {
    return false
  }
}

// Classify a code point into a script bucket, split so kana (Japanese) and
// hangul (Korean) can serve as script-locked language markers.
function classify(codePoint) {
  let c = codePoint
  if (c === 0xfffd) return 'repl'
  if (c >= 0x3040 && c <= 0x30ff) return 'kana'
  if (c >= 0xac00 && c <= 0xd7a3) return 'hangul'
  if (c >= 0x3400 && c <= 0x9fff) return 'han'
  if (c >= 0x0400 && c <= 0x04ff) return 'cyrillic'
  if (c >= 0x00c0 && c <= 0x024f) return 'latin'
  if ((c >= 0x3000 && c <= 0x303f) || (c >= 0xff00 && c <= 0xffef))
    return 'punct'
  return 'junk'
}

// Higher score == more plausible decode. Rewards meaningful characters,
// penalizes replacement/control/rare-symbol junk, and treats kana (Japanese)
// and pure hangul (Korean) as strong language markers, since a wrong CJK decode
// rarely produces them cleanly.
function scoreDecoding(str) {
  let counts = {
    kana: 0,
    hangul: 0,
    han: 0,
    cyrillic: 0,
    latin: 0,
    punct: 0,
    junk: 0,
    repl: 0
  }
  let high = 0

  for (let ch of str) {
    let c = ch.codePointAt(0)
    if (c < 0x80) continue
    high++
    counts[classify(c)]++
  }

  if (high === 0) return -1

  let meaningful =
    counts.kana + counts.hangul + counts.han + counts.cyrillic + counts.latin
  let noise = 2 * counts.repl + counts.junk + 0.6 * counts.punct
  let score = (meaningful - noise) / high

  if (counts.kana > 0) score += 0.5
  if (counts.hangul > 0 && counts.han === 0) score += 0.4

  return score
}

// Concatenated bytes of property values that contain non-ASCII bytes -- the
// human-readable text (names, event, comments) an encoding guess should be
// judged on, with the ASCII scaffolding stripped out.
function meaningfulBytes(buffer) {
  let contents = iconv.decode(buffer, 'latin1')
  let result = ''

  for (let match of contents.matchAll(/[A-Za-z]+\[((?:[^\\\]]|\\[^])*)\]/g)) {
    let value = match[1]
    if ([...value].some(c => c.charCodeAt(0) >= 0x80)) result += value
  }

  return iconv.encode(result, 'latin1')
}

function recoverEncoding(buffer) {
  let sample = meaningfulBytes(buffer)
  if (sample.length === 0) return null

  let best = null

  for (let encoding of recoveryCandidates) {
    if (!iconv.encodingExists(encoding)) continue

    let score = scoreDecoding(iconv.decode(sample, encoding))
    if (best == null || score > best.score) best = {encoding, score}
  }

  return best != null && best.score > 0 ? best.encoding : null
}

function detectEncoding(buffer) {
  // A declared charset wins -- it's the author's own statement of intent.
  let charset = findCharsetProperty(buffer)
  if (charset != null && iconv.encodingExists(charset)) return charset

  // UTF-8 is self-validating: valid UTF-8 bytes are almost never anything else.
  if (isValidUtf8(buffer)) return 'utf8'

  // jschardet is trustworthy when confident (enough content to model).
  let detected = jschardet.detect(buffer)
  if (
    detected.encoding != null &&
    detected.confidence >= jschardetConfidenceThreshold &&
    iconv.encodingExists(detected.encoding)
  ) {
    return detected.encoding
  }

  // Short legacy files (a single kifu) fool jschardet; recover by scoring
  // candidate decodes of the actual text. See SabakiHQ/Sabaki#1029.
  let recovered = recoverEncoding(buffer)
  if (recovered != null) return recovered

  // Never throw: latin1 maps every byte to a character.
  return 'latin1'
}

exports.tokenizeBufferIter = function*(buffer, {encoding = null} = {}) {
  if (encoding == null) encoding = detectEncoding(buffer)

  yield* exports.tokenizeIter(iconv.decode(buffer, encoding))
}

exports.tokenize = contents => [...exports.tokenizeIter(contents)]

exports.tokenizeBuffer = (buffer, opts) => [
  ...exports.tokenizeBufferIter(buffer, opts)
]
