import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal localStorage stub
const localStore = {};
globalThis.localStorage = {
  getItem(key) { return Object.prototype.hasOwnProperty.call(localStore, key) ? localStore[key] : null; },
  setItem(key, value) { localStore[key] = String(value); },
  removeItem(key) { delete localStore[key]; },
};

const { loadSettings, saveSettings, getDefaultSettings } = await import('../snippets.js');

function clearStore() {
  Object.keys(localStore).forEach((k) => delete localStore[k]);
}

describe('options page settings round-trip', () => {
  beforeEach(() => clearStore());

  it('saves and loads buttonLabel', async () => {
    await saveSettings({ buttonLabel: 'Grab' });
    const s = await loadSettings();
    assert.equal(s.buttonLabel, 'Grab');
  });

  it('saves and loads buttonCss', async () => {
    const css = 'font-size: 14px; border: 1px solid red;';
    await saveSettings({ buttonCss: css });
    const s = await loadSettings();
    assert.equal(s.buttonCss, css);
  });

  it('saves and loads ignoredSites as array', async () => {
    const sites = ['github\\.com', 'internal\\.corp'];
    await saveSettings({ ignoredSites: sites });
    const s = await loadSettings();
    assert.deepEqual(s.ignoredSites, sites);
  });

  it('preserves other settings when saving new fields', async () => {
    await saveSettings({ maxHistory: 500 });
    await saveSettings({ buttonLabel: 'Clip' });
    const s = await loadSettings();
    assert.equal(s.maxHistory, 500);
    assert.equal(s.buttonLabel, 'Clip');
  });

  it('defaults missing new fields after getDefaultSettings', () => {
    const d = getDefaultSettings();
    assert.equal(d.buttonLabel, 'Copy');
    assert.equal(d.buttonCss, '');
    assert.deepEqual(d.ignoredSites, []);
  });
});
