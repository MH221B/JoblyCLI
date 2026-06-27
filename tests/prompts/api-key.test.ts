import { describe, it, expect } from 'vitest';
import { validateApiKey } from '../../src/prompts/api-key.js';

describe('validateApiKey', () => {
  it('accepts a valid key', () => {
    expect(validateApiKey('jobly_sk_QlymCAyMaZFkgkURvoNxPynOaGsgCfCz')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateApiKey('')).not.toBe(true);
  });

  it('rejects whitespace-only string', () => {
    expect(validateApiKey('   ')).not.toBe(true);
  });

  it('rejects key without jobly_sk_ prefix', () => {
    expect(validateApiKey('sk_testkey1234567890123456')).not.toBe(true);
  });

  it('rejects key that is too short', () => {
    expect(validateApiKey('jobly_sk_short')).not.toBe(true);
  });

  it('rejects placeholder text', () => {
    expect(validateApiKey('your-key-here')).not.toBe(true);
  });

  it('rejects "xxx" placeholder', () => {
    expect(validateApiKey('xxx')).not.toBe(true);
  });

  it('trims whitespace before validating', () => {
    expect(validateApiKey('  jobly_sk_QlymCAyMaZFkgkURvoNxPynOaGsgCfCz  ')).toBe(true);
  });
});
