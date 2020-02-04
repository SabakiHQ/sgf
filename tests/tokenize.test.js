const t = require('tap')
const {tokenize} = require('..')

t.test('should track source position correctly', t => {
  let contents = '(;B[aa]SZ[19]\n;AB[cc]\n[dd:ee])'
  let len = contents.length - 1

  t.deepEqual(tokenize(contents), [
    {
      type: 'parenthesis',
      value: '(',
      row: 0,
      col: 0,
      pos: 0,
      progress: 0 / len
    },
    {type: 'semicolon', value: ';', row: 0, col: 1, pos: 1, progress: 1 / len},
    {type: 'prop_ident', value: 'B', row: 0, col: 2, pos: 2, progress: 2 / len},
    {
      type: 'c_value_type',
      value: '[aa]',
      row: 0,
      col: 3,
      pos: 3,
      progress: 3 / len
    },
    {
      type: 'prop_ident',
      value: 'SZ',
      row: 0,
      col: 7,
      pos: 7,
      progress: 7 / len
    },
    {
      type: 'c_value_type',
      value: '[19]',
      row: 0,
      col: 9,
      pos: 9,
      progress: 9 / len
    },
    {
      type: 'semicolon',
      value: ';',
      row: 1,
      col: 0,
      pos: 14,
      progress: 14 / len
    },
    {
      type: 'prop_ident',
      value: 'AB',
      row: 1,
      col: 1,
      pos: 15,
      progress: 15 / len
    },
    {
      type: 'c_value_type',
      value: '[cc]',
      row: 1,
      col: 3,
      pos: 17,
      progress: 17 / len
    },
    {
      type: 'c_value_type',
      value: '[dd:ee]',
      row: 2,
      col: 0,
      pos: 22,
      progress: 22 / len
    },
    {
      type: 'parenthesis',
      value: ')',
      row: 2,
      col: 7,
      pos: 29,
      progress: 29 / len
    }
  ])

  t.end()
})

t.test('should take escaping values into account', t => {
  let contents = '(;C[hello\\]world];C[hello\\\\];C[hello])'
  let len = contents.length - 1

  t.deepEqual(tokenize(contents), [
    {
      type: 'parenthesis',
      value: '(',
      row: 0,
      col: 0,
      pos: 0,
      progress: 0 / len
    },
    {type: 'semicolon', value: ';', row: 0, col: 1, pos: 1, progress: 1 / len},
    {type: 'prop_ident', value: 'C', row: 0, col: 2, pos: 2, progress: 2 / len},
    {
      type: 'c_value_type',
      value: '[hello\\]world]',
      row: 0,
      col: 3,
      pos: 3,
      progress: 3 / len
    },
    {
      type: 'semicolon',
      value: ';',
      row: 0,
      col: 17,
      pos: 17,
      progress: 17 / len
    },
    {
      type: 'prop_ident',
      value: 'C',
      row: 0,
      col: 18,
      pos: 18,
      progress: 18 / len
    },
    {
      type: 'c_value_type',
      value: '[hello\\\\]',
      row: 0,
      col: 19,
      pos: 19,
      progress: 19 / len
    },
    {
      type: 'semicolon',
      value: ';',
      row: 0,
      col: 28,
      pos: 28,
      progress: 28 / len
    },
    {
      type: 'prop_ident',
      value: 'C',
      row: 0,
      col: 29,
      pos: 29,
      progress: 29 / len
    },
    {
      type: 'c_value_type',
      value: '[hello]',
      row: 0,
      col: 30,
      pos: 30,
      progress: 30 / len
    },
    {
      type: 'parenthesis',
      value: ')',
      row: 0,
      col: 37,
      pos: 37,
      progress: 37 / len
    }
  ])

  contents = '(;C[\\];B[aa];W[bb])'
  len = contents.length - 1

  t.deepEqual(tokenize(contents), [
    {
      type: 'parenthesis',
      value: '(',
      row: 0,
      col: 0,
      pos: 0,
      progress: 0 / len
    },
    {type: 'semicolon', value: ';', row: 0, col: 1, pos: 1, progress: 1 / len},
    {type: 'prop_ident', value: 'C', row: 0, col: 2, pos: 2, progress: 2 / len},
    {
      type: 'c_value_type',
      value: '[\\];B[aa]',
      row: 0,
      col: 3,
      pos: 3,
      progress: 3 / len
    },
    {
      type: 'semicolon',
      value: ';',
      row: 0,
      col: 12,
      pos: 12,
      progress: 12 / len
    },
    {
      type: 'prop_ident',
      value: 'W',
      row: 0,
      col: 13,
      pos: 13,
      progress: 13 / len
    },
    {
      type: 'c_value_type',
      value: '[bb]',
      row: 0,
      col: 14,
      pos: 14,
      progress: 14 / len
    },
    {
      type: 'parenthesis',
      value: ')',
      row: 0,
      col: 18,
      pos: 18,
      progress: 18 / len
    }
  ])

  t.end()
})

t.test('should allow lower case properties', t => {
  let contents = '(;CoPyright[blah])'
  let len = contents.length - 1

  t.deepEqual(tokenize(contents), [
    {
      type: 'parenthesis',
      value: '(',
      row: 0,
      col: 0,
      pos: 0,
      progress: 0 / len
    },
    {type: 'semicolon', value: ';', row: 0, col: 1, pos: 1, progress: 1 / len},
    {
      type: 'prop_ident',
      value: 'CoPyright',
      row: 0,
      col: 2,
      pos: 2,
      progress: 2 / len
    },
    {
      type: 'c_value_type',
      value: '[blah]',
      row: 0,
      col: 11,
      pos: 11,
      progress: 11 / len
    },
    {
      type: 'parenthesis',
      value: ')',
      row: 0,
      col: 17,
      pos: 17,
      progress: 17 / len
    }
  ])

  t.end()
})

t.test('should take new lines inside token values into account', t => {
  let contents = '(;C[bl\nah])'
  let len = contents.length - 1

  t.deepEqual(tokenize(contents), [
    {
      type: 'parenthesis',
      value: '(',
      row: 0,
      col: 0,
      pos: 0,
      progress: 0 / len
    },
    {type: 'semicolon', value: ';', row: 0, col: 1, pos: 1, progress: 1 / len},
    {type: 'prop_ident', value: 'C', row: 0, col: 2, pos: 2, progress: 2 / len},
    {
      type: 'c_value_type',
      value: '[bl\nah]',
      row: 0,
      col: 3,
      pos: 3,
      progress: 3 / len
    },
    {
      type: 'parenthesis',
      value: ')',
      row: 1,
      col: 3,
      pos: 10,
      progress: 10 / len
    }
  ])

  t.end()
})

t.test('should return invalid tokens', t => {
  let contents = '(;C[hi]%[invalid])'
  let len = contents.length - 1

  t.deepEqual(tokenize(contents), [
    {
      type: 'parenthesis',
      value: '(',
      row: 0,
      col: 0,
      pos: 0,
      progress: 0 / len
    },
    {
      type: 'semicolon',
      value: ';',
      row: 0,
      col: 1,
      pos: 1,
      progress: 1 / len
    },
    {
      type: 'prop_ident',
      value: 'C',
      row: 0,
      col: 2,
      pos: 2,
      progress: 2 / len
    },
    {
      type: 'c_value_type',
      value: '[hi]',
      row: 0,
      col: 3,
      pos: 3,
      progress: 3 / len
    },
    {
      type: 'invalid',
      value: '%',
      row: 0,
      col: 7,
      pos: 7,
      progress: 7 / len
    },
    {
      type: 'c_value_type',
      value: '[invalid]',
      row: 0,
      col: 8,
      pos: 8,
      progress: 8 / len
    },
    {
      type: 'parenthesis',
      value: ')',
      row: 0,
      col: 17,
      pos: 17,
      progress: 17 / len
    }
  ])

  t.end()
})
