# sgf [![Build Status](https://travis-ci.org/SabakiHQ/sgf.svg?branch=master)](https://travis-ci.org/SabakiHQ/sgf)

A library for parsing and editing SGF files. This is a work in progress.

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

## API

### Game Tree

A game tree is represented by a simple JavaScript object with the following properties:

* `id` `<integer>` - A unique id of the tree
* `nodes` `<Object[]>`
* `subtrees` [`<GameTree[]>`](#game-tree)
* `parent` [`<GameTree>`](#game-tree) | `<null>`

The nodes are also simple objects. Their keys correspond to node properties which closely matches the [SGF specification](http://www.red-bean.com/sgf/). Each key has an array of strings as value.

### Basic Functions

#### `sgf.tokenize(contents)`

- `contents` `<string>` - SGF input

Returns an array of objects with the following properties:

- `type` `<string>` - One of `"newline"`, `"whitespace"`, `"parenthesis"`, `"semicolon"`, `"prop_ident"`, `"c_value_type"`
- `value` `<string>`
- `row` `<integer>` - Zero-based index of row where the token starts
- `col` `<integer>` - Zero-based index of column where the token starts
- `pos` `<integer>` - Index in `contents` where the token starts

#### `sgf.parseTokens(tokens[, options])`

- `tokens` - List of tokens as returned by `sgf.tokenize()`
- `options` `<Object>` *(optional)*
    - `encoding` `<string>` | `<null>` *(optional)* - Default: `null`
    - `onProgress` `<Function>` *(optional)*

Returns an array of [game trees](#game-tree). If `encoding` is set to `null`, we will use the `CA` property to determine encoding, otherwise, the default encoding `ISO-8859-1` will be used. `onProgress` will be called with an object with the following keys:

- `progress` `<number>` - Between `0` and `1`

#### `sgf.parse(contents[, options])`

- `contents` `<string>` - SGF input
- `options` `<Object>` *(optional)* - See `sgf.parseTokens()`

Returns an array of [game trees](#game-tree).

#### `sgf.parseFile(filename[, options])`

- `filename` `<string>` - Path to an SGF file
- `options` `<Object>` *(optional)*
    - `onProgress` `<Function>` *(optional)* - See `sgf.parseTokens()`
    - `detectEncoding` `<boolean>` *(optional)* - Default: `true`

Returns an array of [game trees](#game-tree).

#### `sgf.detectEncoding(tokens[, options])`

- `tokens` - List of tokens as returned by `sgf.tokenize()`
- `options` `<Object>` *(optional)*
    - `sampleLength` `<integer>` *(optional)* - Default: `100`

Returns the value in the `CA` property if set. Otherwise, we will try to detect the encoding automatically.

#### `sgf.stringify(trees[, options])`

- `trees` [`<GameTree[]>`](#game-tree)
- `options` `<Object>` *(optional)*
    - `linebreak` `<string>` *(optional)* - Default: `"\n"`

Returns an SGF string representing `trees`.
