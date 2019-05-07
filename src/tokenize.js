const iconv = require('./iconv-lite')
const jschardet = require('./jschardet')
const {unescapeString} = require('./helper')

exports.tokenizeIter = function*(contents) {
    let length = contents.length
    let pos = 0
    let [row, col] = [0, 0]
    let rules = {
        whitespace: /^\s+/,
        parenthesis: /^(\(|\))/,
        semicolon: /^;/,
        prop_ident: /^[A-Za-z]+/,
        c_value_type: /^\[([^\\\]]|\\[^])*\]/
    }

    while (contents.length > 0) {
        let match = null

        for (let type in rules) {
            match = rules[type].exec(contents)
            if (match == null) continue

            let value = match[0]

            if (type !== 'whitespace') {
                yield {
                    type,
                    value,
                    row,
                    col,
                    pos,
                    progress: pos / (length - 1)
                }
            }

            // Update source position

            let newlineIndices = Array.from(value)
                .map((c, i) => c === '\n' ? i : null)
                .filter(x => x != null);

            row += newlineIndices.length;
            if (newlineIndices.length > 0) {
                col = value.length - newlineIndices.slice(-1)[0] - 1;
            } else {
                col += value.length;
            }

            pos += value.length
            contents = contents.slice(value.length)

            break
        }

        if (match == null) {
            throw new Error(`Unexpected token at ${row + 1}:${col + 1}`)
        }
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
            type === 'c_value_type'
            && i > 0
            && prelude[i - 1].type === 'prop_ident'
            && prelude[i - 1].value === 'CA'
        ) {
            givenEncoding = unescapeString(value.slice(1, -1))
            break
        }
    }

    if (detectedEncoding !== givenEncoding && iconv.encodingExists(givenEncoding)) {
        yield* exports.tokenizeIter(iconv.decode(buffer, givenEncoding))
    } else {
        yield* prelude
        yield* tokens
    }
}

exports.tokenize = contents => [...exports.tokenizeIter(contents)]
exports.tokenizeBuffer = (buffer, opts) => [...exports.tokenizeBufferIter(buffer, opts)]
