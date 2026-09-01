# Route 12 Auto Sales — website

A two-page site:

- `index.html` — the public landing page. Loads live inventory from the database.
- `admin.html` — the staff-only page for adding and removing cars. Password protected.

No build tools, no server to run — it's plain HTML/CSS/JS that talks directly to
[Supabase](https://supabase.com) (free tier) for the database, photo storage, and login.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account, then a new project.
2. Once it's ready, open **SQL Editor** in the left sidebar, click **New query**, paste in
   the contents of `supabase/schema.sql`, and click **Run**. This creates the `listings`
   table and the security rules (public can view cars; only logged-in staff can add/remove).
3. Open **Storage** in the sidebar, click **New bucket**, name it exactly `car-photos`,
   and toggle it **Public**. (The upload/delete permissions for this bucket were already
   set up by the SQL script in step 2.)

## 2. Create a staff login

1. In the Supabase dashboard, go to **Authentication > Users**.
2. Click **Add user** and create one login for the dealership (e.g. the owner's email
   and a password). This is what staff will use to sign in at `admin.html`.
3. You can add more staff logins the same way later.

## 3. Connect the site to your project

1. In Supabase, go to **Project Settings > API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `js/config.js` and paste them in:

   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```

That's it — the anon key is safe to include in the site's code; it only allows what the
database rules in `schema.sql` permit (public read, staff-only write).

## 4. Try it locally

Since it's a static site, any local server works. Easiest option if you have Python:

```
cd route12-auto-site
python3 -m http.server 8000
```

Then open `http://localhost:8000` for the public page and `http://localhost:8000/admin.html`
to log in and add a test car.

## 5. Put it online

Any static hosting works. Two easy free options:

- **Netlify**: go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the
  whole `route12-auto-site` folder onto the page. It gives you a live URL immediately.
- **GitHub Pages**: push this folder to a GitHub repo, then in the repo's Settings > Pages,
  enable Pages for the main branch.

Either way, once it's live, share the `/admin.html` link privately with staff — it's
linked from the public site's footer too ("Staff login"), but only people with a login
can actually do anything there.

## Updating the dealership name, address, and phone number

These appear in a few places — search-and-replace across files:

- "Route 12 Auto Sales" — in `index.html` and `admin.html` (nav + hero)
- "(555) 019-2834" — in `index.html`
- "4210 Route 12 North" / "Millbrook, NY 12545" — in `index.html` footer
- "hello@route12auto.example" — in `index.html` footer

## How staff add or remove a car

1. Go to `admin.html` and log in.
2. **Add a car**: tap the photo box to choose photos (or drag them in), fill in the
   year, make, model, price, mileage, and a couple of other details, then tap
   **Add to the lot**. It appears on the public site immediately.
3. **Remove a car**: find it in the list on the right and tap **Remove**. It'll ask
   "Confirm remove?" — tap it again within 3 seconds and it's gone from the site.
   This two-tap pattern is there just to prevent an accidental tap from deleting
   the wrong car; there's no extra screen or dialog to navigate.
