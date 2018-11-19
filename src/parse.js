const fs = require('fs')

const {tokenize, tokenizeBuffer} = require('./tokenize')
const {unescapeString} = require('./helper')

function _parseTokens(tokens, getId, onProgress, start = 0) {
    let i = start
    let node = {id: null, data: {}, children: []}
    let property, identifier

    while (i < tokens.length) {
        let {type, value} = tokens[i]

        if (type === 'parenthesis' && value === '(') break
        if (type === 'parenthesis' && value === ')') return {node, end: i}

        if (type === 'semicolon') {
            let lastNode = node

            node = {
                id: getId(),
                data: {},
                parentId: lastNode.id,
                children: []
            }

            lastNode.children.push(node)
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

    while (i < tokens.length) {
        let {type, value} = tokens[i]

        if (type === 'parenthesis' && value === '(') {
            let {node: child, end} = _parseTokens(tokens, getId, onProgress, i + 1)

            if (child != null) node.children.push(child)
            i = end
        } else if (type === 'parenthesis' && value === ')') {
            onProgress({progress: i / tokens.length})
            break
        }

        i++
    }

    return {node, end: i}
}

exports.parseTokens = function(tokens, {getId = null, onProgress = () => {}} = {}) {
    if (getId == null) {
        let id = 0
        getId = () => id++
    }

    let {node} = _parseTokens(tokens, getId, onProgress)
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
