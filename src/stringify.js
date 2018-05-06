const {escapeString} = require('./helper')

exports.stringify = function(tree, {linebreak = '\n'} = {}) {
    if (Array.isArray(tree)) {
        return exports.stringify({nodes: [], subtrees: tree}, {linebreak})
    }

    let output = []

    for (let node of tree.nodes) {
        output.push(';')

        for (let id in node) {
            if (id.toUpperCase() !== id) continue

            output.push(id, '[', node[id].map(escapeString).join(']['), ']')
        }

        output.push(linebreak)
    }

    for (let subtree of tree.subtrees) {
        output.push('(', exports.stringify(subtree, {linebreak}), ')')
    }

    return output.join('')
}
