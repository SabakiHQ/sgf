const {escapeString} = require('./helper')

exports.stringify = function(
  node,
  {linebreak = '\n', indent = '  ', level = 0} = {}
) {
  if (Array.isArray(node)) {
    return exports.stringify({children: node}, {linebreak, level})
  }

  let output = []
  let totalIndent = linebreak !== '' ? indent.repeat(level) : ''

  if (node.data != null) {
    output.push(totalIndent, ';')

    for (let id in node.data) {
      if (id.toUpperCase() !== id) continue

      output.push(id, '[', node.data[id].map(escapeString).join(']['), ']')
    }

    output.push(linebreak)
  }

  if (node.children.length > 1 || (node.children.length > 0 && level === 0)) {
    output.push(totalIndent)

    for (let child of node.children) {
      output.push(
        '(',
        linebreak,
        exports.stringify(child, {linebreak, level: level + 1}),
        totalIndent,
        ')'
      )
    }

    output.push(linebreak)
  } else if (node.children.length === 1) {
    output.push(exports.stringify(node.children[0], {linebreak, level}))
  }

  return output.join('')
}
