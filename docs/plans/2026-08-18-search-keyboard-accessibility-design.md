# Search Keyboard Accessibility Design

## Context

The multi-persona product loop found that keyboard focus moves from the search field and submit button directly to the sidebar, skipping the search filters and song results. The current search renderer uses clickable `div` elements and non-interactive visual controls, which makes the core search-to-play journey unavailable to keyboard-only users.

## Options considered

### Option A — Add positive tabindex values to existing `div` elements

This is the smallest markup change, but it creates a fragile custom focus order, does not provide native keyboard activation, and can cause focus ordering problems when results change. It is rejected.

### Option B — Convert filters and result rows to native buttons, with explicit accessible names

This preserves the current visual layout while giving the browser native tab order and Enter/Space activation. The row remains a single actionable control, and the separate options menu remains a distinct button. This is the recommended option because it fixes the user-visible accessibility gap with minimal behavior change and no new dependency.

### Option C — Add a custom keyboard event layer to existing `div` elements

This could support Enter/Space, but would still require `tabindex`, focus styling, role semantics, and careful event propagation around the track menu. It is more complex than native controls and is rejected under YAGNI.

## Recommended design

Use native `button` elements for the three filter tabs and for each song result row. Add `aria-pressed` to filters and `aria-label` to each row using escaped title and artist text. Keep the existing `PK('search', i)` behavior by attaching the same click handler to the button. Ensure the track-options button stops propagation as it already does, and preserve the existing CSS classes so the desktop/mobile visual result stays consistent. Add a visible `focus-visible` ring to the result row and filter controls.

## Error handling and compatibility

The change must not alter search API requests, result ordering, or authentication. Dynamic title/artist strings must continue using the existing escaping helpers. The update must pass `node --check` and `git diff --check`. After implementation, retest with keyboard Tab/Enter and mouse click on both filters and a result row, then run the existing project review scan.

## Success criteria

A keyboard user can tab from the search input to Cari, through Musik/Playlist/Artis, into each song result, and activate a song with Enter or Space. The options button remains separately reachable and does not trigger playback when activated. Mouse and touch behavior remain unchanged.
