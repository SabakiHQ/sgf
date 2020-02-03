class Peekable {
  constructor(iterator) {
    this.iterator = iterator[Symbol.iterator]()
    this.peekedItem = null
    this.peeked = false
  }

  next() {
    let next = this.peeked ? this.peekedItem : this.iterator.next()

    this.peekedItem = null
    this.peeked = false

    return next
  }

  peek() {
    if (!this.peeked) {
      this.peekedItem = this.iterator.next()
      this.peeked = true
    }

    return this.peekedItem
  }
}

module.exports = Peekable
