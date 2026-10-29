# Setup guide (one time, about 20 minutes)

Everything here is free. **No bank card is needed at any step.** If any screen
asks you to "upgrade to Blaze" or add a card, you clicked a paid feature
(Storage / Functions). Go back, because this website does not need them.

---

## Step 1: Create a dedicated Gmail account

Create a new Gmail account just for this project, e.g. `kimseng.hawker@gmail.com`.
Everything below (Firebase, GitHub, admin login) belongs to this account, so at
handover you only pass over **one** account.

* Use your phone number for recovery for now. Change it to the owner's at handover.
* Write the password down and keep it safe.

## Step 2: Create the Firebase project (database + logins)

Signed in with the new Gmail, go to <https://console.firebase.google.com>.

1. **Create a project** → name `kimseng-hawker` → turn **off** Google Analytics → *Create*.
   (The project starts on the free **Spark** plan.)
2. **Firestore database**: left menu *Build → Firestore Database → Create database*.
   * Location: **asia-southeast1 (Singapore)**, the closest to Malaysia.
   * Start in **production mode**.
   * Open the **Rules** tab, delete everything, paste the whole content of
     [`firestore.rules`](../firestore.rules), click **Publish**.
3. **Logins**: *Build → Authentication → Get started*.
   * *Sign-in method* → enable **Email/Password** (stall owners use this).
   * *Sign-in method* → enable **Google** (customers use this to write reviews; the admin
     uses it too). Choose the project Gmail as the support email.
4. **Web app config**: ⚙️ *Project settings → General → Your apps → `</>` (Web)*.
   * Nickname `website`, do **not** tick Firebase Hosting, click *Register app*.
   * Copy the `firebaseConfig = { ... }` object it shows.
5. Open [`js/config.js`](../js/config.js) and replace `export const firebaseConfig = null;`
   with the copied object, e.g.

   ```js
   export const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "kimseng-hawker.firebaseapp.com",
     projectId: "kimseng-hawker",
     storageBucket: "kimseng-hawker.appspot.com",
     messagingSenderId: "...",
     appId: "...",
   };
   ```

   This config is **not a secret**. It is meant to be public. The security comes from the
   rules you published in step 2.

## Step 3: Put the website online (pick one)

### Option A: GitHub Pages (easiest, no software to install)

1. Create a GitHub account with the project Gmail, and put this repository there
   (*Settings → Transfer ownership* from your own account, or upload a copy).
2. Repository *Settings → Pages → Build and deployment → Deploy from a branch →
   `main` / `/ (root)` → Save*.
3. After a minute the site is at `https://<github-username>.github.io/<repo-name>/`.
4. In Firebase: *Authentication → Settings → Authorized domains → Add domain* →
   `<github-username>.github.io`. (Without this, Google sign-in shows an error.)

### Option B: Firebase Hosting (address like `kimseng-hawker.web.app`)

Needs Node.js on a computer once:

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

```bash
firebase deploy --only hosting,firestore:rules --project kimseng-hawker
```

The `.web.app` address is authorised for Google sign-in automatically.

> ⚠️ **Print QR codes only after the final address is decided.** If the address changes
> later (e.g. the GitHub repo is renamed or moved), printed QR codes stop working.

## Step 4: First-time setup on the website

1. Open `https://<your-site>/admin.html` → **Sign in with Google** using the project Gmail.
2. It says *"No admin exists yet"* → click **Yes, make me admin**.
   (Only the very first account can do this, so do it right away.)
3. **Stalls** tab → **Add the 10 starter stalls** (Beverage, Mixed Rice, Masakan Panas, …).
   Edit names, numbers and categories as needed.
4. For each stall → **Edit → Owner login**: type the stall owner's email and a starting
   password → **Save**. Give them the email, password and the link `…/owner.html`.
   *Tip:* the owner can use any email they can read, so that "Forgot password?" works.
5. **Floor Plan** tab → drag stalls, tables, entrance, toilet into the real layout →
   **Save layout**.
6. **Hawker centre** tab → set opening hours, address, announcement.
7. **QR codes** tab → check the website address → print the **Poster** and **Table cards**.
8. **Admins** tab → add the hawker centre owner's own Gmail as a second admin.

## Step 5: Handover to the hawker centre owner

- [ ] Owner's Gmail added under **Admins**.
- [ ] Project Gmail: password changed and given to the owner, recovery phone/email changed to the owner's.
- [ ] GitHub repo is under the project account (or owner's account).
- [ ] Owner has [USER_GUIDE.md](USER_GUIDE.md) (print it).
- [ ] Remove your own email from **Admins**.

## Free limits (Firebase Spark plan)

| Resource | Free limit | Rough meaning |
|---|---|---|
| Database reads | 50,000 / day | ~1,500 customer visits a day |
| Database writes | 20,000 / day | far more than owners need |
| Stored data | 1 GB | ~10,000 food photos |
| Data download | 10 GB / month | photos are kept small so this lasts |
| Logins | unlimited (email + Google) | |

If a limit is ever reached, the site simply pauses until the next day. **It never
charges money**, because the Spark plan has no card attached.

## Good to know

* **Deleting a stall** removes its menu and reviews, but not the owner's login. To delete
  a login: Firebase console → *Authentication → Users*.
* **Owner forgot password**: on `owner.html` they type their email and tap *Forgot password?*.
* **Bad review / spam**: admin opens the stall's *Menu / Status* page → *Reviews* → *Delete*.
* **Changing the code later**: edit the files on GitHub. GitHub Pages republishes automatically.
