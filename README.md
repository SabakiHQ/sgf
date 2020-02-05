# @sabaki/sgf [![Build Status](https://travis-ci.org/SabakiHQ/sgf.svg?branch=master)](https://travis-ci.org/SabakiHQ/sgf)

A library for parsing SGF files.

## Installation

Use npm to install:

```
$ npm install @sabaki/sgf
```

## Usage

```js
const sgf = require('@sabaki/sgf')

let rootNodes = sgf.parseFile('./game.sgf')
```

`rootNodes` looks like this:

```js
[
  {
    id: 1,
    data: {B: ['dd'], ...},
    parentId: null,
    children: [
      {
        id: 2,
        data: {W: ['dq']},
        parentId: 1,
        children: []
      },
      ...
    ]
  },
  ...
]
```

### Use in the browser

You can use this library in the browser by using a bundler, such as webpack. If
you do, you need to add the following lines to your webpack configuration:

```js
{
  ...
  externals: {
    'fs': 'null',

    // Add the next lines to disable automatic encoding detection
    // and reduce bundle size:
    'jschardet': 'null',
    'iconv-lite': 'null'
  }
}
```

Note that [`parseFile`](#sgfparsefilefilename-options) is not available in the
browser; you have to use [`parse`](#sgfparsecontents-options) instead.

### Integration with [@sabaki/immutable-gametree](https://github.com/SabakiHQ/immutable-gametree)

This library uses the same node structure as
[@sabaki/immutable-gametree](https://github.com/SabakiHQ/immutable-gametree) and
is fully compatible with it. To wrap parsed SGF into game trees, you can write,
for example, something like this:

```js
const sgf = require('@sabaki/sgf')
const GameTree = require('@sabaki/immutable-gametree')

let getId = (id => () => id++)(0)
let rootNodes = sgf.parse(content, {getId})
let gameTrees = rootNodes.map(rootNode => {
  return new GameTree({getId, root: rootNode})
})
```

Make sure the id generation function is shared between `@sabaki/sgf` and
`@sabaki/immutable-gametree`.

## Contributors

A big thanks to [@apetresc](https://github.com/apetresc) and
[@fohristiwhirl](https://github.com/fohristiwhirl) for adding decoding and
automatic encoding detection functionalities.

## API

### Node Object

A tree _node_ is represented by an object of the following form:

```js
{
  id: <Primitive>,
  data: {
    [property]: <Array<String>>
  },
  parentId: <Primitive> | null,
  children: <Array<NodeObject>>
}
```

`data` contains node properties which matches their
[SGF property](https://www.red-bean.com/sgf/proplist.html) equivalent.

---

### Basic Functions

#### `*sgf.tokenizeIter(contents)`

- `contents` `<String>` - SGF input

A generator function that yields SGF tokens, objects of the following form:

```js
{
  type: <String>,
  value: <String>,
  row: <Integer>,
  col: <Integer>,
  pos: <Integer>,
  progress: <Number>
}
```

`type` is one of `"parenthesis"`, `"semicolon"`, `"prop_ident"`,
`"c_value_type"`, `"invalid"`. `row` is the zero-based index of the row where
the token starts, `col` the zero-based index of column where the token starts,
and `pos` denotes the index in `contents` where the token starts. `progress` is
a number between `0` and `1` denoting the percental position of the token.

#### `sgf.tokenize(contents)`

The same as [`sgf.tokenizeIter`](#sgftokenizeitercontents), except this function
will return an array.

#### `*sgf.tokenizeBufferIter(buffer[, options])`

- `buffer` [`<Buffer>`](https://nodejs.org/api/buffer.html) - SGF input
- `options` `<Object>` _(optional)_
  - `encoding` `<String>` _(optional)_

A generator function that yields SGF tokens as in
[`sgf.tokenizeIter()`](#sgftokenizeitercontents). If `encoding` isn't set, we
will automatically choose an encoding. Automatic encoding detection is only
possible if optional dependencies are installed, otherwise UTF-8 will be used.

#### `sgf.tokenizeBuffer(buffer[, options])`

The same as [`sgf.tokenizeBufferIter`](#sgftokenizebufferiterbuffer-options),
except this function will return an array.

#### `sgf.parseTokens(tokens[, options])`

- `tokens` - List of tokens as returned by
  [`sgf.tokenize()`](#sgftokenizecontents)
- `options` `<Object>` _(optional)_
  - `getId` `<Function>` _(optional)_
  - `dictionary` `<Object>` _(optional)_
  - `onProgress` `<Function>` _(optional)_
  - `onNodeCreated` `<Function>` _(optional)_

Returns an array of [node objects](#node-object) which represent the root nodes
of each game tree.

`getId` can be specified to control the id generation. It will be called without
any arguments. By default, we will use consecutive integers starting at `0` as
ids.

Pass an object to `dictionary` and it will get filled with references to all the
nodes with their ids as keys.

`onProgress` will be called with an object with the following keys:

- `progress` `<Number>` - Between `0` and `1`

`onNodeCreated` will be called when property parsing has been completed for a
node. It will be called with an object with the following keys:

- `node` [`<NodeObject>`](#node-object)

#### `sgf.parse(contents[, options])`

- `contents` `<String>` - SGF input
- `options` `<Object>` _(optional)_ - See
  [`sgf.parseTokens()`](#sgfparsetokenstokens-options)

Returns an array of [node objects](#node-object).

#### `sgf.parseBuffer(buffer[, options])`

- `buffer` [`<Buffer>`](https://nodejs.org/api/buffer.html) - The buffer
- `options` `<Object>` _(optional)_
  - `encoding` `<String>` _(optional)_ - See
    [`sgf.tokenizeBuffer()`](#sgftokenizebufferbuffer-options)
  - `getId` `<Function>` _(optional)_ - See
    [`sgf.parseTokens()`](#sgfparsetokenstokens-options)
  - `dictionary` `<Object>` _(optional)_ - See
    [`sgf.parseTokens()`](#sgfparsetokenstokens-options)
  - `onProgress` `<Function>` _(optional)_ - See
    [`sgf.parseTokens()`](#sgfparsetokenstokens-options)

Returns an array of [node objects](#node-object).

#### `sgf.parseFile(filename[, options])`

- `filename` `<String>` - Path to an SGF file
- `options` `<Object>` _(optional)_ - See
  [`sgf.parseBuffer()`](#sgfparsebufferbuffer-options)

Returns an array of [node objects](#node-object). Automatically detects
encoding.

#### `sgf.stringify(nodes[, options])`

- `nodes` [`<NodeObject[]>`](#node-object)
- `options` `<Object>` _(optional)_
  - `linebreak` `<String>` _(optional)_ - Default: `"\n"`
  - `indent` `<String>` _(optional)_ - Default: `" "`

Returns an SGF string representing the root nodes `nodes`.

---

### Helper Functions

#### `sgf.escapeString(input)`

- `input` `<String>`

Escapes `\` and `]` characters and returns the new string.

#### `sgf.unescapeString(input)`

- `input` `<String>`

Resolves escaped characters and returns the new string.

#### `sgf.parseVertex(input)`

- `input` `<String>`

Turns an SGF point string into a vertex, an integer array of the form `[x, y]`.
An invalid string will yield `[-1, -1]`.

#### `sgf.stringifyVertex(vertex)`

- `vertex` `<Integer[]>`

Turns a vertex into an SGF point string. Returns an empty string if vertex is
invalid.

#### `sgf.parseCompressedVertices(input)`

- `input` `<String>`

Turns an SGF compressed point list into an array of vertices.

#### `sgf.parseDates(input)`

- `input` `<String>`

Parses an SGF date string into an array of date arrays, integer arrays of the
form `[year, month, date]`.

#### `sgf.stringifyDates(dates)`

- `dates` `<Integer[][]>`

Turns an array of date arrays and returns an SGF date string.
