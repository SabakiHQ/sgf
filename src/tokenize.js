const iconv = require('./iconv-lite')
const jschardet = require('./jschardet')
const {unescapeString} = require('./helper')

exports.tokenize = function(contents) {
    let tokens = []
    let pos = 0
    let [row, col] = [0, 0]
    let rules = {
        newline: /^\n/,
        whitespace: /^[^\S\n]+/,
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

            if (!['newline', 'whitespace'].includes(type)) {
                tokens.push({type, value, row, col, pos})
            }

            // Update source position

            if (type === 'newline') {
                row++
                col = 0
            } else {
                col += value.length
            }

            pos += value.length
            contents = contents.slice(value.length)

            break
        }

        if (match == null) throw new Error(`Unexpected SGF token at ${row + 1}:${col + 1}`)
    }

    return tokens
}

exports.tokenizeBuffer = function(buffer, {encoding = null} = {}) {
    if (encoding != null) {
        return exports.tokenize(iconv.decode(buffer, encoding))
    }

    // Guess encoding

    let detectedEncoding = jschardet.detect(buffer.slice(0, 100)).encoding
    let contents = iconv.decode(buffer, detectedEncoding)
    let tokens = exports.tokenize(contents)

    // Search for encoding

    let givenEncoding = detectedEncoding

    for (let i = 0; i < Math.min(tokens.length, 100); i++) {
        let {type, value} = tokens[i]

        if (
            type === 'prop_ident'
            && value === 'CA'
            && tokens[i + 1]
            && tokens[i + 1].type === 'c_value_type'
        ) {
            givenEncoding = unescapeString(tokens[i + 1].value.slice(1, -1))
            break
        }
    }

    if (detectedEncoding !== givenEncoding && iconv.encodingExists(givenEncoding)) {
        tokens = exports.tokenize(iconv.decode(buffer, givenEncoding))
    }

    return tokens
}
