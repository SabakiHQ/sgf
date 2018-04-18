const fs = require('fs')
const iconv = require('iconv-lite')
const jschardet = require('jschardet')
const helper = require('./helper')

// The default encoding is defined in the SGF spec at
// http://www.red-bean.com/sgf/properties.html#CA

const defaultEncoding = 'ISO-8859-1'

exports.tokenize = function(contents) {
    let tokens = []
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
        let pos = 0
        let [row, col] = [0, 0]

        for (let type in rules) {
            match = rules[type].exec(contents)
            if (match == null) continue

            let value = match[0]
            let length = value.length

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
            break
        }

        if (match == null) throw new Error(`Unexpected SGF token at ${row + 1}:${col + 1}`)
        contents = contents.slice(length)
    }

    return tokens
}

function _parseTokens(tokens, onProgress, encoding, start = [0], id = 0) {
    let i = start[0]
    let node, property, identifier
    let tree = {id, nodes: [], subtrees: [], parent: null}

    while (i < tokens.length) {
        let {type, value} = tokens[i]

        if (type === 'parenthesis' && value === '(') break
        if (type === 'parenthesis' && value === ')') return tree

        if (type === 'semicolon') {
            node = {}
            tree.nodes.push(node)
        } else if (type === 'prop_ident') {
            identifier = value.split('').filter(x => x.toUpperCase() === x).join('')

            if (identifier !== '') {
                if (!(identifier in node)) node[identifier] = []
                property = node[identifier]
            }
        } else if (type === 'c_value_type') {
            value = exports.unescapeString(value.slice(1, value.length - 1))

            if (encoding != null) {
                if (identifier === 'CA' && value !== defaultEncoding && iconv.encodingExists(value)) {
                    encoding = value

                    // We may have already incorrectly parsed some values in this root node
                    // already, so we have to go back and re-parse them now.

                    for (let k in node) {
                        node[k] = node[k].map(x => iconv.decode(Buffer.from(x, 'binary'), encoding))
                    }
                } else if (encodedProperties.includes(identifier) && encoding !== defaultEncoding) {
                    value = iconv.decode(Buffer.from(value, 'binary'), encoding)
                }
            }

            property.push(value)
        }

        start[0] = ++i
    }

    while (i < tokens.length) {
        let {type, value} = tokens[i]

        if (type === 'parenthesis' && value === '(') {
            start[0] = i + 1

            let t = _parseTokens(tokens, onProgress, encoding, start, id + 1)

            if (t.nodes.length > 0) {
                t.parent = tree
                tree.subtrees.push(t)
                tree.current = 0
            }

            i = start[0]
        } else if (type === 'parenthesis' && value === ')') {
            start[0] = i
            onProgress({progress: i / tokens.length})
            break
        }

        i++
    }

    return tree
}

exports.parseTokens = function(tokens, {onProgress = () => {}, encoding = null} = {}) {
    let tree = _parseTokens(tokens, onProgress, encoding)
    tree.subtrees.forEach(subtree => subtree.parent = null)
    return tree.subtrees
}

exports.parse = function(contents, {onProgress, ignoreEncoding = false} = {}) {
    let tokens = exports.tokenize(contents)
    let encoding = ignoreEncoding ? null : defaultEncoding

    if (!ignoreEncoding) {
        let foundEncoding = false
        let sampleText = ''

        for (let t of tokens) {
            if (t.type === 'prop_ident' && t.value === 'CA') {
                foundEncoding = true
            } else if (t.type === 'c_value_type') {
                sampleText += t.value
            }
        }

        if (!foundEncoding) {
            let detected = jschardet.detect(sampleText)

            if (detected.confidence > 0.2) {
                encoding = detected.encoding
            }
        }
    }

    return exports.parseTokens(tokens, {onProgress, encoding})
}

exports.parseFile = function(filename, {onProgress, ignoreEncoding} = {}) {
    let contents = fs.readFileSync(filename, {encoding: 'binary'})
    return exports.parse(contents, {onProgress, ignoreEncoding})
}

exports.stringify = function(tree, {linebreak = '\n'} = {}) {
    if (Array.isArray(tree)) {
        return exports.stringify({nodes: [], subtrees: tree})
    }

    let output = ''

    for (let node of tree.nodes) {
        output += ';'

        for (let id in node) {
            if (id.toUpperCase() !== id) continue

            output += id + '[' + node[id].map(exports.escapeString).join('][') + ']'
        }

        output += linebreak
    }

    for (let subtree of tree.subtrees) {
        output += '(' + exports.stringify(subtree) + ')'
    }

    return output
}

exports.escapeString = function(input) {
    return input.toString()
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
        .replace(/\n\n+/g, '\n\n')
}

exports.unescapeString = function(input) {
    let result = []
    let inBackslash = false

    input = input.replace(/\r/g, '')

    for (let i = 0; i < input.length; i++) {
        if (!inBackslash) {
            if (input[i] !== '\\')
                result.push(input[i])
            else if (input[i] === '\\')
                inBackslash = true
        } else {
            if (input[i] !== '\n')
                result.push(input[i])

            inBackslash = false
        }
    }

    return result.join('')
}

Object.assign(exports, helper)
