exports.tokenize = function(contents) {
    let tokens = []
    let pos = 0
    let [row, col] = [0, 0]
    let rules = {
        newline: /^\n/,
        whitespace: /^[^\S\n]+/,
        parenthesis: /^(\(|\))/,
        semicolon: /^;/,
        prop_ident: /^[A-Za-z]+/,
        c_value_type: /^\[([^\\\]]|\\[^])*\]/
    }

    while (contents.length > 0) {
        let match = null

        for (let type in rules) {
            match = rules[type].exec(contents)
            if (match == null) continue

            let value = match[0]

            if (!['newline', 'whitespace'].includes(type)) {
                tokens.push({type, value, row, col, pos})
            }

            // Update source position

            if (type === 'newline') {
                row++
                col = 0
            } else {
                col += value.length
            }

            pos += value.length
            contents = contents.slice(value.length)

            break
        }

        if (match == null) throw new Error(`Unexpected SGF token at ${row + 1}:${col + 1}`)
    }

    return tokens
}
