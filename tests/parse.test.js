const t = require('tap')
const sgf = require('..')

function getJSON(tree) {
    return JSON.parse(JSON.stringify(tree, (key, value) => {
        if (key === 'id' || key === 'parentId') {
            return undefined
        } else if (key == 'children') {
            return value.map(getJSON)
        }

        return value
    }))
}

t.test('should parse multiple nodes', t => {
    t.deepEqual(
        getJSON(sgf.parse('(;B[aa]SZ[19];AB[cc][dd:ee])')[0]),
        getJSON({
            data: {B: ['aa'], SZ: ['19']},
            children: [{
                data: {AB: ['cc', 'dd:ee']},
                children: []
            }]
        })
    )

    t.end()
})

t.test('should not omit CA property', t => {
    t.deepEqual(
        getJSON(sgf.parse('(;B[aa]CA[UTF-8])', {encoding: 'ISO-8859-1'})[0]),
        getJSON({
            data: {B: ['aa'], CA: ['UTF-8']},
            children: []
        })
    )

    t.end()
})

t.test('should parse variations', t => {
    t.deepEqual(
        getJSON(sgf.parse('(;B[hh](;W[ii])(;W[hi]C[h]))')[0]),
        getJSON({
            data: {B: ['hh']},
            children: [
                {
                    data: {W: ['ii']},
                    children: []
                },
                {
                    data: {W: ['hi'], C: ['h']},
                    children: []
                }
            ]
        })
    )

    t.end()
})

t.test('should emit onNodeCreated correctly', t => {
    let nodes = []

    sgf.parse('(;B[hh](;W[ii])(;W[hi];C[h]))', {
        onNodeCreated({node}) {
            nodes.push(JSON.parse(JSON.stringify(node)))
        }
    })

    t.deepEqual(nodes, [
        {
            "children": [],
            "data": {"B": ["hh"]},
            "id": 0,
            "parentId": null
        },
        {
            "children": [],
            "data": {"W": ["ii"]},
            "id": 1,
            "parentId": 0
        },
        {
            "children": [],
            "data": {"W": ["hi"]},
            "id": 2,
            "parentId": 0
        },
        {
            "children": [],
            "data": {"C": ["h"]},
            "id": 3,
            "parentId": 2
        }
    ])

    t.end()
})

t.test('should convert lower case properties', t => {
    t.deepEqual(
        getJSON(sgf.parse('(;CoPyright[hello](;White[ii])(;White[hi]Comment[h]))')[0]),
        getJSON({
            data: {CP: ['hello']},
            children: [
                {
                    data: {W: ['ii']},
                    children: []
                },
                {
                    data: {W: ['hi'], C: ['h']},
                    children: []
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

t.test('should ignore empty variations', t => {
    t.deepEqual(
        getJSON(sgf.parse('(;B[hh]()(;W[ii])()(;W[hi]C[h]))')[0]),
        getJSON({
            data: {B: ['hh']},
            children: [
                {
                    data: {W: ['ii']},
                    children: []
                },
                {
                    data: {W: ['hi'], C: ['h']},
                    children: []
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

for (let language in languageMap) {
    t.test('should be able to decode non-UTF-8 text nodes', t => {
        t.equal(
            sgf.parseFile(`${__dirname}/${language}.sgf`)[0].children[0].children[0].data.C[0],
            `${languageMap[language]} is fun`
        )

        t.end()
    })
}

t.test('should be able to go back and re-parse attributes set before CA', t => {
    t.equal(
        sgf.parseFile(__dirname + '/chinese.sgf')[0].data.PW[0],
        '柯洁'
    )

    t.equal(
        sgf.parseFile(__dirname + '/chinese.sgf')[0].data.PB[0],
        '古力'
    )

    t.end()
})

t.test('should ignore unknown encodings', t => {
    t.notEqual(
        sgf.parseFile(__dirname + '/japanese_bad.sgf')[0].children[0].children[0].data.C[0],
        `${languageMap['japanese']} is fun`
    )

    t.end()
})

t.test('should ignore BOM markers', t => {
    t.doesNotThrow(() => {
        sgf.parseFile(__dirname + '/utf8bom.sgf')
    })

    t.end()
})

t.test('should parse a UTF-16 LE file correctly', t => {
    t.doesNotThrow(() => {
        sgf.parseFile(__dirname + '/utf16le.sgf')
    })

    t.end()
})
