class Peekable {
    constructor(iterator) {
        this.iterator = iterator[Symbol.iterator]()
        this.peeked = null
    }

    next() {
        let next = this.peeked != null ? this.peeked : this.iterator.next()
        this.peeked = null

        return next
    }

    peek() {
        if (this.peeked == null) this.peeked = this.iterator.next()

        return this.peeked
    }
}

module.exports = Peekable
