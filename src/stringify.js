const {escapeString} = require('./helper')

exports.stringify = function(tree, {linebreak = '\n', level = 0} = {}) {
    if (Array.isArray(tree)) {
        return exports.stringify({nodes: [], subtrees: tree}, {linebreak})
    }

    let output = []
    let indent = linebreak !== '' ? '  '.repeat(level) : ''

    for (let node of tree.nodes) {
        output.push(indent, ';')

        for (let id in node) {
            if (id.toUpperCase() !== id) continue

            output.push(id, '[', node[id].map(escapeString).join(']['), ']')
        }

        output.push(linebreak)
    }

    if (tree.subtrees.length > 1 || tree.subtrees.length > 0 && level === 0) {
        if (tree.subtrees.length > 0) output.push(indent)

        for (let subtree of tree.subtrees) {
            output.push(
                '(', linebreak,
                exports.stringify(subtree, {linebreak, level: level + 1}),
                indent, ')'
            )
        }

        output.push(linebreak)
    } else if (tree.subtrees.length === 1) {
        output.push(exports.stringify(tree.subtrees[0], {linebreak, level}))
    }

    return output.join('')
}
