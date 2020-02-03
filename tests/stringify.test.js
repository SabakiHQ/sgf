const t = require('tap')
const {stringify} = require('..')

let gametrees = [
  {
    data: {B: ['aa'], SZ: ['19']},
    children: [
      {
        data: {AB: ['cc', 'dd:ee']},
        children: []
      }
    ]
  },
  {
    data: {CP: ['Copyright']},
    children: [
      {
        data: {B: ['ab']},
        children: []
      },
      {
        data: {W: ['ac']},
        children: []
      }
    ]
  }
]

t.test('should stringify single game tree with parenthesis', t => {
  t.equal(
    stringify(gametrees.slice(0, 1)),
    '(\n  ;B[aa]SZ[19]\n  ;AB[cc][dd:ee]\n)\n'
  )

  t.end()
})

t.test('should stringify multiple game trees with correct indentation', t => {
  t.equal(
    stringify(gametrees),
    '(\n  ;B[aa]SZ[19]\n  ;AB[cc][dd:ee]\n)(\n  ;CP[Copyright]\n  (\n    ;B[ab]\n  )(\n    ;W[ac]\n  )\n)\n'
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
      data: {B: ['ab'], board: 'should ignore'},
      children: []
    }),
    ';B[ab]\n'
  )

  t.end()
})
