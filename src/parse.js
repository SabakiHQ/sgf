const fs = require('fs')

const {tokenize, tokenizeBuffer} = require('./tokenize')
const {unescapeString} = require('./helper')

function _parseTokens(tokens, getId, dictionary, onProgress, start = 0) {
    let i = start
    let anchor = null
    let node, property, identifier

    while (i < tokens.length) {
        let {type, value} = tokens[i]

        if (type === 'parenthesis' && value === '(') break
        if (type === 'parenthesis' && value === ')') return {node: anchor, end: i}

        if (type === 'semicolon') {
            let lastNode = node

            node = {
                id: getId(),
                data: {},
                parentId: lastNode == null ? null : lastNode.id,
                children: []
            }

            if (dictionary != null) dictionary[node.id] = node

            if (lastNode != null) lastNode.children.push(node)
            else anchor = node
        } else if (type === 'prop_ident') {
            identifier = value.split('').filter(x => x.toUpperCase() === x).join('')

            if (identifier !== '') {
                if (!(identifier in node.data)) node.data[identifier] = []
                property = node.data[identifier]
            }
        } else if (type === 'c_value_type') {
            property.push(unescapeString(value.slice(1, -1)))
        } else {
            throw new Error(`Unexpected SGF token type '${type}'`)
        }

        i++
    }

    if (node == null) {
        anchor = node = {
            id: null,
            data: {},
            parentId: null,
            children: []
        }
    }

    while (i < tokens.length) {
        let {type, value} = tokens[i]

        if (type === 'parenthesis' && value === '(') {
            let {node: child, end} = _parseTokens(tokens, getId, dictionary, onProgress, i + 1)

            if (child != null) {
                child.parentId = node.id
                node.children.push(child)
            }

            i = end
        } else if (type === 'parenthesis' && value === ')') {
            onProgress({progress: i / tokens.length})
            break
        }

        i++
    }

    return {node: anchor, end: i}
}

exports.parseTokens = function(tokens, {
    getId = null,
    dictionary = null,
    onProgress = () => {}
} = {}) {
    if (getId == null) {
        let id = 0
        getId = () => id++
    }

    let {node} = _parseTokens([...tokens], getId, dictionary, onProgress)

    return node.children
}

exports.parse = function(contents, options = {}) {
    return exports.parseTokens(tokenize(contents), options)
}

exports.parseBuffer = function(buffer, options = {}) {
    return exports.parseTokens(tokenizeBuffer(buffer, {encoding: options.encoding}), options)
}

exports.parseFile = function(filename, options = {}) {
    return exports.parseBuffer(fs.readFileSync(filename), options)
}
