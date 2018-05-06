const t = require('tap')
const sgf = require('..')

function getJSON(tree) {
    JSON.parse(JSON.stringify(tree, (key, value) => {
        if (key == 'id' || key == 'parent') {
            return undefined
        } else if (key == 'subtrees') {
            return value.map(getJSON)
        }

        return value
    }))
}

t.test('should parse multiple nodes', t => {
    t.equal(
        getJSON(sgf.parse('(;B[aa]SZ[19];AB[cc][dd:ee])')[0]),
        getJSON({
            nodes: [
                {B: ['aa'], SZ: ['19']},
                {AB: ['cc', 'dd:ee']}
            ],
            subtrees: []
        })
    )

    t.end()
})

t.test('should parse variations', t => {
    t.equal(
        getJSON(sgf.parse('(;B[hh](;W[ii])(;W[hi]C[h]))')[0]),
        getJSON({
            nodes: [{B: ['hh']}],
            subtrees: [
                {
                    nodes: [{W: ['ii']}],
                    subtrees: []
                },
                {
                    nodes: [{W: ['hi'], C: ['h']}],
                    subtrees: []
                }
            ]
        })
    )

    t.end()
})

t.test('should convert lower case properties', t => {
    t.equal(
        getJSON(sgf.parse('(;CoPyright[hello](;White[ii])(;White[hi]Comment[h]))')[0]),
        getJSON({
            nodes: [{CP: ['hello']}],
            subtrees: [
                {
                    nodes: [{W: ['ii']}],
                    subtrees: []
                },
                {
                    nodes: [{W: ['hi'], C: ['h']}],
                    subtrees: []
                }
            ]
        })
    )

    t.end()
})

t.test('should parse a relatively complex file', t => {
    let trees = sgf.parseFile(__dirname + '/complex.sgf')

    t.equal(trees.length, 1)
    t.end()
})

t.test('should ignore empty subtrees', t => {
    t.equal(
        getJSON(sgf.parse('(;B[hh]()(;W[ii])()(;W[hi]C[h]))')[0]),
        getJSON({
            nodes: [{B: ['hh']}],
            subtrees: [
                {
                    nodes: [{W: ['ii']}],
                    subtrees: []
                },
                {
                    nodes: [{W: ['hi'], C: ['h']}],
                    subtrees: []
                }
            ]
        })
    )

    t.end()
})

let languageMap = {
    'chinese': '围棋',
    'japanese': '囲碁',
    'korean': '바둑'
}

for (language in languageMap) {
    t.test('should be able to decode non-UTF-8 text nodes', t => {
        t.equal(
            sgf.parseFile(`${__dirname}/${language}.sgf`)[0].nodes[2].C[0],
            `${languageMap[language]} is fun`
        )

        t.end()
    })
}

t.test('should be able to go back and re-parse attributes set before CA', t => {
    t.equal(
        sgf.parseFile(__dirname + '/chinese.sgf')[0].nodes[0].PW[0],
        '柯洁'
    )

    t.equal(
        sgf.parseFile(__dirname + '/chinese.sgf')[0].nodes[0].PB[0],
        '古力'
    )

    t.end()
})

t.test('should ignore unknown encodings', t => {
    t.notEqual(
        sgf.parseFile(__dirname + '/japanese_bad.sgf')[0].nodes[2].C[0],
        `${languageMap['japanese']} is fun`
    )

    t.end()
})
