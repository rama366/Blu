# Blues Company Portal — Phase 2 Setup (Supabase)

This wires the existing pages (`login.html`, `dashboard.html`, `admin.html`) to
Supabase Auth, a quotes/shipments/documents database, and private file storage.
The truck exchange uses the same Supabase project and requires a separate migration.

## 1. Create the project
1. Go to https://supabase.com → **New project** (free tier is fine).
2. Choose a database password and region, then wait for provisioning.

## 2. Create the database
1. Open **SQL Editor** → paste the full contents of `schema.sql` → **Run**.
2. This creates: `profiles`, `quotes`, `shipments`, `shipment_events`,
   `documents`, `settings`, all RLS policies, the `documents` storage bucket
   and its policies, plus the signup trigger that creates a profile row.

## 3. Connect the website
1. **Project Settings → API**: copy the **Project URL** and the public client key.
2. Paste them into `supabase-config.js`:
   ```js
   window.BLUES_CONFIG = {
     SUPABASE_URL: "https://abcdefgh.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi..."
   };
   ```
   Use the project root URL, such as `https://abcdefgh.supabase.co`; do not add
   `/rest/v1/` because the client constructs Auth and REST endpoints itself.
3. Upload/deploy `supabase-config.js`, `portal.js`, `portal.css`, `login.html`,
   `dashboard.html`, and `admin.html` beside the homepage. Supabase JS v2 is
   loaded from the CDN.

## 4. Enable the truck exchange
If the base schema is already installed, do not rerun `schema.sql`; run only
`marketplace-schema.sql`. That migration also restricts profile updates so
members cannot change their own admin flag.

1. For a fresh project, run `marketplace-schema.sql` after `schema.sql` in the
   same SQL Editor.
2. Deploy `marketplace.html`, `marketplace.css`, and `marketplace.js` with the
   homepage and `supabase-config.js`.
3. Signed-in customers and drivers can post an available truck or a cargo job,
   find exact-route/date suggestions, and send private inquiries. Listing access
   and inquiry visibility are enforced by row-level security.
4. The exchange does not verify driver licences, vehicle insurance, cargo, or
   payments. Confirm those details independently before accepting a job.

## 5. Make yourself admin
1. Sign up once on `login.html` (this creates your `profiles` row).
2. **Authentication → Users**: copy your user UUID.
3. SQL Editor:
   ```sql
   update public.profiles set is_admin = true where id = 'YOUR-USER-UUID';
   ```
4. Sign out / sign in — you now land on `admin.html` with the quote inbox.

## 6. What works after this
| Feature | Where |
|---|---|
| Sign up / sign in / sign out, customer vs admin routing | `login.html` |
| Profile view & edit | dashboard → Settings |
| Password change | admin → Settings |
| Quotes list with live status pills | dashboard → My quotes |
| Shipment milestone steppers | dashboard → Overview / Shipments |
| Document list, download (signed URLs), upload | dashboard → Documents |
| Quote inbox: filter chips, status dropdowns save to DB, live badges | admin → Inbox |
| Customers table (with quote counts + last activity) | admin → Customers |
| Business settings (phone/email/address/response time) persisted | admin → Settings |
| Available-truck and cargo listings, route suggestions, private inquiries | `marketplace.html` |

## 7. Optional: website quote form → database
Your homepage form currently posts to Web3Forms. To make web enquiries appear
in the admin inbox directly, point it at a small Supabase Edge Function or
keep Web3Forms and paste enquiries into the inbox manually. Snippet for an
Edge Function is included at the bottom of `schema.sql` notes in this repo's
wiki — ask if you want it generated.

## 8. Security notes
- RLS is enforced on every table; the anon key alone cannot read other
  customers' data.
- Storage is private: downloads use 120-second signed URLs.
- Never put the `service_role` key in any website file.
