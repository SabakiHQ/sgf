# sgf [![Build Status](https://travis-ci.org/SabakiHQ/sgf.svg?branch=master)](https://travis-ci.org/SabakiHQ/sgf)

A library for parsing SGF files.

## Installation

Use npm to install:

~~~
$ npm install @sabaki/sgf
~~~

## Usage

~~~js
const sgf = require('@sabaki/sgf')

let gametrees = sgf.parseFile('./game.sgf')
~~~

## Contributors

A big thanks to [@apetresc](https://github.com/apetresc) and [@fohristiwhirl](https://github.com/fohristiwhirl) for adding decoding and automatic encoding detection functionalities.

## API

### Game Tree

A game tree is represented by a simple JavaScript object with the following properties:

* `id` `<integer>` - A unique id of the tree
* `nodes` `<Object[]>`
* `subtrees` [`<GameTree[]>`](#game-tree)
* `current` `<integer>` | `<null>` - The index of the current active subtree, `null` if there are no subtrees
* `parent` [`<GameTree>`](#game-tree) | `<null>` - A reference to the parent game tree

Each node is a simple object. Its keys correspond to node properties which matches their [SGF property](https://www.red-bean.com/sgf/proplist.html) equivalent. Each key has an array of strings as value.

### Basic Functions

#### `sgf.tokenize(contents)`

- `contents` `<string>` - SGF input

Returns an array of objects with the following properties:

- `type` `<string>` - One of `"newline"`, `"whitespace"`, `"parenthesis"`, `"semicolon"`, `"prop_ident"`, `"c_value_type"`
- `value` `<string>`
- `row` `<integer>` - Zero-based index of row where the token starts
- `col` `<integer>` - Zero-based index of column where the token starts
- `pos` `<integer>` - Index in `contents` where the token starts

#### `sgf.tokenizeBuffer(buffer[, options])`

- `buffer` [`<Buffer>`](https://nodejs.org/api/buffer.html) - SGF input
- `options` `<Object>` *(optional)*
    - `encoding` `<string>` *(optional)*

Returns an array of tokens as in [`sgf.tokenize()`](#sgftokenizecontents). If `encoding` isn't set, we will automatically choose an encoding. Automatic encoding detection is only possible if peer dependencies are installed, otherwise UTF-8 will be used.

#### `sgf.parseTokens(tokens[, options])`

- `tokens` - List of tokens as returned by [`sgf.tokenize()`](#sgftokenizecontents)
- `options` `<Object>` *(optional)*
    - `getId` `<Function>` *(optional)*
    - `onProgress` `<Function>` *(optional)*

Returns an array of [game trees](#game-tree). `onProgress` will be called with an object with the following keys:

- `progress` `<number>` - Between `0` and `1`

`getId` can be specified to control the id generation. It will be called without any arguments. By default, we will use consecutive integers starting at `0` as ids.

#### `sgf.parse(contents[, options])`

- `contents` `<string>` - SGF input
- `options` `<Object>` *(optional)* - See [`sgf.parseTokens()`](#sgfparsetokenstokenscontents-options)

Returns an array of [game trees](#game-tree).

#### `sgf.parseBuffer(buffer[, options])`

- `buffer` [`<Buffer>`](https://nodejs.org/api/buffer.html) - The buffer
- `options` `<Object>` *(optional)*
    - `encoding` `<string>` *(optional)* - See [`sgf.tokenizeBuffer()`](#sgftokenizebufferbuffer-options)
    - `getId` `<Function>` *(optional)* - See [`sgf.parseTokens()`](#sgfparsetokenstokenscontents-options)
    - `onProgress` `<Function>` *(optional)* - See [`sgf.parseTokens()`](#sgfparsetokenstokenscontents-options)

Returns an array of [game trees](#game-tree).

#### `sgf.parseFile(filename[, options])`

- `filename` `<string>` - Path to an SGF file
- `options` `<Object>` *(optional)* - See [`sgf.parseBuffer()`](#sgfparsebufferbuffer-options)

Returns an array of [game trees](#game-tree). Automatically detects encoding.

#### `sgf.stringify(trees[, options])`

- `trees` [`<GameTree[]>`](#game-tree)
- `options` `<Object>` *(optional)*
    - `linebreak` `<string>` *(optional)* - Default: `"\n"`

Returns an SGF string representing `trees`.

### Helper Functions

#### `sgf.escapeString(input)`

- `input` `<string>`

Escapes `\` and `]` characters and returns the new string.

#### `sgf.unescapeString(input)`

- `input` `<string>`

Resolves escaped characters and returns the new string.

#### `sgf.parseVertex(input)`

- `input` `<string>`

Turns an SGF point string into a vertex, an integer array of the form `[x, y]`. An invalid string will yield `[-1, -1]`.

#### `sgf.stringifyVertex(vertex)`

- `vertex` `<integer[]>`

Turns a vertex into an SGF point string. Returns an empty string if vertex is invalid.

#### `sgf.parseCompressedVertices(input)`

- `input` `<string>`

Turns an SGF compressed point list into an array of vertices.

#### `sgf.parseDates(input)`

- `input` `<string>`

Parses an SGF date string into an array of date arrays, integer arrays of the form `[year, month, date]`.

#### `sgf.stringifyDates(dates)`

- `dates` `<integer[][]>`

Turns an array of date arrays and returns an SGF date string.
