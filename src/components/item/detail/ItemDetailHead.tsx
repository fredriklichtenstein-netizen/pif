import { Helmet } from "react-helmet-async";

interface ItemDetailHeadProps {
  id: string | number;
  title?: string;
  description?: string;
  images?: string[];
  itemType?: string;
}

const FALLBACK_IMAGE = "https://app.pif.community/pif-og-image.png";

export function ItemDetailHead({ id, title, description, images, itemType }: ItemDetailHeadProps) {
  const normalizedType = String(itemType || "offer").toLowerCase();
  const isRequest = normalizedType === "request" || normalizedType === "wish";

  const trimmedTitle = title?.trim();
  const ogTitle = trimmedTitle
    ? (isRequest ? `Sökes: ${trimmedTitle}` : `Piffas nu: ${trimmedTitle}`)
    : "PIF — Pay It Forward";
  const ogDescription = description?.trim() ?? "";
  const ogImage = images && images.length > 0 ? images[0] : FALLBACK_IMAGE;
  const ogUrl = `https://app.pif.community/item/${id}`;

  return (
    <Helmet>
      <title>{ogTitle}</title>
      <meta name="description" content={ogDescription} />
      <link rel="canonical" href={ogUrl} />

      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PIF — Pay It Forward" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
