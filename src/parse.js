const fs = require('fs')

const {tokenize, tokenizeBuffer} = require('./tokenize')
const {unescapeString} = require('./helper')

function _parseTokens(tokens, getId, onProgress, start = 0) {
    let i = start
    let node, property, identifier
    let tree = {id: getId(), nodes: [], subtrees: [], current: null, parent: null}

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
            property.push(unescapeString(value.slice(1, -1)))
        } else {
            throw new Error(`Unexpected SGF token type '${type}'`)
        }

        i++
    }

    while (i < tokens.length) {
        let {type, value} = tokens[i]

        if (type === 'parenthesis' && value === '(') {
            let {tree: subtree, end} = _parseTokens(tokens, getId, onProgress, i + 1)

            if (subtree.nodes.length > 0) {
                subtree.parent = tree
                tree.current = 0
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

exports.parseTokens = function(tokens, {getId, onProgress = () => {}} = {}) {
    if (getId == null) {
        let id = 0
        getId = () => id++
    }

    let {tree} = _parseTokens(tokens, getId, onProgress)
    tree.subtrees.forEach(subtree => subtree.parent = null)

    return tree.subtrees
}

exports.parse = function(contents, options) {
    return exports.parseTokens(tokenize(contents), options)
}

exports.parseBuffer = function(buffer, options) {
    return exports.parseTokens(tokenizeBuffer(buffer, {encoding: options.encoding}), options)
}

exports.parseFile = function(filename, options) {
    return exports.parseBuffer(fs.readFileSync(filename), options)
}
