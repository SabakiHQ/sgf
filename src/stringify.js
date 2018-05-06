const {escapeString} = require('./helper')

exports.stringify = function(tree, {linebreak = '\n'} = {}) {
    if (Array.isArray(tree)) {
        return exports.stringify({nodes: [], subtrees: tree})
    }

    let output = ''

    for (let node of tree.nodes) {
        output += ';'

        for (let id in node) {
            if (id.toUpperCase() !== id) continue

            output += id + '[' + node[id].map(escapeString).join('][') + ']'
        }

        output += linebreak
    }

    for (let subtree of tree.subtrees) {
        output += '(' + exports.stringify(subtree) + ')'
    }

    return output
}
