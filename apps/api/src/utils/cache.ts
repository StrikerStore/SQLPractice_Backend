type CacheRecord<T> = { value: T; expiresAt: number };

export class TtlCache<T> {
  private store = new Map<string, CacheRecord<T>>();

  constructor(private ttlSeconds: number) {}

  set(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlSeconds * 1000 });
  }

  get(key: string): T | undefined {
    const record = this.store.get(key);
    if (!record) return undefined;
    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return record.value;
  }
}
