const t = require('tap')
const path = require('path')
const sgf = require('..')
const iconv = require('../src/iconv-lite')

// Round-trip cases: take known-correct content, encode it to a legacy charset
// with NO CA[] declaration, then parse it back (the parser has to auto-detect).
// If the encoding is recovered, we get the original text back. To cover a new
// encoding, add a row here -- no fixture file needed.
const roundtrip = [
  {
    name: 'Japanese, Shift-JIS, no CA',
    encoding: 'shift_jis',
    sgf:
      '(;GM[1]FF[4]EV[第46期棋聖戦]PB[井山裕太]PW[一力遼]C[コミ6目半、白番中押し勝ち];B[pd])',
    expect: {
      EV: '第46期棋聖戦',
      PB: '井山裕太',
      PW: '一力遼',
      C: 'コミ6目半、白番中押し勝ち'
    }
  },
  {
    name: 'Korean, EUC-KR, no CA',
    encoding: 'euc-kr',
    sgf: '(;GM[1]FF[4]EV[제46기 명인전]PB[신진서]PW[박정환]C[흑 불계승];B[pd])',
    expect: {EV: '제46기 명인전', PB: '신진서', PW: '박정환', C: '흑 불계승'}
  },
  {
    name: 'Chinese simplified, GB18030, no CA',
    encoding: 'gb18030',
    sgf: '(;GM[1]FF[4]EV[第25届三星杯]PB[柯洁]PW[党毅飞]C[黑中盘胜];B[pd])',
    expect: {EV: '第25届三星杯', PB: '柯洁', PW: '党毅飞', C: '黑中盘胜'}
  },
  {
    name: 'Chinese traditional, Big5, no CA',
    encoding: 'big5',
    sgf: '(;GM[1]FF[4]EV[第25屆三星盃]PB[柯潔]PW[黨毅飛]C[黑中盤勝];B[pd])',
    expect: {EV: '第25屆三星盃', PB: '柯潔', PW: '黨毅飛', C: '黑中盤勝'}
  },
  {
    name: 'Russian, windows-1251, no CA',
    encoding: 'windows-1251',
    sgf:
      '(;GM[1]FF[4]PB[Илья Шикшин]PW[Александр Динерштейн]C[Чёрные победили];B[pd])',
    expect: {
      PB: 'Илья Шикшин',
      PW: 'Александр Динерштейн',
      C: 'Чёрные победили'
    }
  },
  {
    name: 'UTF-8 with CJK, no CA',
    encoding: 'utf8',
    sgf: '(;GM[1]FF[4]PB[申真谞]PW[井山裕太]C[테스트 комментарий];B[pd])',
    expect: {PB: '申真谞', PW: '井山裕太', C: '테스트 комментарий'}
  }
]

for (let testCase of roundtrip) {
  t.test(`recovers ${testCase.name}`, t => {
    let buffer = iconv.encode(testCase.sgf, testCase.encoding)
    let root = sgf.parseBuffer(buffer)[0]

    for (let prop in testCase.expect) {
      t.equal(root.data[prop][0], testCase.expect[prop], prop)
    }

    t.end()
  })
}

t.test('a declared CA[] takes precedence over auto-detection', t => {
  // The bytes are EUC-KR, and CA says so, even though nothing else marks it.
  let buffer = iconv.encode('(;GM[1]FF[4]CA[EUC-KR]PB[신진서];B[pd])', 'euc-kr')
  t.equal(sgf.parseBuffer(buffer)[0].data.PB[0], '신진서')
  t.end()
})

t.test('recovers a real Nihon Ki-in Shift-JIS file (Sabaki #1029)', t => {
  // No CA[], Shift-JIS, and too short for jschardet -- the case that used to
  // throw "Encoding not recognized: 'null'".
  let root = sgf.parseFile(
    path.resolve(__dirname, 'sgf/encoding/nihon-kiin.sgf')
  )[0]

  t.equal(root.data.PW[0], '党毅飛')
  t.ok(root.data.TE[0].includes('世界最高棋士決定戦'))
  t.end()
})

t.test('does not throw when no encoding can be determined', t => {
  // A tiny buffer with a high byte that jschardet reports as null. Previously
  // this crashed in iconv.decode(buffer, null).
  let buffer = Buffer.from([
    0x28,
    0x3b,
    0x50,
    0x42,
    0x5b,
    0x81,
    0x40,
    0x5d,
    0x29
  ])
  t.doesNotThrow(() => sgf.parseBuffer(buffer))
  t.end()
})
