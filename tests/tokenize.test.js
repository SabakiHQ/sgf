const t = require('tap')
const {tokenize} = require('..')

t.test('should track source position correctly', t => {
    t.deepEqual(tokenize('(;B[aa]SZ[19]\n;AB[cc]\n[dd:ee])'), [
        {type: 'parenthesis', value: '(', row: 0, col: 0, pos: 0},
        {type: 'semicolon', value: ';', row: 0, col: 1, pos: 1},
        {type: 'prop_ident', value: 'B', row: 0, col: 2, pos: 2},
        {type: 'c_value_type', value: '[aa]', row: 0, col: 3, pos: 3},
        {type: 'prop_ident', value: 'SZ', row: 0, col: 7, pos: 7},
        {type: 'c_value_type', value: '[19]', row: 0, col: 9, pos: 9},
        {type: 'semicolon', value: ';', row: 1, col: 0, pos: 14},
        {type: 'prop_ident', value: 'AB', row: 1, col: 1, pos: 15},
        {type: 'c_value_type', value: '[cc]', row: 1, col: 3, pos: 17},
        {type: 'c_value_type', value: '[dd:ee]', row: 2, col: 0, pos: 22},
        {type: 'parenthesis', value: ')', row: 2, col: 7, pos: 29}
    ])

    t.end()
})

t.test('should take escaping values into account', t => {
    t.deepEqual(tokenize('(;C[hello\\]world];C[hello\\\\];C[hello])'), [
        {type: 'parenthesis', value: '(', row: 0, col: 0, pos: 0},
        {type: 'semicolon', value: ';', row: 0, col: 1, pos: 1},
        {type: 'prop_ident', value: 'C', row: 0, col: 2, pos: 2},
        {type: 'c_value_type', value: '[hello\\]world]', row: 0, col: 3, pos: 3},
        {type: 'semicolon', value: ';', row: 0, col: 17, pos: 17},
        {type: 'prop_ident', value: 'C', row: 0, col: 18, pos: 18},
        {type: 'c_value_type', value: '[hello\\\\]', row: 0, col: 19, pos: 19},
        {type: 'semicolon', value: ';', row: 0, col: 28, pos: 28},
        {type: 'prop_ident', value: 'C', row: 0, col: 29, pos: 29},
        {type: 'c_value_type', value: '[hello]', row: 0, col: 30, pos: 30},
        {type: 'parenthesis', value: ')', row: 0, col: 37, pos: 37}
    ])

    t.deepEqual(tokenize('(;C[\\];B[aa];W[bb])'), [
        {type: 'parenthesis', value: '(', row: 0, col: 0, pos: 0},
        {type: 'semicolon', value: ';', row: 0, col: 1, pos: 1},
        {type: 'prop_ident', value: 'C', row: 0, col: 2, pos: 2},
        {type: 'c_value_type', value: '[\\];B[aa]', row: 0, col: 3, pos: 3},
        {type: 'semicolon', value: ';', row: 0, col: 12, pos: 12},
        {type: 'prop_ident', value: 'W', row: 0, col: 13, pos: 13},
        {type: 'c_value_type', value: '[bb]', row: 0, col: 14, pos: 14},
        {type: 'parenthesis', value: ')', row: 0, col: 18, pos: 18}
    ])

    t.end()
})

t.test('should allow lower case properties', t => {
    t.deepEqual(tokenize('(;CoPyright[blah])'), [
        {type: 'parenthesis', value: '(', row: 0, col: 0, pos: 0},
        {type: 'semicolon', value: ';', row: 0, col: 1, pos: 1},
        {type: 'prop_ident', value: 'CoPyright', row: 0, col: 2, pos: 2},
        {type: 'c_value_type', value: '[blah]', row: 0, col: 11, pos: 11},
        {type: 'parenthesis', value: ')', row: 0, col: 17, pos: 17}
    ])

    t.end()
})
