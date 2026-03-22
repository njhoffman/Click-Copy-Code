# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome browser extension (Manifest V3) that lets users copy code blocks from any website via click, hover, or keyboard shortcut (Alt+C). Includes a built-in snippet collector/manager with search, tagging, export, and deduplication.

## Development Setup

No build system or bundler. All files are vanilla JavaScript served directly to Chrome.

**To develop:**
1. Open `chrome://extensions` in Chrome
2. Enable Developer Mode
3. Click "Load unpacked" and select this directory
4. After changes, click the refresh icon on the extension card

**To run tests:**
```
npm test
```
Uses Node's built-in test runner (`node:test`) with no external dependencies. Test files are in `test/`.

## Architecture

**Communication flow:**
```
Content Script (script.js) --sendMessage--> Service Worker (background.js) ---> Storage (snippets.js)
Popup (popup.js) <--sendMessage--> Service Worker (background.js) <---> Storage
Options (options.js) <---> Chrome Storage API directly
```

**Entry points:**
- `manifest.json` - Extension configuration; content script injected on all URLs at document_end
- `background.js` - Service worker (ES module). Message routing, context menus (Copy Code, Copy All, Copy Combined), snippet CRUD operations
- `script.js` - Content script injected into every page. Contains `ClickCopyController` class handling copy interactions, language detection, code sanitization, toast notifications
- `popup.html/js` - Extension popup showing saved snippets with search/filter/export
- `options.html/js` - Settings page for interaction mode, theme, sanitization, integrations

**Shared modules:**
- `snippets.js` - Snippet storage/retrieval with dedup by hash, configurable history limit (default 200), export to JSON/Markdown
- `themeUtils.js` - Theme application (light/dark/custom); marked as web_accessible_resource in manifest

**Integrations (scaffolding only, not fully implemented):**
- `integrations/gist.js` - GitHub Gist integration

## Key Patterns

- Chrome extension storage API with localStorage fallback for compatibility
- Settings use a `deepMerge` utility (in `snippets.js`) to merge user settings with defaults
- Language detection: extracts from CSS class names (`language-*`, `hljs-*`) with heuristic regex fallback
- Code sanitization options: strip shell prompts, line numbers, comments, empty lines
- Clipboard writing uses Clipboard API with `document.execCommand('copy')` fallback
- Button label and CSS are customizable via options; applied in `ClickCopyController.addCopyButton()`
- Ignored sites: regex patterns matched against `window.location.href` during content script init; skips all functionality if matched
- Context menu "Copy All" collects all `<pre>`/`<code>` blocks on the page into separate fenced code blocks; "Copy Combined" merges blocks sharing the same detected language into a single fenced block per language
