const t = require('tap')
const {stringify} = require('..')

let gametrees = [
    {
        nodes: [
            {B: ['aa'], SZ: ['19']},
            {AB: ['cc', 'dd:ee']}
        ],
        subtrees: []
    },
    {
        nodes: [{CP: ['Copyright']}],
        subtrees: [
            {
                nodes: [{B: ['ab']}],
                subtrees: []
            },
            {
                nodes: [{W: ['ac']}],
                subtrees: []
            }
        ]
    }
]

t.test('should stringify multiple game trees', t => {
    t.equal(
        stringify(gametrees),
        '(;B[aa]SZ[19]\n;AB[cc][dd:ee]\n)(;CP[Copyright]\n(;B[ab]\n)(;W[ac]\n))'
    )

    t.end()
})

t.test('should respect line break option', t => {
    t.equal(
        stringify(gametrees, {linebreak: ''}),
        '(;B[aa]SZ[19];AB[cc][dd:ee])(;CP[Copyright](;B[ab])(;W[ac]))'
    )

    t.end()
})

t.test('should ignore mixed case node properties', t => {
    t.equal(
        stringify({
            nodes: [{B: ['ab'], board: 'should ignore'}],
            subtrees: []
        }),
        ';B[ab]\n'
    )

    t.end()
})