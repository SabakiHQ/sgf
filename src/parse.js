const fs = require('fs')

const Peekable = require('./peekable')
const {tokenizeIter, tokenizeBufferIter} = require('./tokenize')
const {unescapeString} = require('./helper')

function _parseTokens(peekableTokens, parentId, options) {
  let {getId, dictionary, onProgress, onNodeCreated} = options

  let anchor = null
  let node, property

  while (!peekableTokens.peek().done) {
    let {type, value, row, col} = peekableTokens.peek().value

    if (type === 'parenthesis' && value === '(') break
    if (type === 'parenthesis' && value === ')') {
      if (node != null) onNodeCreated({node})
      return anchor
    }

    if (type === 'semicolon' || node == null) {
      // Prepare new node

      let lastNode = node

      node = {
        id: getId(),
        data: {},
        parentId: lastNode == null ? parentId : lastNode.id,
        children: []
      }

      if (dictionary != null) dictionary[node.id] = node

      if (lastNode != null) {
        onNodeCreated({node: lastNode})
        lastNode.children.push(node)
      } else {
        anchor = node
      }
    }

    if (type === 'semicolon') {
      // Work is already done
    } else if (type === 'prop_ident') {
      if (node != null) {
        // Prepare new property

        let identifier =
          value === value.toUpperCase()
            ? value
            : value
                .split('')
                .filter(x => x.toUpperCase() === x)
                .join('')

        if (identifier !== '') {
          if (!(identifier in node.data)) node.data[identifier] = []
          property = node.data[identifier]
        } else {
          property = null
        }
      }
    } else if (type === 'c_value_type') {
      if (property != null) {
        property.push(unescapeString(value.slice(1, -1)))
      }
    } else if (type === 'invalid') {
      throw new Error(`Unexpected token at ${row + 1}:${col + 1}`)
    } else {
      throw new Error(
        `Unexpected token type '${type}' at ${row + 1}:${col + 1}`
      )
    }

    peekableTokens.next()
  }

  if (node == null) {
    anchor = node = {
      id: null,
      data: {},
      parentId: null,
      children: []
    }
  } else {
    onNodeCreated({node})
  }

  while (!peekableTokens.peek().done) {
    let {type, value, progress} = peekableTokens.peek().value

    if (type === 'parenthesis' && value === '(') {
      peekableTokens.next()

      let child = _parseTokens(peekableTokens, node.id, options)

      if (child != null) {
        node.children.push(child)
      }
    } else if (type === 'parenthesis' && value === ')') {
      onProgress({progress})
      break
    }

    peekableTokens.next()
  }

  return anchor
}

exports.parseTokens = function(
  tokens,
  {
    getId = (id => () => id++)(0),
    dictionary = null,
    onProgress = () => {},
    onNodeCreated = () => {},
    shouldAdjustFoxKomi = true
  } = {}
) {
  let node = _parseTokens(new Peekable(tokens), null, {
    getId,
    dictionary,
    onProgress,
    onNodeCreated
  })

  let rootNodes = node.id == null ? node.children : [node]

  // Fox Go Server uses different Komi and in particular for even games will set it to 375.
  // Here we're following KaTrain's method to fixup Komi
  // https://github.com/sanderland/katrain/blob/485b55c42df4dd1c77abf21eefc23c9a17d6a512/katrain/core/sgf_parser.py#L422-L430
  let correctedKomi = 0
  let gameData = rootNodes[0].data
  if (
    shouldAdjustFoxKomi &&
    'AP' in gameData &&
    gameData['AP'].includes('foxwq') &&
    'KM' in gameData
  ) {
    if ('HA' in gameData && parseInt(gameData['HA']) >= 1) {
      correctedKomi = 0.5
    } else if (
      'RU' in gameData &&
      ['chinese', 'cn'].includes(gameData['RU'][0].toLowerCase())
    ) {
      correctedKomi = 7.5
    } else {
      correctedKomi = 6.5
    }

    gameData['KM'] = correctedKomi.toString()
  }
  return rootNodes
}

exports.parse = function(contents, options = {}) {
  return exports.parseTokens(tokenizeIter(contents), options)
}

exports.parseBuffer = function(buffer, options = {}) {
  return exports.parseTokens(
    tokenizeBufferIter(buffer, {encoding: options.encoding}),
    options
  )
}

exports.parseFile = function(filename, options = {}) {
  return exports.parseBuffer(fs.readFileSync(filename), options)
}
