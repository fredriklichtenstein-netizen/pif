import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { isCrawler, itemIdFromPath, ogImageIdFromPath, renderImageUrl, renderPreview, type Env } from "./index";

const env: Env = {
  SUPABASE_URL: "https://ref.supabase.co",
  SUPABASE_ANON_KEY: "anon",
  APP_ORIGIN: "https://pif.today",
  SHARE_ORIGIN: "https://app.pif.community",
};

const req = (path: string, ua: string, method = "GET") =>
  new Request(`https://app.pif.community${path}`, { method, headers: { "User-Agent": ua } });

const BROWSER = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1";
const WHATSAPP = "WhatsApp/2.23.20.0 A";

afterEach(() => vi.unstubAllGlobals());

describe("share worker helpers", () => {
  it("detects link-preview crawlers but not browsers or search engines", () => {
    expect(isCrawler("facebookexternalhit/1.1")).toBe(true);
    expect(isCrawler(WHATSAPP)).toBe(true);
    expect(isCrawler("Slackbot-LinkExpanding 1.0")).toBe(true);
    expect(isCrawler("meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)")).toBe(true);
    expect(isCrawler("meta-externalfetcher/1.1")).toBe(true);
    expect(isCrawler(BROWSER)).toBe(false);
    expect(isCrawler("Googlebot/2.1")).toBe(false);
    expect(isCrawler(null)).toBe(false);
  });

  it("only matches numeric /item/<id>", () => {
    expect(itemIdFromPath("/item/68")).toBe("68");
    expect(itemIdFromPath("/item/68/")).toBe("68");
    expect(itemIdFromPath("/item/abc")).toBeNull();
    expect(itemIdFromPath("/item/68/edit")).toBeNull();
    expect(itemIdFromPath("/feed")).toBeNull();
  });

  it("renders item tags like ItemDetailHead, escaped", () => {
    const html = renderPreview(
      { id: 5, title: 'Soffa "fin" <b>', description: "Hämtas & lämnas", images: null, item_type: "request" },
      env,
    );
    expect(html).toContain('<meta property="og:title" content="Sökes: Soffa &quot;fin&quot; &lt;b&gt;">');
    expect(html).toContain('content="Hämtas &amp; lämnas"');
    expect(html).toContain('<meta property="og:image" content="https://app.pif.community/pif-og-image.png">');
    expect(html).toContain('<meta property="og:url" content="https://app.pif.community/item/5">');
    expect(html).toContain('<a href="https://pif.today/feed?post=5">');
    expect(html).not.toContain("http-equiv");
    expect(html).not.toContain("<b>");
    expect(html).toContain('<meta property="og:image:width" content="1200">');
  });

  it("points og:image at the landscape crop for our own Storage photos", () => {
    const photo = "https://ref.supabase.co/storage/v1/object/public/post-images/images/u/1-image.webp";
    const html = renderPreview({ id: 7, title: "Lampa", description: null, images: [photo], item_type: "offer" }, env);
    expect(html).toMatch(/<meta property="og:image" content="https:\/\/app\.pif\.community\/og\/7\.webp\?v=[0-9a-z]+">/);
    expect(html).toContain('<meta property="og:image:height" content="630">');
    expect(renderImageUrl(photo, env)).toBe(
      "https://ref.supabase.co/storage/v1/render/image/public/post-images/images/u/1-image.webp?width=1200&height=630&resize=cover&quality=75",
    );
    expect(renderImageUrl("https://img/x.webp", env)).toBeNull();
    expect(ogImageIdFromPath("/og/7.webp")).toBe("7");
    expect(ogImageIdFromPath("/og/x.webp")).toBeNull();
  });
});

describe("share worker fetch", () => {
  it("redirects browsers to the post in the app's feed", async () => {
    const res = await worker.fetch(req("/item/68?x=1", BROWSER), env);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://pif.today/feed?post=68&x=1");
  });

  it("redirects other browser paths unchanged", async () => {
    const res = await worker.fetch(req("/map?x=1", BROWSER), env);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://pif.today/map?x=1");
  });

  it("serves crawlers item-specific OG HTML", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 68, title: "Krukor", description: "Två krukor", images: ["https://img/x.webp"], item_type: "offer" }])),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await worker.fetch(req("/item/68", WHATSAPP), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    const html = await res.text();
    expect(html).toContain('content="Piffas nu: Krukor"');
    expect(html).toContain('content="https://img/x.webp"');
    expect(html).not.toContain("og:image:width"); // external photo, size unknown
    expect(fetchMock.mock.calls[0][0]).toContain("https://ref.supabase.co/rest/v1/items?id=eq.68");
  });

  it("falls back to proxying the app for unknown items and non-item paths", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("[]"))
      .mockImplementation(async () => new Response("<html>generic</html>", { headers: { "Content-Type": "text/html" } }));
    vi.stubGlobal("fetch", fetchMock);

    const unknown = await worker.fetch(req("/item/999999", WHATSAPP), env);
    expect(await unknown.text()).toBe("<html>generic</html>");
    expect(fetchMock.mock.calls[1][0]).toBe("https://pif.today/item/999999");

    const image = await worker.fetch(req("/pif-og-image.png", WHATSAPP), env);
    expect(image.status).toBe(200);
    expect(fetchMock.mock.calls[2][0]).toBe("https://pif.today/pif-og-image.png");
  });

  it("serves /og/<id>.webp to anyone as a WebP crop", async () => {
    const photo = "https://ref.supabase.co/storage/v1/object/public/post-images/a.webp";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 7, title: "x", description: null, images: [photo], item_type: "offer" }])))
      .mockResolvedValueOnce(new Response("img", { headers: { "Content-Type": "image/webp" } }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await worker.fetch(req("/og/7.webp?v=abc", BROWSER), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(fetchMock.mock.calls[1][0]).toContain("/storage/v1/render/image/public/post-images/a.webp?width=1200");
    expect(fetchMock.mock.calls[1][1].headers.Accept).toBe("image/webp");
  });

  it("redirects /og/<id>.webp to the default image when the item has no photo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]")));
    const res = await worker.fetch(req("/og/9.webp", WHATSAPP), env);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://app.pif.community/pif-og-image.png");
  });
});
