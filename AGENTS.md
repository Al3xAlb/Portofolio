# Project rules

- Contact form messages are stored in the Lovable Cloud `contact_messages` table with insert-only access for visitors (no public reads) — keeps submissions private to the owner.
- Admin access comes from `user_roles` (`has_role`); a trigger makes the first account ever created the admin — so the owner claims it by signing in first, and later sign-ins get no access.
- Event files live in the private `event-files` bucket under `<event_id>/`; public-event files are readable via storage policy, private-event files are only served through the `unlock-event` function, which checks the access key server-side and returns short-lived signed URLs — keys never reach the browser except the one the visitor typed.
- Photo captions are written by the admin-only `generate-captions` function (Lovable AI Gateway, Responses API via `_shared/responses.ts`), a few photos per call with the browser looping until none remain — keeps each call well under function time limits; captions are stored on `event_files.caption` and used as alt text everywhere.
- The splash screen is a single overlay mounted once in `App.tsx` and gated by sessionStorage — so it plays once per visit, not on every route change.
