# Kim Seng Hawker Centre website · 金成小贩中心网站

A free website for Kim Seng Hawker Centre, with three views:

| Page | Who | What they can do |
|---|---|---|
| `index.html` | Customers (no login) | See all stalls, open/closed status, menus with photos and prices, 3D floor plan with a pin, reviews per stall (Google sign-in to write) |
| `owner.html` | Stall owners | Open/close the stall (including sudden "closed today / closed until…"), weekly hours, stall info and photo, add/edit/delete food, mark food sold out, read reviews. Mixed-rice stalls also get a price guide and an "estimated dishes" list |
| `admin.html` | Hawker centre owner | Open/close the whole centre, add/delete stalls, create stall-owner logins, drag-and-drop 3D floor plan editor, print QR posters / table cards, manage admins |

Interface languages: English, 中文, Bahasa Melayu. Prices in RM, times in Malaysia time.

## Cost: RM 0

* **Hosting**: Firebase Hosting at `kimseng-hawker.web.app` (free; GitHub Pages also works).
* **Database and logins**: Firebase "Spark" plan (free, **no bank card needed**).
* **Photos** are shrunk in the browser (~50–90 KB) and stored in the database, so the
  paid "Cloud Storage" add-on is not needed.
* No server to run or maintain. All libraries are kept in `vendor/`, so the site does not depend on other CDNs (except Firebase's own SDK).

## Try it now (demo mode)

While `js/config.js` has `firebaseConfig = null`, the site runs in **demo mode**:
everything works, but data is saved only in your own browser.

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Demo logins:
* Stall owner: `drinks@demo.com` or `rice@demo.com`, password `demo123`
* Admin: open `admin.html`, click *Sign in with Google*, type any email, then *Yes, make me admin*

## Going live

Follow **[docs/SETUP.md](docs/SETUP.md)** (about 20 minutes, done once).
Then give the owner **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**.

## Files

```
index.html, owner.html, admin.html   the three pages
css/style.css                        all styling
js/config.js                         ← paste Firebase config here
js/api.js                            database + login (Firebase or demo)
js/status.js                         open/closed logic (Malaysia time)
js/floorplan.js                      3D floor plan viewer + editor (three.js)
js/customer.js, owner.js, admin.js   page logic
js/forms.js, i18n.js, util.js, seed.js
firestore.rules                      database security rules
vendor/                              three.js, OrbitControls, qrcode-generator (MIT)
```
