# 金城茶餐室 Restoran Kim Seng — website

A free website for 金城茶餐室 Restoran Kim Seng, in a warm kopitiam style with big text for older users.

## Website

| Who | Link |
|---|---|
| **Customers** 顾客 (the QR code) | **https://kimseng-hawker.web.app** |
| **Stall owners and manager** 档主 / 管理员 | **https://kimseng-hawker.web.app/staff** |

## How to use

Step-by-step guide in English and 中文, for each view: **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**

* [Customers 顾客](docs/USER_GUIDE.md#customers-顾客) — find stalls, menus, prices, open / closed, map, reviews
* [Logging in 登录](docs/USER_GUIDE.md#logging-in-登录) — Gmail or email + own password
* [Stall owners 档主](docs/USER_GUIDE.md#stall-owners-档主) — close today, holiday, hours, menu, sold out, photos
* [Manager 管理员](docs/USER_GUIDE.md#manager-管理员) — stalls & owners, floor plan, shop name & hours, QR printing, reviews, managers

Setting up or handing over the project: [docs/SETUP.md](docs/SETUP.md).

## Pages

| Page | Who | What they can do |
|---|---|---|
| `index.html` | Customers (no login) | See all stalls, open/closed status, menus with photos and prices, 3D floor plan with a pin, reviews per stall (Google sign-in to write) |
| `staff.html` (`/staff`) | Stall owners | One-tap "Close today", holiday / hours, menu with photos and a big Available / Sold out button, stall info, reviews. Mixed-rice stalls get a price guide and "dishes usually cooked" |
| `staff.html` (`/staff`) | Manager | Close the whole kopitiam, stalls & owners, drag-and-drop 3D floor plan, shop name / hours / notice, QR posters and table cards, reviews, managers |

The customer pages have no login button; staff use their own address. `owner.html` and
`admin.html` still work and simply open the staff page.

Interface languages: English, 中文, Bahasa Melayu. Prices in RM, times in Malaysia time.

## Cost: RM 0

* **Hosting**: Firebase Hosting at `kimseng-hawker.web.app` (free; GitHub Pages also works).
* **Database and logins**: Firebase "Spark" plan (free, **no bank card needed**).
* **Photos** are shrunk in the browser (~50–90 KB) and stored in the database, so the
  paid "Cloud Storage" add-on is not needed.
* No server to run or maintain. All libraries are kept in `vendor/`, so the site does not depend on other CDNs (except Firebase's own SDK).

## Try it now (demo mode)

For a local preview, use **demo mode**. It keeps data in your browser and does not contact the live Firebase project.

```bash
node serve.cjs
```

Then open [customer preview](http://127.0.0.1:8000/?demo=1) or [staff preview](http://127.0.0.1:8000/staff.html?demo=1). Demo logins:
* Stall owner / Manager: enter any email and password in demo mode to sign in or register instantly.
* Manager: tap *Continue with Google*, type any Gmail, then *Yes, make me the manager*.

## Going live

Follow **[docs/SETUP.md](docs/SETUP.md)** (about 20 minutes, done once).
Then give the owner **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**.

## Files

```
index.html, staff.html               customer site, staff site
owner.html, admin.html               old links, forward to staff.html
css/style.css                        all styling
js/config.js                         ← paste Firebase config here
js/api.js                            database + login (Firebase or demo)
js/status.js                         open/closed logic (Malaysia time)
js/floorplan.js                      3D floor plan viewer + editor (three.js)
js/customer.js, staff.js             page logic
js/art.js                            drawn food pictures used until real photos are added
js/forms.js, i18n.js, util.js, seed.js
firestore.rules                      database security rules
vendor/                              three.js, OrbitControls, qrcode-generator (MIT)
```
