import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Tests for the ignored sites matching logic used in script.js.
 * The logic is extracted here since script.js is an IIFE that requires
 * a browser environment.
 */

function isUrlIgnored(url, patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return false;
  }
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern).test(url);
    } catch (e) {
      return false;
    }
  });
}

describe('ignored sites matching', () => {
  it('returns false when patterns array is empty', () => {
    assert.equal(isUrlIgnored('https://example.com', []), false);
  });

  it('returns false when patterns is not an array', () => {
    assert.equal(isUrlIgnored('https://example.com', null), false);
    assert.equal(isUrlIgnored('https://example.com', undefined), false);
  });

  it('matches a simple domain pattern', () => {
    assert.equal(isUrlIgnored('https://github.com/user/repo', ['github\\.com']), true);
  });

  it('does not match unrelated URLs', () => {
    assert.equal(isUrlIgnored('https://stackoverflow.com/q/123', ['github\\.com']), false);
  });

  it('matches with path patterns', () => {
    const patterns = ['example\\.com/docs'];
    assert.equal(isUrlIgnored('https://example.com/docs/api', patterns), true);
    assert.equal(isUrlIgnored('https://example.com/blog', patterns), false);
  });

  it('supports multiple patterns (any match)', () => {
    const patterns = ['github\\.com', 'gitlab\\.com'];
    assert.equal(isUrlIgnored('https://github.com/x', patterns), true);
    assert.equal(isUrlIgnored('https://gitlab.com/y', patterns), true);
    assert.equal(isUrlIgnored('https://bitbucket.org/z', patterns), false);
  });

  it('handles invalid regex gracefully', () => {
    assert.equal(isUrlIgnored('https://example.com', ['[invalid']), false);
  });

  it('matches complex regex patterns', () => {
    const patterns = ['^https://.*\\.internal\\.'];
    assert.equal(isUrlIgnored('https://wiki.internal.corp/page', patterns), true);
    assert.equal(isUrlIgnored('http://wiki.internal.corp/page', patterns), false);
  });

  it('treats unescaped dots as wildcards (regex behavior)', () => {
    assert.equal(isUrlIgnored('https://exampleXcom', ['example.com']), true);
  });
});
