# Blues Company Portal — Phase 2 Setup (Supabase)

This wires the existing pages (`login.html`, `dashboard.html`, `admin.html`) to
real auth, a quotes/shipments/documents database, and file storage.
`portal.js` still falls back to demo data until the config is filled in.

## 1. Create the project
1. Go to https://supabase.com → **New project** (free tier is fine).
2. Choose a database password and region, then wait for provisioning.

## 2. Create the database
1. Open **SQL Editor** → paste the full contents of `schema.sql` → **Run**.
2. This creates: `profiles`, `quotes`, `shipments`, `shipment_events`,
   `documents`, `settings`, all RLS policies, the `documents` storage bucket
   and its policies, plus the signup trigger that creates a profile row.

## 3. Connect the website
1. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
2. Paste them into `supabase-config.js`:
   ```js
   window.BLUES_CONFIG = {
     SUPABASE_URL: "https://abcdefgh.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi..."
   };
   ```
3. Upload/deploy these files next to your existing pages:
   - `supabase-config.js`, `portal.js`
   - updated `login.html`, `dashboard.html`, `admin.html`
   - `@supabase/supabase-js@2` is loaded from the CDN (already added to the pages)

## 4. Make yourself admin
1. Sign up once on `login.html` (this creates your `profiles` row).
2. **Authentication → Users**: copy your user UUID.
3. SQL Editor:
   ```sql
   update public.profiles set is_admin = true where id = 'YOUR-USER-UUID';
   ```
4. Sign out / sign in — you now land on `admin.html` with the quote inbox.

## 5. What works after this
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

## 6. Optional: website quote form → database
Your homepage form currently posts to Web3Forms. To make web enquiries appear
in the admin inbox directly, point it at a small Supabase Edge Function or
keep Web3Forms and paste enquiries into the inbox manually. Snippet for an
Edge Function is included at the bottom of `schema.sql` notes in this repo's
wiki — ask if you want it generated.

## 7. Security notes
- RLS is enforced on every table; the anon key alone cannot read other
  customers' data.
- Storage is private: downloads use 120-second signed URLs.
- Never put the `service_role` key in any website file.
