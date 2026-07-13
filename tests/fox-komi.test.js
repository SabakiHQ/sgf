const t = require('tap')
const path = require('path')
const sgf = require('..')

t.test('Adjust komi in an even fox game', t => {
  let trees = sgf.parseFile(
    path.resolve(__dirname, 'sgf/fox_go_server_komi.sgf')
  )
  console.log(trees[0].data['KM'])
  t.same(['7.5'], trees[0].data['KM'])
  t.end()
})

t.test('Test Option to avoid fox komi adjustment', t => {
  let trees = sgf.parseFile(
    path.resolve(__dirname, 'sgf/fox_go_server_komi.sgf'),
    {shouldAdjustFoxKomi: false}
  )
  console.log(trees[0].data['KM'])
  t.same(['375'], trees[0].data['KM'])
  t.end()
})

t.test('Test uneven chinese rules game handicap adjustment', t => {
  let trees = sgf.parseFile(
    path.resolve(__dirname, 'sgf/fox_go_server_nokomi.sgf')
  )
  console.log(trees[0].data['KM'])
  t.same(['6.5'], trees[0].data['KM'])
  t.end()
})

t.test('Test other file not from fox', t => {
  let trees = sgf.parseFile(path.resolve(__dirname, 'sgf/non_fox_game.sgf'))
  t.same(['11'], trees[0].data['KM'])
  t.end()
})

t.test('Test fox handicap game', t => {
  let trees = sgf.parseFile(
    path.resolve(__dirname, 'sgf/fox_go_server_handicap.sgf')
  )
  t.same(['0.5'], trees[0].data['KM'])
  t.end()
})

t.test('Test japanese rules fox game', t => {
  let trees = sgf.parseFile(
    path.resolve(__dirname, 'sgf/fox_go_server_japanese.sgf')
  )
  t.same(['6.5'], trees[0].data['KM'])
  t.end()
})
