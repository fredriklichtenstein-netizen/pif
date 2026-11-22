// Newsletter attribution report (production). Counts only — no names or emails.
//
//   bun scripts/campaign-report.ts
//
// 1. Per campaign (?ref=nl-<issue> on newsletter links): people who opened a
//    tagged link while signed in or before signing up, and how many of them
//    then signed up / posted / showed interest / saved within 30 days
//    (tables campaign_touches + campaign_events, see CLAUDE.md "Campaign
//    attribution").
// 2. External sign-ups (the old site's list, Resend segments "Välkomst externa
//    – svenska / – English"): how many now have a PIF account, and what they
//    have done since — whether or not they clicked a link.
//
// Needs the Supabase Management API and the Resend API. In a cloud session the
// proxy injects both credentials; elsewhere set SUPABASE_ACCESS_TOKEN and
// RESEND_API_KEY (a full-access key, contacts need it).

const PROJECT = process.env.PROJECT ?? "heurpehcwbhohwklqnir";
const EXTERNAL_SEGMENTS = [
  "1cfafaff-c0f8-4059-a537-9c5636ef6227", // Välkomst externa – svenska
  "08ee921d-b24f-4db1-8ebe-eced96e4daf8", // Välkomst externa – English
];
const IMPORTED_AT = "2026-11-21T23:00:00Z";

const bearer = (name: string) => {
  const v = process.env[name];
  return v ? { Authorization: `Bearer ${v}` } : {};
};

async function sql<T = Record<string, unknown>>(query: string): Promise<T[]> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearer("SUPABASE_ACCESS_TOKEN") },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`SQL failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function segmentEmails(segment: string): Promise<string[]> {
  const emails: string[] = [];
  let after: string | undefined;
  for (;;) {
    const url = new URL("https://api.resend.com/contacts");
    url.searchParams.set("segment_id", segment);
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);
    const res = await fetch(url, { headers: bearer("RESEND_API_KEY") });
    if (!res.ok) throw new Error(`Resend contacts failed: ${res.status} ${await res.text()}`);
    const body: { data: { id: string; email: string }[]; has_more?: boolean } = await res.json();
    emails.push(...body.data.map((c) => c.email.toLowerCase()));
    if (!body.has_more || body.data.length === 0) break;
    after = body.data[body.data.length - 1].id;
    await new Promise((r) => setTimeout(r, 200));
  }
  return emails;
}

const campaigns = await sql<{ campaign: string; people: number; signup: number; first_post: number; first_interest: number; first_save: number; first_touch: string; last_touch: string }>(`
  select t.campaign,
         count(distinct t.user_id)::int as people,
         count(distinct e.user_id) filter (where e.event = 'signup')::int as signup,
         count(distinct e.user_id) filter (where e.event = 'first_post')::int as first_post,
         count(distinct e.user_id) filter (where e.event = 'first_interest')::int as first_interest,
         count(distinct e.user_id) filter (where e.event = 'first_save')::int as first_save,
         min(t.touched_at)::date::text as first_touch, max(t.touched_at)::date::text as last_touch
  from campaign_touches t
  left join campaign_events e on e.user_id = t.user_id and e.campaign = t.campaign
  group by t.campaign order by min(t.touched_at)`);

console.log("\n== Per campaign (people who opened a tagged link while signed in, or signed up after one)");
if (campaigns.length === 0) console.log("(no tagged visits yet)");
else console.table(campaigns);

const emails = [...new Set((await Promise.all(EXTERNAL_SEGMENTS.map(segmentEmails))).flat())];
// The list goes in as one JSON literal; emails come from Resend, never from users.
const list = JSON.stringify(emails).replace(/\$/g, "");
const [external] = await sql<Record<string, number | string | null>>(`
  with ext as (select lower(value) as email from jsonb_array_elements_text($json$${list}$json$::jsonb)),
  u as (select a.id, a.created_at from auth.users a join ext on lower(a.email) = ext.email)
  select (select count(*) from ext)::int as imported,
         (select count(*) from u)::int as have_account,
         (select count(*) from u where created_at >= '${IMPORTED_AT}')::int as joined_since_import,
         (select count(distinct i.user_id) from items i join u on u.id = i.user_id where i.created_at >= '${IMPORTED_AT}')::int as posted_since,
         (select count(distinct x.user_id) from interests x join u on u.id = x.user_id where x.created_at >= '${IMPORTED_AT}')::int as showed_interest_since,
         (select count(distinct l.user_id) from likes l join u on u.id = l.user_id where l.created_at >= '${IMPORTED_AT}')::int as saved_since,
         (select min(created_at)::date::text from u where created_at >= '${IMPORTED_AT}') as first_join,
         (select max(created_at)::date::text from u where created_at >= '${IMPORTED_AT}') as last_join`);

console.log("\n== External sign-ups (old site's list, imported 2026-11-21)");
console.table([external]);
