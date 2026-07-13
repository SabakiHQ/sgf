/*
 * DEBUG MAIN
 *
 * This is a simple "main" function that imports the library and with vscode's launch.json, allows you to
 * attach a debugger and step through the library's code with a reasonably complex case. You don't want
 * to debug via test cases in my experience because they have a baked in timeout.
 *
 */
const sgf = require('./main')
const path = require('path')

let pathname = path.resolve(__dirname, '../tests/sgf/fox_go_server.sgf')
let rootNode = sgf.parseFile(pathname)
console.log(rootNode)
