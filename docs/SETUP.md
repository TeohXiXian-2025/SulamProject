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

## Step 3: Put the website online

### Recommended: Firebase Hosting (no GitHub needed)

The site lives in the same free Firebase project, at
**`https://kimseng-hawker.web.app`**. That address belongs to the Firebase project, so it
never changes when GitHub accounts change, and the printed QR codes keep working.

You need a computer with [Node.js](https://nodejs.org) (LTS) installed. Open a terminal
**in this project folder**, then run these one at a time:

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

(sign in with the **project Gmail**)

```bash
firebase deploy --only hosting,firestore:rules
```

That's it. The project name is already set in `.firebaserc`. Run the last command again
whenever the code changes. The `.web.app` address is already allowed for Google sign-in.

Keep a copy of this project folder (zip it into the project Gmail's Google Drive) so that
whoever maintains it later has the code, even without GitHub.

### Alternative: GitHub Pages

1. Repository *Settings → Pages → Deploy from a branch → `main` / `(root)` → Save*.
2. The site appears at `https://<github-username>.github.io/<repo-name>/`.
3. In Firebase: *Authentication → Settings → Authorized domains → Add domain* →
   `<github-username>.github.io`.

This depends on the GitHub account. If the repo is moved or renamed, the address changes.

> ⚠️ **Print QR codes only after the final address is decided.**

## Step 4: First-time setup on the website

1. Open `https://kimseng-hawker.web.app/staff` → **Continue with Google** using the project Gmail.
2. It says *"No manager exists yet"* → tap **Yes, make me the manager**.
   (Only the very first account can do this, so do it right away.)
3. **Stalls & owners** → **Add the 10 starter stalls**. Edit names, numbers and types as needed.
4. For a demonstration, tap **Fill empty menus with sample dishes** (drawn pictures, example
   prices and descriptions). Stall owners replace them with real food and photos later.
5. For each stall → **Edit → Stall owner**: type the owner's email → **Save**.
   * **Gmail**: the stall owner opens `…/staff` and taps **Continue with Google**. No password.
   * **Other email** (Yahoo, Hotmail…): Firebase emails them a link to **set their own
     password**. Tell them to check spam. **Send set-password email again** resends it.
   * To remove a stall owner: **Edit → Remove owner**. Their access stops immediately.
6. On each stall owner's phone: open `…/staff` and **Add to Home Screen** (icon "金城 Staff").
7. **Floor plan** → drag stalls, tables, entrance, toilet into the real layout → **Save floor plan**.
8. **Name, hours & notice** → check 金城茶餐室 / Restoran Kim Seng, set hours and a notice.
9. **Print QR codes** → print the **Big poster** and **Table cards**.
10. **Managers** → add the owner's own Gmail as a second manager.

## Step 5: Handover to the owner

The owner can run everything with **his own Gmail**:

- [ ] Website: **Managers** → add the owner's Gmail → he signs in at `…/staff` with Google.
- [ ] Firebase: console → ⚙️ *Project settings → Users and permissions → Add member* →
      owner's Gmail, role **Owner**. He can now manage the project with his own account.
- [ ] Project Gmail: password changed and given to the owner, recovery phone/email changed to the owner's.
- [ ] A zip of the project folder saved in the project Gmail's Google Drive.
- [ ] Owner has [USER_GUIDE.md](USER_GUIDE.md) (print it).
- [ ] Remove your own email from **Managers**.

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
* **Stall owner forgot password**: on `…/staff` they type their email and tap *First time, or forgot password?*.
* **Bad review / spam**: admin opens the stall's *Menu / Status* page → *Reviews* → *Delete*.
* **Changing the code later**: edit the files, then run `firebase deploy --only hosting` again.
* **Stall owner sees "not linked"**: check the email the admin typed matches exactly.
  An email-and-password login must verify its email first (there's a button on that screen).
