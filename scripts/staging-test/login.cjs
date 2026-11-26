// Opens the app's own one-time login link (/email-confirmation, type=magiclink) as the
// given staging test account and saves the signed-in browser state. Called by login.sh.
const { chromium } = require("playwright");
const path = require("path");
const [who, hash, out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, locale: "sv-SE" });
  const p = await ctx.newPage();
  await p.goto(`https://staging.pif.today/email-confirmation?token_hash=${hash}&type=magiclink`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(6000);
  const ok = await p.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token")));
  await ctx.storageState({ path: path.join(out, `state-${who}.json`) });
  await b.close();
  console.log(`Testare ${who.toUpperCase()}: ${ok ? "signed in" : "NOT signed in"} -> ${path.join(out, `state-${who}.json`)}`);
  process.exit(ok ? 0 : 1);
})();
