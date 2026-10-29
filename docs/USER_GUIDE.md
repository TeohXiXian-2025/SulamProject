# User guide · 使用说明 — 金城茶餐室 Restoran Kim Seng

| Who · 谁 | Address · 网址 |
|---|---|
| Customers · 顾客 | `https://kimseng-hawker.web.app` (the QR code) |
| Staff · 员工 (stall owners + manager) | `https://kimseng-hawker.web.app/staff` |

**Tip:** open the staff address on each stall owner's phone once, then
*Add to Home Screen* (iPhone: Share → Add to Home Screen; Android: ⋮ → Add to Home screen).
They get an icon called **金城 Staff** and never need to type the address.
提示：在档主手机打开员工网址，然后「添加到主屏幕」，以后按图标就可以。

Customers never see a login button. 顾客页面没有登录按钮。

**Contents · 目录:** [Customers 顾客](#customers-顾客) · [Logging in 登录](#logging-in-登录) ·
[Stall owners 档主](#stall-owners-档主) · [Manager 管理员](#manager-管理员)

---

## Customers 顾客

Scan the QR code on the poster or table, or open `https://kimseng-hawker.web.app`.
扫描海报或桌上的二维码，或打开网址。不用下载 app，不用登录。

* **Language · 语言** — tap **中文 / English / BM** at the top.
* **We are OPEN / CLOSED** — the big green or red box shows if the kopitiam is open now. A yellow box shows notices (e.g. holidays).
  绿色 = 营业中，红色 = 休息；黄色是公告。
* **Stall list · 档口列表** — every stall with its number, picture and status (e.g. "Open · until 15:00" or "Closed · opens Fri 07:00").
  Tap **Open now only · 只看营业中** to hide closed stalls, or type in **Search** to find a stall.
* **Tap a stall · 点档口** to see:
  * its **menu** with pictures, descriptions and prices — finished food shows **SOLD OUT · 卖完了**;
  * for the **economy mixed rice** stall: a **price guide** (e.g. 1 meat + 2 veg) and "dishes usually cooked" — only an estimate, check at the stall;
  * **Where is it? · 在哪里** — opens the map with a red pin on the stall;
  * **Call stall** (if the stall gave a phone number) and **Opening hours · 营业时间**;
  * **Reviews · 评价** — tap **Write a review**, sign in with Google, choose the stars and write a few words. One review per person per stall; you can change or delete it.
* **Map · 地图** (bottom bar) — 3D floor plan. Green blocks are open, grey are closed. Tap a stall to see the pin and a **Menu** button.
  Drag with one finger to turn the view, pinch to zoom.
* The bottom bar **Stalls · 档口 / Map · 地图** is always there to go back.

---

## Logging in 登录

* **Gmail** → tap **Continue with Google · 用 Google 登录**. No password. 不需要密码。
* **Other email · 其他电邮** → the first time, open the email from Firebase and **set your own password**.
  Then type email + password and tap **Log in · 登录**.
  Forgot it? Type your email and tap **First time, or forgot password? · 第一次 / 忘记密码**.

---

## Stall owners 档主

The home screen shows your stall, whether it is open, and one big button:

| Big button · 大按钮 | When · 什么时候 |
|---|---|
| **Close today · 今天休息** | Sudden closing. Opens again tomorrow by itself. 明天自动恢复。 |
| **Open again · 恢复营业** | You closed today but changed your mind. |
| **Open today anyway · 今天照开** | Opening on a rest day. |

Below are 4 tiles · 下面有 4 个格子:

* **Open / close & hours · 开档休息时间** — Closed today, Holiday (choose last day), Normal, Open anyway.
  Set the hours for each day; tick **Rest · 休息** for days off.
* **Menu & prices · 菜单和价格** — **Add food · 添加食物** (take a photo with the phone).
  Each food has a big button: green **✓ Available · 有卖** → tap when finished → grey **✗ Sold out · 卖完了**.
  *Mixed rice stall · 经济饭档:* edit the **price guide** at the top, and add "dishes usually cooked" with their type (meat / vegetable / egg…). Customers are told it is only an estimate.
* **Stall info & photo · 档口资料和照片** — stall photo, name, description, phone.
* **Reviews · 评价** — read what customers wrote.

Every screen has a big **Back · 返回** button at the top left.

---

## Manager 管理员

Log in with **Google** (kimseng.hawker@gmail.com or the owner's own Gmail).

The top card shows if the kopitiam is open, how many stalls are open, and a big
**Close whole kopitiam today · 今天全店休息** button (e.g. public holiday). Then 6 tiles:

| Tile · 格子 | What it does · 做什么 |
|---|---|
| **Stalls & owners · 档口和档主** | **Add a stall**. **Edit**: number, name, type, mixed-rice tick box, **owner's email** (Gmail → Google login; other email → they get a set-password email). **Remove owner** stops their access at once. **Delete** is inside Edit and asks twice. **Menu** lets you update a stall for its owner. "Fill empty menus with sample dishes" is for demonstrations only. |
| **Floor plan · 平面图** | Drag blocks with your finger. Tap one → Turn / Wider / Narrower / Longer / Shorter / Remove. Add tables, entrance, toilet, wall, pillar, sink. Press **Save floor plan**. |
| **Name, hours & notice · 名称时间公告** | Shop name (金城茶餐室 / Restoran Kim Seng), yellow notice for customers, kopitiam open/close and opening hours. |
| **Print QR codes · 打印二维码** | Big poster, table cards (with table numbers) or stall cards (opens that stall's menu). Tap **Print**. |
| **Reviews · 评价** | All reviews, newest first. **Remove** rude or fake ones. |
| **Managers · 管理员** | Gmail accounts allowed to manage. The last one cannot be removed. |

Changing the shop name changes the website at once and posters printed **after** that.
Posters already printed keep working — the QR code only contains the website address.
改店名后网站立即更新；已经打印的海报照样能扫。
