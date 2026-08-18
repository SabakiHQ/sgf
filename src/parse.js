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

  // Fox Go Server uses different Komi in sgf. KaTrain fixed it up as below.
  // https://github.com/sanderland/katrain/blob/485b55c42df4dd1c77abf21eefc23c9a17d6a512/katrain/core/sgf_parser.py#L422-L430

  /*
   * This is trickier than it seems.
   *
   * HA = Handicap
   * AB = Add Black
   * KM = Komi
   *
   * Fox isn't using HA and AB together which would be required to be in spec. Specifically HA says how many handicap stones
   * you're adding and AB says where they are.
   *
   * It is using HA as a way to tweak KM, Komi and at other times using it with AB.
   *
   * For Chinese rules it looks like the pattern is:
   * KM = 0, HA = 1 would be komi of 6.5 -- the game wasn't even but no handicap stones.
   * KM = 375, HA = 0 would be komi of 7.5 -- the game was even game
   * Beyond HA = 1, I think Komi is 0.5 and I have examples of it being used with AB.
   *
   * Unsure about komi in other rulesets, japanese, korean, agf, etc.
   *
   * There is some indication japaense may be 6.5 based on this table and a few sgfs in the same thread. https://github.com/sanderland/katrain/issues/177#issuecomment-683108708
   * It appears to show up as 650 in the KM field. Because of that and many systems using 6.5 Komi, i'll go with that as the default "correct" value.
   *
   */
  let correctedKomi = 0
  let gameData = rootNodes[0].data
  if (
    shouldAdjustFoxKomi &&
    'AP' in gameData &&
    gameData['AP'].includes('foxwq') &&
    'KM' in gameData
  ) {
    let rules = 'RU' in gameData ? gameData['RU'][0].toLowerCase() : 'Unknown'
    let handicap = 'HA' in gameData ? parseInt(gameData['HA']) : -1
    let hasHandicapStones = 'AB' in rootNodes[0].children[0].data // never seen a handicap game or example using white always, black.
    let komi = 'KM' in gameData ? parseInt(gameData['KM']) : -1

    correctedKomi = 6.5

    if (rules.includes('chinese') && komi === 375) {
      correctedKomi = 7.5
    }

    // For Chinese rules games fox uses KM:0,HA:1 to indicate 6.5 komi
    // To avoid that, actually detect both HA and presence of handicap stones.
    if (handicap >= 1 && hasHandicapStones) {
      correctedKomi = 0.5
    }

    gameData['KM'] = [correctedKomi.toString()]
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
