export class TtlCache {
    ttlSeconds;
    store = new Map();
    constructor(ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }
    set(key, value) {
        this.store.set(key, { value, expiresAt: Date.now() + this.ttlSeconds * 1000 });
    }
    get(key) {
        const record = this.store.get(key);
        if (!record)
            return undefined;
        if (Date.now() > record.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return record.value;
    }
}
