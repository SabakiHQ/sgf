const fs = require('fs')
const iconv = require('iconv-lite')
const jschardet = require('jschardet')

const {tokenize} = require('./tokenize')
const {unescapeString} = require('./helper')

// The default encoding is defined in the SGF spec at
// http://www.red-bean.com/sgf/properties.html#CA
const defaultEncoding = 'ISO-8859-1'

exports.detectEncoding = function(tokens, {sampleLength = 100} = {}) {
    let sampleText = ''

    for (let i = 0; i < tokens.length; i++) {
        let {type, value} = tokens[i]

        if (type === 'c_value_type') {
            sampleText += value
            if (sampleText.length > sampleLength) break
        } else if (type === 'prop_ident' && type === 'CA' && tokens[i + 1] && tokens[i + 1].type === 'c_value_type') {
            return unescapeString(tokens[i + 1].value.slice(1, -1))
        }
    }

    let detected = jschardet.detect(sampleText)
    if (detected.confidence > 0.2) return detected.encoding

    return null
}

function _parseTokens(tokens, getId, onProgress, encoding, start = 0) {
    let i = start
    let node, property, identifier
    let tree = {id: getId(), nodes: [], subtrees: [], parent: null}

    while (i < tokens.length) {
        let {type, value} = tokens[i]

        if (type === 'parenthesis' && value === '(') break
        if (type === 'parenthesis' && value === ')') return {tree, end: i}

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
            value = unescapeString(value.slice(1, -1))

            if (encoding != null) {
                if (identifier === 'CA' && value !== defaultEncoding && iconv.encodingExists(value)) {
                    encoding = value

                    // We may have already incorrectly parsed some values in this root node
                    // already, so we have to go back and re-parse them now.

                    for (let k in node) {
                        node[k] = node[k].map(x => iconv.decode(Buffer.from(x, 'binary'), encoding))
                    }
                } else if (encoding !== defaultEncoding) {
                    value = iconv.decode(Buffer.from(value, 'binary'), encoding)
                }
            }

            property.push(value)
        } else {
            throw new Error(`Unexpected SGF token type '${type}'`)
        }

        i++
    }

    while (i < tokens.length) {
        let {type, value} = tokens[i]

        if (type === 'parenthesis' && value === '(') {
            let {tree: subtree, end} = _parseTokens(tokens, getId, onProgress, encoding, i + 1)

            if (subtree.nodes.length > 0) {
                subtree.parent = tree
                tree.subtrees.push(subtree)
            }

            i = end
        } else if (type === 'parenthesis' && value === ')') {
            onProgress({progress: i / tokens.length})
            break
        }

        i++
    }

    return {tree, end: i}
}

exports.parseTokens = function(tokens, {getId, onProgress = () => {}, encoding = null} = {}) {
    if (getId == null) {
        let id = 0
        getId = () => id++
    }

    let {tree} = _parseTokens(tokens, getId, onProgress, encoding)
    tree.subtrees.forEach(subtree => subtree.parent = null)
    return tree.subtrees
}

exports.parse = function(contents, options) {
    let tokens = tokenize(contents)
    return exports.parseTokens(tokens, options)
}

exports.parseFile = function(filename, {getId, onProgress, detectEncoding = true} = {}) {
    let contents = fs.readFileSync(filename, {encoding: 'binary'})
    let tokens = tokenize(contents)
    let encoding = !detectEncoding
        ? defaultEncoding
        : exports.detectEncoding(tokens) || defaultEncoding

    return exports.parseTokens(tokens, {getId, onProgress, encoding})
}
