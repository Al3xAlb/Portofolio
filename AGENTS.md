# Project rules

- Contact form messages are stored in the Lovable Cloud `contact_messages` table with insert-only access for visitors (no public reads) — keeps submissions private to the owner.
- The splash screen is a single overlay mounted once in `App.tsx` and gated by sessionStorage — so it plays once per visit, not on every route change.
