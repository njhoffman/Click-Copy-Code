import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal chrome.storage stub so snippets.js falls back to localStorage
const localStore = {};
globalThis.localStorage = {
  getItem(key) { return Object.prototype.hasOwnProperty.call(localStore, key) ? localStore[key] : null; },
  setItem(key, value) { localStore[key] = String(value); },
  removeItem(key) { delete localStore[key]; },
};

const {
  DEFAULT_SETTINGS,
  getDefaultSettings,
  loadSettings,
  saveSettings,
  overwriteSettings,
  hashCode,
  addSnippet,
  getSnippets,
  deleteSnippet,
  searchSnippets,
  detectLanguage,
} = await import('../snippets.js');

function clearStore() {
  Object.keys(localStore).forEach((k) => delete localStore[k]);
}

describe('DEFAULT_SETTINGS', () => {
  it('includes buttonLabel with default "Copy"', () => {
    assert.equal(DEFAULT_SETTINGS.buttonLabel, 'Copy');
  });

  it('includes buttonCss with empty default', () => {
    assert.equal(DEFAULT_SETTINGS.buttonCss, '');
  });

  it('includes ignoredSites as empty array', () => {
    assert.deepEqual(DEFAULT_SETTINGS.ignoredSites, []);
  });
});

describe('getDefaultSettings', () => {
  it('returns a deep copy of defaults', () => {
    const a = getDefaultSettings();
    const b = getDefaultSettings();
    assert.deepEqual(a, b);
    assert.notEqual(a, b);
    assert.notEqual(a.sanitize, b.sanitize);
  });

  it('has the new button and ignored sites fields', () => {
    const s = getDefaultSettings();
    assert.equal(s.buttonLabel, 'Copy');
    assert.equal(s.buttonCss, '');
    assert.deepEqual(s.ignoredSites, []);
  });
});

describe('loadSettings / saveSettings', () => {
  beforeEach(() => clearStore());

  it('returns defaults when nothing is stored', async () => {
    const settings = await loadSettings();
    assert.equal(settings.buttonLabel, 'Copy');
    assert.deepEqual(settings.ignoredSites, []);
  });

  it('persists and loads custom buttonLabel', async () => {
    await saveSettings({ buttonLabel: 'Snag' });
    const settings = await loadSettings();
    assert.equal(settings.buttonLabel, 'Snag');
  });

  it('persists and loads buttonCss', async () => {
    await saveSettings({ buttonCss: 'background: red;' });
    const settings = await loadSettings();
    assert.equal(settings.buttonCss, 'background: red;');
  });

  it('persists and loads ignoredSites', async () => {
    const patterns = ['github\\.com', 'example\\.org/docs'];
    await saveSettings({ ignoredSites: patterns });
    const settings = await loadSettings();
    assert.deepEqual(settings.ignoredSites, patterns);
  });
});

describe('overwriteSettings', () => {
  beforeEach(() => clearStore());

  it('replaces all settings and normalizes with defaults', async () => {
    await saveSettings({ buttonLabel: 'Old' });
    const result = await overwriteSettings({ buttonLabel: 'New' });
    assert.equal(result.buttonLabel, 'New');
    assert.equal(result.savingEnabled, true);
  });
});

describe('hashCode', () => {
  it('returns "0" for falsy input', () => {
    assert.equal(hashCode(''), '0');
    assert.equal(hashCode(null), '0');
  });

  it('returns consistent hash for same input', () => {
    assert.equal(hashCode('hello'), hashCode('hello'));
  });

  it('returns different hashes for different input', () => {
    assert.notEqual(hashCode('hello'), hashCode('world'));
  });
});

describe('addSnippet / getSnippets / deleteSnippet', () => {
  beforeEach(() => clearStore());

  it('adds and retrieves a snippet', async () => {
    await addSnippet({ id: '1', code: 'console.log(1)' });
    const snippets = await getSnippets();
    assert.equal(snippets.length, 1);
    assert.equal(snippets[0].code, 'console.log(1)');
  });

  it('deduplicates by hash', async () => {
    await addSnippet({ id: '1', code: 'test' });
    await addSnippet({ id: '2', code: 'test' });
    const snippets = await getSnippets();
    assert.equal(snippets.length, 1);
    assert.equal(snippets[0].id, '2');
  });

  it('deletes a snippet by id', async () => {
    await addSnippet({ id: '1', code: 'a' });
    await addSnippet({ id: '2', code: 'b' });
    await deleteSnippet('1');
    const snippets = await getSnippets();
    assert.equal(snippets.length, 1);
    assert.equal(snippets[0].id, '2');
  });
});

describe('searchSnippets', () => {
  beforeEach(async () => {
    clearStore();
    await addSnippet({ id: '1', code: 'const x = 1', language: 'javascript', pageTitle: 'JS Guide' });
    await addSnippet({ id: '2', code: 'def foo():', language: 'python', pageTitle: 'Py Docs' });
  });

  it('finds by code content', async () => {
    const results = await searchSnippets('const x');
    assert.equal(results.length, 1);
    assert.equal(results[0].language, 'javascript');
  });

  it('finds by language', async () => {
    const results = await searchSnippets('python');
    assert.equal(results.length, 1);
  });

  it('returns all with empty query', async () => {
    const results = await searchSnippets('');
    assert.equal(results.length, 2);
  });
});

describe('detectLanguage', () => {
  it('returns text for null element and empty code', () => {
    assert.equal(detectLanguage(null, ''), 'text');
  });

  it('detects python from code heuristics', () => {
    assert.equal(detectLanguage(null, 'def hello():'), 'python');
  });

  it('detects javascript from code heuristics', () => {
    assert.equal(detectLanguage(null, 'function foo() {}'), 'javascript');
  });
});
