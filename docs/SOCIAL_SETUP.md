# Social sources: setup

The scout already pulls **Bluesky, Mastodon, Lemmy and Hacker News** with no
keys. **Instagram, Facebook and YouTube are the priority platforms** and join
the live `/signals` feed as soon as their free official-API keys are set.
Reddit works the same way.

Add every key with `vercel env add` (it prompts for the value). **Never paste
tokens into chat, code or git.** After adding keys, redeploy: environment
changes only apply to new deployments.

---

## 1. YouTube: about 5 minutes, recommended first

Free quota: 10,000 units/day. The scout spends about 100 units per search and
caps itself at 2 searches per city.

1. Create a Google Cloud project: https://console.cloud.google.com/projectcreate
2. Enable **YouTube Data API v3**: https://console.cloud.google.com/apis/library/youtube.googleapis.com
3. Create an API key: https://console.cloud.google.com/apis/credentials, then
   **+ Create credentials → API key**.
4. Click the key, then **API restrictions → Restrict key → YouTube Data API v3** → Save.
5. Add it:
   ```bash
   vercel env add YOUTUBE_API_KEY production
   ```

What you get: the most-viewed videos from the last 30 days per market and
lens, with view and like counts.

---

## 2. Instagram: about 30 minutes (Meta Graph API)

You need an Instagram **Business or Creator** account linked to a **Facebook Page**.

1. **Make the Instagram account professional:** in the Instagram app go to
   Settings → *Account type and tools* → *Switch to professional account* →
   Business.
2. **Create a Facebook Page** if you don't have one: https://www.facebook.com/pages/create
   Then link Instagram: Page → Settings → *Linked accounts* → Instagram → Connect.
3. **Create a Meta developer account and app:** https://developers.facebook.com/apps/creation/
   Pick the use case *Other* → app type **Business**.
4. In the app dashboard, add the **Instagram** product (*API setup with
   Facebook login*).
5. **Get a token:** open the Graph API Explorer at https://developers.facebook.com/tools/explorer/
   - Choose your app, then **Generate Access Token** with these permissions:
     `instagram_basic`, `pages_show_list`, `pages_read_engagement`, `business_management`
   - Run `me/accounts?fields=instagram_business_account`. The
     `instagram_business_account.id` it returns is your **IG_USER_ID**.
6. **Make the token long-lived.** Pick one:
   - **Best (never expires):** a System User token. Business Settings →
     Users → System users: https://business.facebook.com/settings/system-users
     Add a system user, assign the app and Page, then *Generate new token* with the scopes above.
   - **Quick (60 days):** the Access Token Debugger at https://developers.facebook.com/tools/debug/accesstoken/
     Paste the token, then *Extend Access Token*.
7. Add both:
   ```bash
   vercel env add META_ACCESS_TOKEN production
   vercel env add IG_USER_ID production
   ```

What works when:
- **Right away:** Business Discovery, i.e. follower counts and the latest posts
  with likes and comments for each brand in `lib/data/socialWatchlist.ts`.
  Check those handles first; they were filled in from memory.
- **After Meta approves "Instagram Public Content Access":** hashtag search
  (`#dubaifood`, `#dutyfree`, …). Request it under App Review → *Permissions
  and Features*. It needs Business Verification:
  https://business.facebook.com/settings/security
  Meta allows 30 unique hashtags per 7 days. The scout uses about 16.

---

## 3. Facebook Pages: same Meta app

1. Use the same app and `META_ACCESS_TOKEN` as Instagram.
2. Request **Page Public Content Access**: App Dashboard → *App Review →
   Permissions and Features* → Page Public Content Access → *Request advanced
   access*. Use case: competitive analysis of public brand pages. It needs
   Business Verification (link above).
3. Until it's approved, only Pages you manage return posts. The scout skips
   the rest quietly.

Facebook has no free API for keyword search across all public posts. The
watchlist covers brand pages; add pages in `lib/data/socialWatchlist.ts`.

---

## 4. Reddit: about 3 minutes

Anonymous access is blocked now (403/429), so Reddit needs a free app.

1. Go to https://www.reddit.com/prefs/apps, then **create another app…** at the bottom.
2. Name: `bial-scout`. Type: **script**. Redirect URI: `http://localhost:8080` → *Create app*.
3. The **client id** is the string under the app name; the **secret** is labelled *secret*.
4. Add both:
   ```bash
   vercel env add REDDIT_CLIENT_ID production
   vercel env add REDDIT_CLIENT_SECRET production
   ```

Commercial use of Reddit data needs Reddit's approval under its Data API
terms: https://support.reddithelp.com/hc/en-us/articles/16160319875092

---

## 5. Go live

```bash
vercel deploy --prod --yes
```

Then open `/signals`. The header line lists every provider that ran, e.g.
`via tavily + instagram + facebook + youtube + bluesky + …`.

---

## Optional: unofficial local scrapers (ToS risk)

`instaloader` (Instagram), `twikit` (X) and `TikTok-Api` scrape without
official APIs. That breaks those platforms' terms of service and can get
accounts banned, so they are **not** wired into the live site. If you want
them for local research only, install them yourself in an isolated
environment and log in with a throwaway account. Never use your or BIAL's
main accounts.
