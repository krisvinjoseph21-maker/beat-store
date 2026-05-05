/**
 * O(1) LRU (Least Recently Used) cache.
 *
 * Implementation: doubly-linked list + HashMap.
 * - get: move accessed node to front → O(1)
 * - set: insert at front, evict tail when over capacity → O(1)
 */

class Node<K, V> {
  key: K
  value: V
  prev: Node<K, V> | null = null
  next: Node<K, V> | null = null

  constructor(key: K, value: V) {
    this.key = key
    this.value = value
  }
}

export class LRUCache<K, V> {
  private readonly capacity: number
  private readonly map: Map<K, Node<K, V>>
  // Sentinel nodes avoid null-checks on every pointer manipulation
  private readonly head: Node<K, V>
  private readonly tail: Node<K, V>

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`LRUCache capacity must be a positive integer, got ${capacity}`)
    }
    this.capacity = capacity
    this.map = new Map()
    this.head = new Node<K, V>(null as unknown as K, null as unknown as V)
    this.tail = new Node<K, V>(null as unknown as K, null as unknown as V)
    this.head.next = this.tail
    this.tail.prev = this.head
  }

  /** Returns the cached value, or undefined if not present. Promotes node to MRU position. */
  get(key: K): V | undefined {
    const node = this.map.get(key)
    if (!node) return undefined
    this.moveToFront(node)
    return node.value
  }

  /** Inserts or updates a key-value pair. Evicts the LRU entry when over capacity. */
  set(key: K, value: V): void {
    const existing = this.map.get(key)
    if (existing) {
      existing.value = value
      this.moveToFront(existing)
      return
    }
    const node = new Node(key, value)
    this.map.set(key, node)
    this.insertAfterHead(node)
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev!
      this.detach(lru)
      this.map.delete(lru.key)
    }
  }

  has(key: K): boolean {
    return this.map.has(key)
  }

  get size(): number {
    return this.map.size
  }

  /** Remove a key explicitly without counting it as an eviction. */
  delete(key: K): boolean {
    const node = this.map.get(key)
    if (!node) return false
    this.detach(node)
    this.map.delete(key)
    return true
  }

  /** Remove all entries. */
  clear(): void {
    this.map.clear()
    this.head.next = this.tail
    this.tail.prev = this.head
  }

  private insertAfterHead(node: Node<K, V>): void {
    node.prev = this.head
    node.next = this.head.next!
    this.head.next!.prev = node
    this.head.next = node
  }

  private detach(node: Node<K, V>): void {
    node.prev!.next = node.next
    node.next!.prev = node.prev
  }

  private moveToFront(node: Node<K, V>): void {
    this.detach(node)
    this.insertAfterHead(node)
  }
}
