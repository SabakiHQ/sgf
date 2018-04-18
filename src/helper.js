const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

exports.escapeString = function(input) {
    return input.toString()
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
}

exports.unescapeString = function(input) {
    let result = []
    let inBackslash = false

    input = input.replace(/\r/g, '')

    for (let i = 0; i < input.length; i++) {
        if (!inBackslash) {
            if (input[i] !== '\\')
                result.push(input[i])
            else if (input[i] === '\\')
                inBackslash = true
        } else {
            if (input[i] !== '\n')
                result.push(input[i])

            inBackslash = false
        }
    }

    return result.join('')
}

exports.string2dates = function(input) {
    if (!input.match(/^(\d{4}(-\d{1,2}(-\d{1,2})?)?(\s*,\s*(\d{4}|(\d{4}-)?\d{1,2}(-\d{1,2})?))*)?$/))
        return null
    if (input.trim() === '')
        return []

    let dates = input.split(',').map(x => x.trim().split('-'))

    for (let i = 1; i < dates.length; i++) {
        let date = dates[i]
        let prev = dates[i - 1]

        if (date[0].length !== 4) {
            // No year

            if (date.length === 1 && prev.length === 3) {
                // Add month
                date.unshift(prev[1])
            }

            // Add year
            date.unshift(prev[0])
        }
    }

    return dates.map(x => x.map(y => +y))
}

exports.dates2string = function(dates) {
    if (dates.length === 0) return ''

    let datesCopy = [dates[0].slice()]

    for (let i = 1; i < dates.length; i++) {
        let date = dates[i]
        let prev = dates[i - 1]
        let k = 0

        for (let j = 0; j < date.length; j++) {
            if (date[j] === prev[j] && k === j) k++
            else break
        }

        datesCopy.push(date.slice(k))
    }

    return datesCopy.map(x =>
        x.map(y => y > 9 ? '' + y : '0' + y).join('-')
    ).join(',')
}

exports.point2vertex = function(point) {
    if (point.length !== 2) return [-1, -1]
    return point.split('').map(x => alpha.indexOf(x))
}

exports.vertex2point = function([x, y]) {
    if (Math.min(x, y) < 0 || Math.max(x, y) >= alpha.length)
        return ''
    return alpha[x] + alpha[y]
}

exports.compressed2vertices = function(compressed) {
    let colon = compressed.indexOf(':')
    if (colon < 0) return [exports.point2vertex(compressed)]

    let v1 = exports.point2vertex(compressed.slice(0, colon))
    let v2 = exports.point2vertex(compressed.slice(colon + 1))
    let vertices = []

    for (let i = Math.min(v1[0], v2[0]); i <= Math.max(v1[0], v2[0]); i++) {
        for (let j = Math.min(v1[1], v2[1]); j <= Math.max(v1[1], v2[1]); j++) {
            vertices.push([i, j])
        }
    }

    return vertices
}
