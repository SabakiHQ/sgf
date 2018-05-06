const t = require('tap')
const sgf = require('..')

t.test('string2dates', t => {
    t.test('should parse comma-separated dates', t => {
        t.deepEqual(sgf.string2dates('1996-12-27,1997-01-03'), [
            [1996, 12, 27], [1997, 1, 3]
        ])
        
        t.end()
    })
    t.test('should be able to handle empty strings', t => {
        t.deepEqual(sgf.string2dates(''), [])
        
        t.end()
    })
    t.test('should handle short-hand notation', t => {
        t.deepEqual(sgf.string2dates('1996-05,06'), [
            [1996, 5], [1996, 6]
        ])
        t.deepEqual(sgf.string2dates('1996-05,06-01'), [
            [1996, 5], [1996, 6, 1]
        ])
        t.deepEqual(sgf.string2dates('1996-05,1997'), [
            [1996, 5], [1997]
        ])
        t.deepEqual(sgf.string2dates('1996-05-06,07,08'), [
            [1996, 5, 6], [1996, 5, 7], [1996, 5, 8]
        ])
        t.deepEqual(sgf.string2dates('1996,1997'), [
            [1996], [1997]
        ])
        t.deepEqual(sgf.string2dates('1996-12-27,28,1997-01-03,04'), [
            [1996, 12, 27], [1996, 12, 28], [1997, 1, 3], [1997, 1, 4]
        ])
        
        t.end()
    })
    
    t.end()
})

t.test('dates2string', t => {
    t.test('should work', t => {
        t.equal(sgf.dates2string([
            [1996, 5], [1996, 6]
        ]), '1996-05,06')
        t.equal(sgf.dates2string([
            [1996, 5], [1996, 6, 1]
        ]), '1996-05,06-01')
        t.equal(sgf.dates2string([
            [1996, 5], [1997]
        ]), '1996-05,1997')
        t.equal(sgf.dates2string([
            [1996, 5, 6], [1996, 5, 7], [1996, 5, 8]
        ]), '1996-05-06,07,08')
        t.equal(sgf.dates2string([
            [1996], [1997]
        ]), '1996,1997')
        t.equal(sgf.dates2string([
            [1996, 12, 27], [1996, 12, 28], [1997, 1, 3], [1997, 1, 4]
        ]), '1996-12-27,28,1997-01-03,04')
        
        t.end()
    })
    t.test('should be able to handle empty strings', t => {
        t.equal(sgf.dates2string([]), '')
        
        t.end()
    })
    t.test('should be inverse to string2dates', t => {
        t.deepEqual(sgf.string2dates(sgf.dates2string([
            [1996, 5], [1996, 6]
        ])), [
            [1996, 5], [1996, 6]
        ])
        t.deepEqual(sgf.string2dates(sgf.dates2string([
            [1996, 5, 6], [1996, 5, 7], [1996, 5, 8]
        ])), [
            [1996, 5, 6], [1996, 5, 7], [1996, 5, 8]
        ])
        t.deepEqual(sgf.string2dates(sgf.dates2string([
            [1996], [1997]
        ])), [
            [1996], [1997]
        ])
        t.deepEqual(sgf.string2dates(sgf.dates2string([
            [1996, 12, 27], [1996, 12, 28], [1997, 1, 3], [1997, 1, 4]
        ])), [
            [1996, 12, 27], [1996, 12, 28], [1997, 1, 3], [1997, 1, 4]
        ])

        t.equal(sgf.dates2string(sgf.string2dates('1996-05,06')), '1996-05,06')
        t.equal(sgf.dates2string(sgf.string2dates('1996-05-06,07,08')), '1996-05-06,07,08')
        t.equal(sgf.dates2string(sgf.string2dates('1996,1997')), '1996,1997')
        t.equal(sgf.dates2string(sgf.string2dates('1996-12-27,28,1997-01-03,04')), '1996-12-27,28,1997-01-03,04')
        
        t.end()
    })
    
    t.end()
})

t.test('point2vertex', t => {
    t.test('should return [-1, -1] when passing string with length > 2', t => {
        t.deepEqual(sgf.point2vertex(''), [-1, -1])
        t.deepEqual(sgf.point2vertex('d'), [-1, -1])
        t.deepEqual(sgf.point2vertex('blah'), [-1, -1])
    
        t.end()
    })
    t.test('should work', t => {
        t.deepEqual(sgf.point2vertex('bb'), [1, 1])
        t.deepEqual(sgf.point2vertex('jj'), [9, 9])
        t.deepEqual(sgf.point2vertex('jf'), [9, 5])
        t.deepEqual(sgf.point2vertex('fa'), [5, 0])
        t.deepEqual(sgf.point2vertex('fA'), [5, 26])
        t.deepEqual(sgf.point2vertex('AB'), [26, 27])
    
        t.end()
    })
    t.test('should be left inverse to vertex2point', t => {
        let tests = [[-1, -1], [10, 5], [9, 28], [30, 27], [0, 0]]
        tests.forEach(test => t.deepEqual(sgf.point2vertex(sgf.vertex2point(test)), test))
    
        t.end()
    })

    t.end()
})

t.test('vertex2point', t => {
    t.test('should return empty string when passing negative values', t => {
        t.equal(sgf.vertex2point([-4, -5]), '')
        t.equal(sgf.vertex2point([-4, 5]), '')
        t.equal(sgf.vertex2point([4, -5]), '')
        
        t.end()
    })
    t.test('should return empty string when passing too big values', t => {
        t.equal(sgf.vertex2point([100, 100]), '')
        t.equal(sgf.vertex2point([100, 1]), '')
        t.equal(sgf.vertex2point([1, 100]), '')
        
        t.end()
    })
    t.test('should work', t => {
        t.equal(sgf.vertex2point([1, 1]), 'bb')
        t.equal(sgf.vertex2point([9, 9]), 'jj')
        t.equal(sgf.vertex2point([9, 5]), 'jf')
        t.equal(sgf.vertex2point([5, 0]), 'fa')
        t.equal(sgf.vertex2point([5, 26]), 'fA')
        t.equal(sgf.vertex2point([26, 27]), 'AB')
        
        t.end()
    })
    t.test('should be left inverse to point2vertex', t => {
        let tests = ['', 'df', 'AB', 'fA', 'fa']
        tests.forEach(test => t.equal(sgf.vertex2point(sgf.point2vertex(test)), test))
        
        t.end()
    })
    
    t.end()
})

t.test('compressed2vertices', t => {
    t.test('should handle points normally', t => {
        t.deepEqual(sgf.compressed2vertices('ce'), [sgf.point2vertex('ce')])
        t.deepEqual(sgf.compressed2vertices('aa'), [sgf.point2vertex('aa')])
        t.deepEqual(sgf.compressed2vertices('Az'), [sgf.point2vertex('Az')])
    
        t.end()
    })
    t.test('should handle one point compressions', t => {
        t.deepEqual(sgf.compressed2vertices('ce:ce'), [sgf.point2vertex('ce')])
        t.deepEqual(sgf.compressed2vertices('aa:aa'), [sgf.point2vertex('aa')])
        t.deepEqual(sgf.compressed2vertices('Az:Az'), [sgf.point2vertex('Az')])
    
        t.end()
    })
    t.test('should handle compressions', t => {
        t.deepEqual(sgf.compressed2vertices('aa:bb'), [[0, 0], [0, 1], [1, 0], [1, 1]])
        t.deepEqual(sgf.compressed2vertices('bb:aa'), [[0, 0], [0, 1], [1, 0], [1, 1]])
    
        t.end()
    })

    t.end()
})

t.test('escapeString', t => {
    t.test('should escape backslashes', t => {
        t.equal(sgf.escapeString('hello\\world'), 'hello\\\\world')
    
        t.end()
    })
    t.test('should escape right brackets', t => {
        t.equal(sgf.escapeString('hello]world'), 'hello\\]world')
    
        t.end()
    })
    t.test('should not escape left brackets', t => {
        t.equal(sgf.escapeString('hello[world'), 'hello[world')
    
        t.end()
    })

    t.end()
})

t.test('unescapeString', t => {
    t.test('should ignore escaped linebreaks', t => {
        t.equal(sgf.unescapeString('hello\\\nworld'), 'helloworld')
        t.equal(sgf.unescapeString('hello\\\rworld'), 'helloworld')
        t.equal(sgf.unescapeString('hello\\\n\rworld'), 'helloworld')
        t.equal(sgf.unescapeString('hello\\\r\nworld'), 'helloworld')
        
        t.end()
    })
    t.test('should unescape backslashes and right brackets', t => {
        t.equal(sgf.unescapeString('hello wor\\]ld'), 'hello wor]ld')
        t.equal(sgf.unescapeString('hello wor\\\\ld'), 'hello wor\\ld')
        t.equal(sgf.unescapeString('he\\]llo wor\\\\ld'), 'he]llo wor\\ld')
        
        t.end()
    })
    t.test('should ignore other backslashes', t => {
        t.equal(sgf.unescapeString('h\\e\\llo world'), 'hello world')
        t.equal(sgf.unescapeString('hello\\ world'), 'hello world')
        
        t.end()
    })
    t.test('should be left inverse to escapeString', t => {
        let texts = [
            'He()llo Wor\\\\[Foo;Bar]ld\\',
            'Hello\\! []World!'
        ]

        texts.forEach(text => {
            t.equal(sgf.unescapeString(sgf.escapeString(text)), text)
        })
        
        t.end()
    })
    
    t.end()
})
