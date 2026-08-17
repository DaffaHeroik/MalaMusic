# Visual regression checkpoint

Production URL tested: https://music.malawalipayment.web.id/?v=54-platform-hardening

The latest Home content, navigation, Listen Together launcher, and v54 asset query loaded. The visual viewport showed the `New Version v2` modal covering the Home cards with a narrow internal scroll area. This is a remaining UI regression candidate: the popup needs a responsive max-height, safe-area spacing, and a clear close/never-show-again state so it does not obscure Home on Android or desktop.

The main shell showed Home/Search/Leaderboard/Library/Liked/Offline/Profile navigation and the Listen Together launcher without an obvious horizontal overflow in the captured viewport. Auth remained logged out in this verification, so the Login button was expected.

## v55 follow-up

The v55 Home rendered successfully with the full navigation, Quick Picks, Popular Playlists, Top Artists, and Listen Together launcher. The New Version v2 modal still appears on a fresh browser profile because its local `seen_v2_popup_update` flag is absent; this is expected onboarding behavior, not a duplicate modal. Its card is now constrained by viewport height and internal scrolling. For a clean layout check, dismiss the modal once and reload.
