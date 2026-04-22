# Mobile app store launch — step-by-step walkthrough

This guide is for **Heart & Hustle** (`apps/mobile`), built with **Expo** and shipped with **EAS (Expo Application Services)**. Your app identifiers:

| Item | Value |
|------|--------|
| App display name | Heart & Hustle |
| Expo slug | `heart-and-hustle` |
| iOS bundle ID | `com.heartandhustle.app` |
| Android package | `com.heartandhustle.app` |

**You already have:** Apple Developer Program (paid).

**This is not legal advice.** Illinois professional fundraiser registration and insurance timing are separate from store approval—see [`illinois-compliance.md`](./illinois-compliance.md) and your counsel.

---

## How to use this document

1. Follow steps **in order** unless a step says it can run in parallel.
2. Check off substeps as you complete them.
3. When a step says “tell the assistant,” paste any error messages into your chat for help.

---

## Phase A — Accounts and tools (do these first)

### Step 1 — Expo account and EAS CLI on your Mac

**Goal:** You can log into Expo from the terminal and run EAS commands for this project.

**Substeps:**

1. Open a browser and go to **[https://expo.dev](https://expo.dev)**.
2. Click **Sign up** (or **Log in** if you already have an account). Use an email you will keep long-term for the business.
3. Verify your email if Expo asks you to.
4. On your Mac, open **Terminal** (Spotlight: type `Terminal`, press Enter).
5. Check that **Node.js** is installed:
   ```bash
   node -v
   ```
   - If you see a version like `v20.x` or `v22.x`, you’re fine.
   - If you get “command not found,” install Node from **[https://nodejs.org](https://nodejs.org)** (LTS), then open a **new** Terminal window and run `node -v` again.
6. Go to your project’s mobile app folder (adjust the path if yours differs):
   ```bash
   cd /Users/lawnhub-platform/HeartHustleFund/apps/mobile
   ```
7. Install dependencies (only needed the first time or after updates):
   ```bash
   npm install
   ```
8. Install the EAS command-line tool **globally** (one-time per Mac):
   ```bash
   npm install -g eas-cli
   ```
9. Log in to Expo from the terminal:
   ```bash
   eas login
   ```
   Use the same Expo account you created in the browser. If the browser opens for device login, complete that flow.
10. Confirm login:
    ```bash
    eas whoami
    ```
    You should see your Expo username or email.

**Done when:** `eas whoami` prints your account.

**Next:** Step 2.

---

### Step 2 — Connect this app folder to your Expo project (EAS project)

**Goal:** EAS knows which cloud project owns builds for Heart & Hustle.

**Substeps:**

1. Still in `apps/mobile`, run:
   ```bash
   eas whoami
   ```
   Confirm you’re logged in (Step 1).
2. Run:
   ```bash
   eas build:configure
   ```
   - If it asks questions, choose to use the existing **`eas.json`** when offered.
   - It may create or link an Expo project and can add an `extra.eas.projectId` (or similar) to your app config—**allow that** so builds are tied to your account.
3. If Expo opens a browser to create/link a project, complete the prompts. Name can match **Heart & Hustle** or your org name.
4. After it finishes, check that **`app.json`** (or **`app.config.js`**) was updated if the CLI said it wrote a project ID—commit that change to git when you’re ready.

**Done when:** `eas build:configure` completes without errors and you have a project on expo.dev under **Projects** that matches this app.

**Next:** Step 3.

---

### Step 3 — Google Play Console account (one-time $25 fee)

**Goal:** You have a **Google Play developer account** so you can publish Android builds. Start early; verification can take time.

**Substeps:**

1. Go to **[https://play.google.com/console/signup](https://play.google.com/console/signup)**.
2. Sign in with a **Google account** you will keep for the business (not a personal account you might lose).
3. Pay the **one-time registration fee** (currently $25 in many regions).
4. Complete **identity / developer profile** questions Google asks (name, contact, etc.).
5. Wait for any **verification** email from Google; follow instructions until the console opens and shows **All apps** (or empty dashboard).

**Done when:** You can open Play Console and see the dashboard (even with zero apps).

**Next:** Step 4 (can overlap in time with Step 3).

---

### Step 4 — Apple App Store Connect: access and legal entity

**Goal:** You can open **App Store Connect** and you’re ready to enter agreements and banking later.

**Substeps:**

1. Go to **[https://appstoreconnect.apple.com](https://appstoreconnect.apple.com)**.
2. Sign in with the **same Apple ID** you used for the Apple Developer Program.
3. If prompted, accept **Apple Developer / App Store Connect** terms.
4. Confirm you see **Apps**, **Users and Access**, etc. (If you only see “Agreements, Tax, and Banking” with warnings, that’s OK—we fix banking in a later step.)

**Done when:** You can log into App Store Connect without errors.

**Next:** Step 5.

---

## Phase B — Apple: certificates and first iOS build (TestFlight path)

### Step 5 — Register the iOS bundle ID in Apple Developer (if not already)

**Goal:** Apple knows about `com.heartandhustle.app`.

**Substeps:**

1. Go to **[https://developer.apple.com/account](https://developer.apple.com/account)** → **Certificates, Identifiers & Profiles**.
2. Open **Identifiers** → **App IDs** (or **Identifiers** → plus to register).
3. Look for **`com.heartandhustle.app`**.
   - If it **exists**, skip to Step 6.
   - If it **does not exist**, click **+**, choose **App IDs** → **App**, register bundle ID **`com.heartandhustle.app`**, enable any capabilities your app needs (often defaults are enough for a first build; push notifications only if you use them), then **Save**.

**Done when:** The App ID exists in the portal.

**Next:** Step 6.

---

### Step 6 — First production iOS build with EAS

**Goal:** A signed **IPA** (or EAS-managed artifact) suitable for TestFlight / App Store.

**Substeps:**

1. In Terminal:
   ```bash
   cd /Users/lawnhub-platform/HeartHustleFund/apps/mobile
   eas build --platform ios --profile production
   ```
2. The first time, EAS may ask to log in to Apple or create **distribution certificates**. Follow prompts; choosing **Let Expo handle credentials** is simplest for most teams.
3. Wait for the build on Expo’s servers (15–40+ minutes is normal).
4. When the URL appears, open it in the browser and confirm **status: finished**.

**Done when:** Build shows as complete on expo.dev.

**Troubleshooting:** If Apple login or 2FA fails, use the exact Apple ID enrolled in the Developer Program; ensure 2FA is on for that Apple ID.

**Next:** Step 7.

---

### Step 7 — App Store Connect: create the app record

**Goal:** A placeholder for **Heart & Hustle** exists with the correct bundle ID.

**Substeps:**

1. App Store Connect → **Apps** → **+** → **New App**.
2. Platforms: **iOS**.
3. Name: **Heart & Hustle** (or the exact name you want on the store).
4. Primary language: **English (U.S.)** (or your choice).
5. Bundle ID: select **`com.heartandhustle.app`** from the dropdown (must match `app.json`).
6. SKU: any unique internal string, e.g. **`heart-hustle-ios-1`**.
7. User access: **Full Access** unless you use a limited role.

**Done when:** The app appears in the Apps list with status **Prepare for Submission** or similar.

**Next:** Step 8.

---

### Step 8 — App Store Connect: agreements, tax, and banking

**Goal:** Apple allows you to submit paid or free apps (required before submission).

**Substeps:**

1. In App Store Connect, open **Agreements, Tax, and Banking**.
2. Complete **Paid Applications** (or **Free Apps** agreement if you only distribute free—still often need basic agreements filled).
3. Add **banking** and **tax** forms as requested (U.S. entity: W-9, etc.).
4. Wait until status shows **Active** (can take hours to days for banking verification).

**Done when:** No blocking red banners for contracts/tax/banking.

**Next:** Step 9.

---

### Step 9 — Upload the iOS build to App Store Connect (EAS Submit)

**Goal:** Your production build appears under the app’s **TestFlight** tab.

**Substeps:**

1. From `apps/mobile`:
   ```bash
   eas submit --platform ios --latest
   ```
   Or follow the Expo dashboard “Submit to App Store” after selecting the build.
2. Pick the **App Store Connect** app you created (Step 7).
3. Wait for processing (often 10–30 minutes; sometimes longer).

**Done when:** In App Store Connect → your app → **TestFlight**, you see a build processing or ready to test.

**Next:** Step 10.

---

### Step 10 — TestFlight internal testing

**Goal:** You install the real build on your iPhone before the public sees it.

**Substeps:**

1. On your iPhone, install **TestFlight** from the App Store.
2. In App Store Connect → **TestFlight**, add yourself as an **Internal Tester** (same Apple ID team rules apply).
3. Open the invite email on your phone and install the app.
4. Smoke-test: login, join fundraiser, donate path if applicable.

**Done when:** You’ve run the app from TestFlight successfully.

**Next:** Phase C (Android) or continue iOS listing (Step 14) in parallel once builds exist.

---

## Phase C — Google Play: first Android build and testing

### Step 11 — Create the Play Console app entry

**Goal:** An Android app shell with package **`com.heartandhustle.app`**.

**Substeps:**

1. Play Console → **Create app**.
2. App name: **Heart & Hustle** (or store name).
3. Default language, app/game, free/paid as appropriate.
4. Accept declarations.
5. After creation, note the app’s dashboard.

**Done when:** The app exists in Play Console.

**Next:** Step 12.

---

### Step 12 — First production Android build (AAB)

**Goal:** A signed **AAB** (Android App Bundle) for Play upload.

**Substeps:**

1. From `apps/mobile`:
   ```bash
   eas build --platform android --profile production
   ```
2. First time: accept **Play App Signing** (Google’s default; EAS integrates with this flow).
3. Wait for build completion.

**Done when:** Build finished on expo.dev.

**Next:** Step 13.

---

### Step 13 — Internal testing track on Google Play

**Goal:** You install the app from Play’s testing track (not production yet).

**Substeps:**

1. Play Console → your app → **Testing** → **Internal testing** (create release if needed).
2. Upload the **AAB** from EAS (`eas submit --platform android --latest` or manual upload in Play Console).
3. Add **testers** (email list or Google Group) and copy the **opt-in link**.
4. On a physical Android phone, open the opt-in link and install.

**Done when:** You’ve installed and smoke-tested the internal build.

**Next:** Step 14.

---

## Phase D — Store listings, privacy, and compliance forms

### Step 14 — Privacy policy URL (both stores)

**Goal:** A **public HTTPS** privacy page (you likely already host on your marketing site).

**Substeps:**

1. Confirm the URL loads in an incognito window, e.g. `https://your-domain.com/privacy`.
2. Copy that exact URL—you will paste it into App Store Connect and Play Console.

**Done when:** URL is live and final.

**Next:** Step 15.

---

### Step 15 — App Store listing assets (screenshots, description, support URL)

**Goal:** All required fields for **App Store** submission are filled.

**Substeps:**

1. App Store Connect → your app → **App Store** tab → prepare the **first version** (e.g. 1.0.0).
2. **Screenshots:** Capture required device sizes (start with **6.7"** iPhone). Use real device or simulator; see also [`app-store-checklist.md`](./app-store-checklist.md).
3. **Description**, **keywords**, **support URL** (required), **marketing URL** (optional).
4. **App Privacy** questionnaire: answer truthfully (SMS, contacts, identifiers, etc.—match what the app actually does).
5. **Age rating** questionnaire (likely 4+ for this app type—answer honestly).

**Done when:** No red “missing” indicators for required listing fields.

**Next:** Step 16.

---

### Step 16 — Google Play listing and policy forms

**Goal:** Play Console **Production** (or **Closed testing** first, per Google rules) is ready for review.

**Substeps:**

1. **Main store listing:** short description, full description, screenshots, feature graphic if required.
2. **Data safety** form: align with app behavior (SMS, phone, financial features, etc.).
3. **Content rating** questionnaire.
4. **Privacy policy** URL (same as Step 14).
5. Confirm **target API level** meets Play’s current requirement for new apps (Expo SDK 54 should be checked against Play’s deadline at submit time).

**Done when:** Dashboard shows readiness checks mostly green (resolve any “Policy status” items).

**Next:** Step 17.

---

## Phase E — Submit for review and launch

### Step 17 — iOS: submit for App Review

**Substeps:**

1. App Store Connect → select build for the version.
2. Add **review notes** (how to log in, test fundraiser, anything reviewers need).
3. If login is required, provide a **demo account** in review notes or private field.
4. **Submit for review**.

**Done when:** Status is **Waiting for Review** then **In Review** then **Pending Developer Release** or **Ready for Sale**.

**Next:** Step 18.

---

### Step 18 — Android: promote release to production (or closed → production)

**Substeps:**

1. Follow Play Console flow: **Closed testing** → **Production** (Google may require a minimum tester period—check current rules).
2. Create **production release** with your AAB, complete rollout.

**Done when:** App is available on Google Play (or in your chosen testing track for soft launch).

**Next:** Step 19.

---

### Step 19 — Post-launch checks

**Substeps:**

1. Install both stores’ **public** builds on clean devices.
2. Verify **production API** and **Stripe live** behavior if you take real money.
3. Monitor **crash reports** (add Sentry or similar if not already—recommended).
4. Keep **support email** monitored.

**Next:** Ongoing compliance (Illinois registration, insurance effective dates, website copy)—outside this build doc.

---

## Quick command reference (`apps/mobile`)

| Action | Command |
|--------|--------|
| Login to Expo | `eas login` |
| iOS production build | `eas build --platform ios --profile production` |
| Android production build | `eas build --platform android --profile production` |
| Submit latest iOS build | `eas submit --platform ios --latest` |
| Submit latest Android build | `eas submit --platform android --latest` |

---

## Related docs

- [`app-store-checklist.md`](./app-store-checklist.md) — icons, screenshot sizes, copy ideas.
- [`illinois-compliance.md`](./illinois-compliance.md) — state-side fundraising context (not store submission).

When you finish **Step 1**, say **“Step 1 done”** and we’ll walk through **Step 2** together in chat.
