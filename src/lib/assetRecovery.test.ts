// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { collectAssetUrls } from "./assetRecovery";

describe("collectAssetUrls", () => {
  it("collects same-origin /assets/ scripts, styles, preloads and URLs named in the error", () => {
    document.head.innerHTML = `
      <script type="module" src="/assets/index-A.js"></script>
      <link rel="modulepreload" href="/assets/vendor-B.js">
      <link rel="stylesheet" href="/assets/index-C.css">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=x">
      <link rel="icon" href="/assets/icon.png">`;
    const err = new TypeError(
      `'text/html' is not a valid JavaScript MIME type for module script '${window.location.origin}/assets/house-D.js'.`,
    );
    expect(collectAssetUrls(document, err).sort()).toEqual(
      ["/assets/house-D.js", "/assets/index-A.js", "/assets/index-C.css", "/assets/vendor-B.js"].sort(),
    );
  });

  it("ignores other origins in the error message", () => {
    document.head.innerHTML = "";
    expect(collectAssetUrls(document, "failed https://example.com/assets/x.js")).toEqual([]);
  });
});
