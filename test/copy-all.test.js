import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Tests for the Copy All / Copy Combined formatting logic.
 * These functions mirror formatCopyAll and formatCopyCombined in script.js
 * (which live inside an IIFE and can't be imported directly).
 */

function formatCopyAll(snippets) {
  return snippets
    .map((s) => {
      const lang = s.language || '';
      let code = s.code || '';
      if (code && !code.endsWith('\n')) {
        code += '\n';
      }
      return `\`\`\`${lang}\n${code}\`\`\``;
    })
    .join('\n\n');
}

function formatCopyCombined(snippets) {
  const groups = new Map();
  snippets.forEach((s) => {
    const lang = s.language || '';
    if (!groups.has(lang)) {
      groups.set(lang, []);
    }
    groups.get(lang).push(s.code || '');
  });
  const blocks = [];
  groups.forEach((codes, lang) => {
    let merged = codes.join('\n');
    if (merged && !merged.endsWith('\n')) {
      merged += '\n';
    }
    blocks.push(`\`\`\`${lang}\n${merged}\`\`\``);
  });
  return blocks.join('\n\n');
}

describe('formatCopyAll', () => {
  it('formats a single snippet', () => {
    const result = formatCopyAll([{ code: 'echo hi', language: 'bash' }]);
    assert.equal(result, '```bash\necho hi\n```');
  });

  it('formats multiple snippets as separate fenced blocks', () => {
    const snippets = [
      { code: 'setopt noaliases\nsetopt noequals', language: 'bash' },
      { code: '# bash comment\nsetopt noautocd', language: 'bash' },
    ];
    const result = formatCopyAll(snippets);
    assert.equal(
      result,
      '```bash\nsetopt noaliases\nsetopt noequals\n```\n\n```bash\n# bash comment\nsetopt noautocd\n```',
    );
  });

  it('handles mixed languages', () => {
    const snippets = [
      { code: 'print("hi")', language: 'python' },
      { code: 'console.log("hi")', language: 'javascript' },
    ];
    const result = formatCopyAll(snippets);
    assert.ok(result.includes('```python\nprint("hi")\n```'));
    assert.ok(result.includes('```javascript\nconsole.log("hi")\n```'));
  });

  it('handles empty language', () => {
    const result = formatCopyAll([{ code: 'some code', language: '' }]);
    assert.equal(result, '```\nsome code\n```');
  });

  it('handles empty snippets array', () => {
    assert.equal(formatCopyAll([]), '');
  });

  it('preserves trailing newline if already present', () => {
    const result = formatCopyAll([{ code: 'line\n', language: 'text' }]);
    assert.equal(result, '```text\nline\n```');
  });
});

describe('formatCopyCombined', () => {
  it('merges same-language blocks into one', () => {
    const snippets = [
      { code: 'setopt noaliases\nsetopt noequals', language: 'bash' },
      { code: '# bash comment\nsetopt noautocd', language: 'bash' },
    ];
    const result = formatCopyCombined(snippets);
    assert.equal(
      result,
      '```bash\nsetopt noaliases\nsetopt noequals\n# bash comment\nsetopt noautocd\n```',
    );
  });

  it('keeps different languages as separate blocks', () => {
    const snippets = [
      { code: 'print("hi")', language: 'python' },
      { code: 'console.log("hi")', language: 'javascript' },
    ];
    const result = formatCopyCombined(snippets);
    assert.ok(result.includes('```python\nprint("hi")\n```'));
    assert.ok(result.includes('```javascript\nconsole.log("hi")\n```'));
    // Two separate blocks
    const blockCount = (result.match(/```\w*/g) || []).length;
    assert.equal(blockCount, 4); // 2 opening + 2 closing
  });

  it('merges same language but keeps different languages separate', () => {
    const snippets = [
      { code: 'echo a', language: 'bash' },
      { code: 'print("b")', language: 'python' },
      { code: 'echo c', language: 'bash' },
    ];
    const result = formatCopyCombined(snippets);
    // bash blocks should be merged
    assert.ok(result.includes('echo a\necho c'));
    // python block separate
    assert.ok(result.includes('```python\nprint("b")\n```'));
  });

  it('handles a single snippet', () => {
    const result = formatCopyCombined([{ code: 'x = 1', language: 'python' }]);
    assert.equal(result, '```python\nx = 1\n```');
  });

  it('handles empty snippets', () => {
    assert.equal(formatCopyCombined([]), '');
  });

  it('groups snippets with no language together', () => {
    const snippets = [
      { code: 'line 1', language: '' },
      { code: 'line 2', language: '' },
    ];
    const result = formatCopyCombined(snippets);
    assert.equal(result, '```\nline 1\nline 2\n```');
  });

  it('preserves order of first appearance for language groups', () => {
    const snippets = [
      { code: 'a', language: 'ruby' },
      { code: 'b', language: 'go' },
      { code: 'c', language: 'ruby' },
    ];
    const result = formatCopyCombined(snippets);
    const rubyIdx = result.indexOf('```ruby');
    const goIdx = result.indexOf('```go');
    assert.ok(rubyIdx < goIdx, 'ruby should appear before go (first-seen order)');
  });
});
