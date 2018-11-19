const {escapeString} = require('./helper')

exports.stringify = function(node, {linebreak = '\n', level = 0} = {}) {
    if (Array.isArray(node)) {
        return exports.stringify({data: {}, children: node}, {linebreak, level})
    }

    let output = []
    let indent = linebreak !== '' ? '  '.repeat(level) : ''

    output.push(indent, ';')

    for (let id in node.data) {
        if (id.toUpperCase() !== id) continue

        output.push(id, '[', node.data[id].map(escapeString).join(']['), ']')
    }

    output.push(linebreak)

    if (node.children.length > 1 || level === 0) {
        if (node.children.length > 0) output.push(indent)

        for (let child of node.children) {
            output.push(
                '(', linebreak,
                exports.stringify(child, {linebreak, level: level + 1}),
                indent, ')'
            )
        }

        output.push(linebreak)
    } else if (node.children.length === 1) {
        output.push(exports.stringify(node.children[0], {linebreak, level}))
    }

    return output.join('')
}
