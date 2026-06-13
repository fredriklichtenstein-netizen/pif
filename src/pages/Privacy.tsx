import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LanguageSelector } from "@/components/common/LanguageSelector";

// Shared typography classes
const h1 = "text-3xl sm:text-4xl font-bold text-center mb-8 mt-2";
const h2 = "text-xl sm:text-2xl font-semibold mt-10 mb-3 text-foreground";
const p = "text-base leading-relaxed text-foreground/90 mb-4";
const ul = "list-disc pl-6 mb-4 space-y-1.5 text-foreground/90";
const block = "bg-muted/40 border border-border rounded-lg p-4 mb-6 leading-relaxed";
const tableWrap = "overflow-x-auto mb-6 border border-border rounded-lg";
const table = "w-full text-left text-sm";
const th = "px-4 py-2 bg-muted font-semibold border-b border-border";
const td = "px-4 py-3 border-b border-border last:border-b-0 align-top";

function SwedishPolicy() {
  return (
    <article className="text-left">
      <h1 className={h1}>Integritetspolicy</h1>
      <p className={p}>
        <strong>PIF App AB</strong> ("PIF", "vi", "oss") värnar om din integritet. Denna
        integritetspolicy förklarar hur vi samlar in, använder och skyddar dina personuppgifter
        när du använder vår tjänst på app.pif.community.
      </p>
      <div className={block}>
        <strong>Personuppgiftsansvarig</strong>
        <br />PIF App AB
        <br />Kristinebergs slottsväg 3
        <br />112 14 Stockholm, Sverige
        <br />Org.nr: 559129-3690
        <br />E-post: hej@pif.community
      </div>

      <h2 className={h2}>1. Vilka uppgifter vi samlar in</h2>
      <p className={p}><strong>Uppgifter du lämnar:</strong></p>
      <ul className={ul}>
        <li>Namn, e-postadress och profilbild vid registrering</li>
        <li>Adress och upphämtningspreferenser i profilinställningar</li>
        <li>Innehåll du publicerar (piffar, önskningar, bilder, beskrivningar)</li>
        <li>Meddelanden du skickar till andra användare</li>
        <li>Betyg och kommentarer du lämnar efter genomförda utbyten</li>
      </ul>
      <p className={p}><strong>Uppgifter vi samlar in automatiskt:</strong></p>
      <ul className={ul}>
        <li>Ungefärlig plats (du väljer om exakt adress ska delas — den visas alltid fördold för andra användare)</li>
        <li>Teknisk information såsom enhetstyp och webbläsare för att säkerställa att tjänsten fungerar korrekt</li>
      </ul>

      <h2 className={h2}>2. Hur vi använder dina uppgifter</h2>
      <p className={p}>Vi behandlar dina personuppgifter för följande ändamål:</p>
      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr><th className={th}>Ändamål</th><th className={th}>Rättslig grund</th></tr>
          </thead>
          <tbody>
            <tr><td className={td}>Tillhandahålla och driva tjänsten</td><td className={td}>Fullgörande av avtal (GDPR art. 6.1.b)</td></tr>
            <tr><td className={td}>Matcha piffar och önskningar mellan användare</td><td className={td}>Fullgörande av avtal (GDPR art. 6.1.b)</td></tr>
            <tr><td className={td}>Skicka aviseringar om aktivitet som rör dig</td><td className={td}>Fullgörande av avtal (GDPR art. 6.1.b)</td></tr>
            <tr><td className={td}>Hantera rapporter och säkerhet</td><td className={td}>Berättigat intresse (GDPR art. 6.1.f)</td></tr>
            <tr><td className={td}>Förbättra tjänsten</td><td className={td}>Berättigat intresse (GDPR art. 6.1.f)</td></tr>
          </tbody>
        </table>
      </div>
      <p className={p}>Vi säljer aldrig dina personuppgifter till tredje part.</p>

      <h2 className={h2}>3. Delning av uppgifter</h2>
      <p className={p}>Vi delar dina uppgifter med följande kategorier av mottagare:</p>
      <ul className={ul}>
        <li><strong>Supabase Ireland Ltd</strong> — databaslagring och autentisering (EU-server)</li>
        <li><strong>Mapbox Inc</strong> — karttjänst för att visa ungefärliga platser</li>
        <li><strong>Resend Inc</strong> — e-postutskick för aviseringar och rapporter</li>
        <li><strong>Hado SEO</strong> — sökmotoroptimering på DNS-nivå</li>
        <li><strong>GitHub Inc</strong> — versionshantering av applikationskod</li>
      </ul>
      <p className={p}>
        Alla leverantörer behandlar uppgifter enligt gällande dataskyddslagstiftning. Våra
        primära datalagringsleverantörer använder EU-baserade servrar.
      </p>

      <h2 className={h2}>4. Lagring och radering</h2>
      <p className={p}>Vi lagrar dina personuppgifter så länge ditt konto är aktivt.</p>
      <p className={p}><strong>När du raderar ditt konto:</strong></p>
      <ul className={ul}>
        <li>Dina profiluppgifter (namn, e-post, profilbild, adress) raderas permanent</li>
        <li>Dina publicerade piffar och önskningar som aldrig slutförts raderas</li>
        <li>Piffar och önskningar som slutförts anonymiseras — de visas med "Borttagen användare" som avsändare för att bevara transaktionshistoriken för den andra parten</li>
        <li>Dina meddelanden anonymiseras och visas med "Borttagen användare" som avsändare</li>
        <li>Dina betyg bidrar anonymt till mottagarens genomsnittsbetyg utan koppling till dig</li>
      </ul>

      <h2 className={h2}>5. Dina rättigheter</h2>
      <p className={p}>Du har rätt att:</p>
      <ul className={ul}>
        <li><strong>Få tillgång</strong> till de personuppgifter vi behandlar om dig</li>
        <li><strong>Rätta</strong> felaktiga uppgifter</li>
        <li><strong>Radera</strong> ditt konto och dina uppgifter (se avsnitt 4)</li>
        <li><strong>Invända</strong> mot behandling baserad på berättigat intresse</li>
        <li><strong>Begränsa</strong> behandlingen av dina uppgifter</li>
        <li><strong>Dataportabilitet</strong> — få ut dina uppgifter i ett strukturerat format</li>
        <li><strong>Klaga</strong> till Integritetsskyddsmyndigheten (IMY) på imy.se</li>
      </ul>
      <p className={p}>För att utöva dina rättigheter, kontakta oss på hej@pif.community. Vi svarar inom 30 dagar.</p>

      <h2 className={h2}>6. Cookies och spårning</h2>
      <p className={p}>
        PIF använder enbart funktionella cookies och sessionscookies som är nödvändiga för att
        tjänsten ska fungera. Vi använder inga spårnings- eller reklamcookies.
      </p>

      <h2 className={h2}>7. Åldersgräns</h2>
      <p className={p}>
        PIF är avsedd för användare som är 16 år eller äldre. Vi samlar inte medvetet in
        personuppgifter från personer under 16 år. Om vi får kännedom om att en användare är
        under 16 år raderar vi kontot omgående.
      </p>

      <h2 className={h2}>8. Säkerhet</h2>
      <p className={p}>
        Vi vidtar tekniska och organisatoriska åtgärder för att skydda dina personuppgifter,
        inklusive krypterad dataöverföring (HTTPS), krypterad datalagring och åtkomstkontroll.
        Vid en personuppgiftsincident som kan påverka dig meddelar vi dig och
        Integritetsskyddsmyndigheten inom de tidsramar som krävs enligt GDPR.
      </p>

      <h2 className={h2}>9. Ändringar i denna policy</h2>
      <p className={p}>
        Vi kan komma att uppdatera denna integritetspolicy. Vid väsentliga ändringar meddelar vi
        dig via e-post eller ett tydligt meddelande i appen minst 30 dagar innan ändringen
        träder i kraft.
      </p>

      <h2 className={h2}>10. Kontakt</h2>
      <div className={block}>
        Har du frågor om hur vi behandlar dina personuppgifter?
        <br />Kontakta oss på: hej@pif.community
        <br />PIF App AB, Kristinebergs slottsväg 3, 112 14 Stockholm
      </div>
      <p className="text-sm text-muted-foreground italic mt-8">Senast uppdaterad: juni 2026</p>
    </article>
  );
}

function EnglishPolicy() {
  return (
    <article className="text-left">
      <h1 className={h1}>Privacy Policy</h1>
      <p className={p}>
        <strong>PIF App AB</strong> ("PIF", "we", "us") respects your privacy. This privacy
        policy explains how we collect, use, and protect your personal data when you use our
        service at app.pif.community.
      </p>
      <div className={block}>
        <strong>Data Controller</strong>
        <br />PIF App AB
        <br />Kristinebergs slottsväg 3
        <br />112 14 Stockholm, Sweden
        <br />Company reg. no: 559129-3690
        <br />Email: hej@pif.community
      </div>

      <h2 className={h2}>1. Data We Collect</h2>
      <p className={p}><strong>Data you provide:</strong></p>
      <ul className={ul}>
        <li>Name, email address and profile photo upon registration</li>
        <li>Address and pickup preferences in profile settings</li>
        <li>Content you publish (pifs, wishes, images, descriptions)</li>
        <li>Messages you send to other users</li>
        <li>Ratings and comments you leave after completed exchanges</li>
      </ul>
      <p className={p}><strong>Data we collect automatically:</strong></p>
      <ul className={ul}>
        <li>Approximate location (you choose whether to share your exact address — it is always shown in a privacy-distorted form to other users)</li>
        <li>Technical information such as device type and browser to ensure the service works correctly</li>
      </ul>

      <h2 className={h2}>2. How We Use Your Data</h2>
      <p className={p}>We process your personal data for the following purposes:</p>
      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr><th className={th}>Purpose</th><th className={th}>Legal basis</th></tr>
          </thead>
          <tbody>
            <tr><td className={td}>Providing and operating the service</td><td className={td}>Performance of contract (GDPR art. 6.1.b)</td></tr>
            <tr><td className={td}>Matching pifs and wishes between users</td><td className={td}>Performance of contract (GDPR art. 6.1.b)</td></tr>
            <tr><td className={td}>Sending notifications about activity relevant to you</td><td className={td}>Performance of contract (GDPR art. 6.1.b)</td></tr>
            <tr><td className={td}>Managing reports and security</td><td className={td}>Legitimate interest (GDPR art. 6.1.f)</td></tr>
            <tr><td className={td}>Improving the service</td><td className={td}>Legitimate interest (GDPR art. 6.1.f)</td></tr>
          </tbody>
        </table>
      </div>
      <p className={p}>We never sell your personal data to third parties.</p>

      <h2 className={h2}>3. Sharing of Data</h2>
      <p className={p}>We share your data with the following categories of recipients:</p>
      <ul className={ul}>
        <li><strong>Supabase Ireland Ltd</strong> — database storage and authentication (EU servers)</li>
        <li><strong>Mapbox Inc</strong> — map service for displaying approximate locations</li>
        <li><strong>Resend Inc</strong> — email delivery for notifications and reports</li>
        <li><strong>Hado SEO</strong> — DNS-level search engine optimisation</li>
        <li><strong>GitHub Inc</strong> — version control for application code</li>
      </ul>
      <p className={p}>
        All providers process data in accordance with applicable data protection legislation.
        Our primary data storage providers use EU-based servers.
      </p>

      <h2 className={h2}>4. Retention and Deletion</h2>
      <p className={p}>We store your personal data for as long as your account is active.</p>
      <p className={p}><strong>When you delete your account:</strong></p>
      <ul className={ul}>
        <li>Your profile data (name, email, profile photo, address) is permanently deleted</li>
        <li>Your published pifs and wishes that were never completed are deleted</li>
        <li>Pifs and wishes that were completed are anonymised — they are shown with "Deleted user" as the author to preserve the transaction history for the other party</li>
        <li>Your messages are anonymised and shown with "Deleted user" as the sender</li>
        <li>Your ratings contribute anonymously to the recipient's average rating with no link back to you</li>
      </ul>

      <h2 className={h2}>5. Your Rights</h2>
      <p className={p}>You have the right to:</p>
      <ul className={ul}>
        <li><strong>Access</strong> the personal data we process about you</li>
        <li><strong>Rectify</strong> inaccurate data</li>
        <li><strong>Delete</strong> your account and data (see section 4)</li>
        <li><strong>Object</strong> to processing based on legitimate interest</li>
        <li><strong>Restrict</strong> the processing of your data</li>
        <li><strong>Data portability</strong> — receive your data in a structured format</li>
        <li><strong>Lodge a complaint</strong> with the Swedish Authority for Privacy Protection (IMY) at imy.se</li>
      </ul>
      <p className={p}>To exercise your rights, contact us at hej@pif.community. We respond within 30 days.</p>

      <h2 className={h2}>6. Cookies and Tracking</h2>
      <p className={p}>
        PIF uses only functional cookies and session cookies that are necessary for the service
        to work. We do not use tracking or advertising cookies.
      </p>

      <h2 className={h2}>7. Age Restriction</h2>
      <p className={p}>
        PIF is intended for users aged 16 and over. We do not knowingly collect personal data
        from persons under 16. If we become aware that a user is under 16, we will delete the
        account promptly.
      </p>

      <h2 className={h2}>8. Security</h2>
      <p className={p}>
        We implement technical and organisational measures to protect your personal data,
        including encrypted data transfer (HTTPS), encrypted data storage, and access controls.
        In the event of a personal data breach that may affect you, we will notify you and the
        Swedish Authority for Privacy Protection within the timeframes required by GDPR.
      </p>

      <h2 className={h2}>9. Changes to This Policy</h2>
      <p className={p}>
        We may update this privacy policy. For material changes, we will notify you by email or
        a clear in-app message at least 30 days before the change takes effect.
      </p>

      <h2 className={h2}>10. Contact</h2>
      <div className={block}>
        Questions about how we handle your personal data?
        <br />Contact us at: hej@pif.community
        <br />PIF App AB, Kristinebergs slottsväg 3, 112 14 Stockholm, Sweden
      </div>
      <p className="text-sm text-muted-foreground italic mt-8">Last updated: June 2026</p>
    </article>
  );
}

export default function Privacy() {
  const { i18n } = useTranslation();
  const isSwedish = i18n.language?.startsWith("sv");

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 pb-24 text-left">
      <div className="max-w-[700px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft size={16} />
              {isSwedish ? "Tillbaka" : "Back"}
            </Button>
          </Link>
          <LanguageSelector />
        </div>
        {isSwedish ? <SwedishPolicy /> : <EnglishPolicy />}
      </div>
    </div>
  );
}
