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
