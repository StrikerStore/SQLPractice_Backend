import { describe, expect, it } from 'vitest';
import { assertSelectOnly } from './sqlGuard';

describe('assertSelectOnly', () => {
  it('accepts a simple select statement', () => {
    expect(() => assertSelectOnly('SELECT * FROM retail.customers LIMIT 5;')).not.toThrow();
  });

  it('rejects destructive statements', () => {
    expect(() => assertSelectOnly('DELETE FROM retail.orders;')).toThrowError(/SELECT statements/);
  });
});
