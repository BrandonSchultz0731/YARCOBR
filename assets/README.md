Drop photo files here with these exact names and the site will pick them up
automatically — no code changes needed:

- `daniel.jpg` — Daniel Schultz's headshot (used on About Us and Contact Us)
- `matt.jpg` — Matt Gelling's headshot (used on About Us and Contact Us)
- `chickee-bar.jpg` — photo used on the Community Pulse highlight card

Until a file exists, the site gracefully falls back to initials (or hides
the image) rather than showing a broken image icon — so it's safe to
deploy before these are ready, and they'll appear automatically once
uploaded.

Recommended: square-ish photos, reasonably compressed (a few hundred KB is
plenty — see the PDF compression note in the main README for why smaller
is better).
