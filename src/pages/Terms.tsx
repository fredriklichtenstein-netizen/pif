import { useTranslation } from "react-i18next";
import { LegalBackButton } from "@/components/legal/LegalBackButton";
import { Link } from "react-router-dom";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION } from "@/lib/terms";

// Same typography as the privacy policy (src/pages/Privacy.tsx).
const h1 = "text-3xl sm:text-4xl font-bold text-center mb-2 mt-2";
const meta = "text-sm text-muted-foreground text-center mb-8";
const h2 = "text-xl sm:text-2xl font-semibold mt-10 mb-3 text-foreground";
const p = "text-base leading-relaxed text-foreground/90 mb-4";
const ul = "list-disc pl-6 mb-4 space-y-1.5 text-foreground/90";
const link = "text-primary underline";

function SwedishTerms() {
  return (
    <article className="text-left">
      <h1 className={h1}>Användarvillkor för PIF</h1>
      <p className={meta}>
        Gäller från {TERMS_EFFECTIVE_DATE.sv} · Version {TERMS_VERSION}
      </p>

      <h2 className={h2}>1. Om PIF</h2>
      <p className={p}>
        PIF (Pay it Forward) drivs av PIF App AB, org.nr 559129-3690. I PIF kan grannar ge bort saker
        de inte längre använder ("piffa") och be om saker de behöver ("önska"). Allt i PIF är gratis.
        Det är inte tillåtet att sälja, ta betalt, byta eller kräva något i gengäld.
      </p>

      <h2 className={h2}>2. Ditt konto</h2>
      <ul className={ul}>
        <li>Du måste vara minst 16 år för att använda PIF.</li>
        <li>
          Ett konto per person. Uppgifterna du lämnar ska vara sanna, och du ansvarar för det som görs
          från ditt konto.
        </li>
        <li>Du kan radera ditt konto när du vill under Inställningar.</li>
      </ul>

      <h2 className={h2}>3. Det här är inte tillåtet</h2>
      <p className={p}>Du får inte lägga upp, skicka eller kommentera något som:</p>
      <ul className={ul}>
        <li>
          är olagligt, eller gäller saker som är olagliga att lämna över (till exempel narkotika,
          skjutvapen eller receptbelagda läkemedel);
        </li>
        <li>gäller alkohol eller tobak – det är inte tillåtet i PIF eftersom användare kan vara från 16 år;</li>
        <li>är farligt, till exempel återkallade produkter eller saker som inte är säkra att använda;</li>
        <li>är hotfullt, våldsamt, trakasserande, kränkande, hatiskt eller diskriminerande;</li>
        <li>är spam, reklam, försäljning eller vilseledande;</li>
        <li>
          inkräktar på någon annans rättigheter, till exempel bilder du inte får använda eller
          uppgifter om andra personer.
        </li>
      </ul>
      <p className={p}>Beskriv det du piffar ärligt, och bemöt andra med respekt.</p>

      <h2 className={h2}>4. Nolltolerans, rapporter och blockering</h2>
      <ul className={ul}>
        <li>PIF har nolltolerans mot stötande innehåll och mot användare som trakasserar andra.</li>
        <li>
          Du kan rapportera inlägg, kommentarer, meddelanden och personer, och blockera den du inte
          vill ha kontakt med.
        </li>
        <li>
          Vi går igenom rapporter inom 24 timmar. Innehåll som bryter mot villkoren tar vi bort, och
          vid allvarliga eller upprepade fall stänger vi av eller raderar kontot.
        </li>
      </ul>

      <h2 className={h2}>5. Ditt innehåll</h2>
      <ul className={ul}>
        <li>Det du lägger upp (bilder, texter) är fortfarande ditt.</li>
        <li>
          Genom att publicera ett inlägg ger du PIF en kostnadsfri, icke-exklusiv rätt att visa
          inlägget i appen, och att visa bild och rubrik i vårt nyhetsbrev och när vi berättar om PIF
          i sociala medier och andra marknadsföringskanaler. Vi visar aldrig din adress eller ditt
          namn i de sammanhangen.
        </li>
        <li>Du ansvarar för att du har rätt att använda bilderna och texterna du lägger upp.</li>
      </ul>

      <h2 className={h2}>6. Överlämningar sker mellan er</h2>
      <ul className={ul}>
        <li>
          PIF förmedlar kontakten. Själva överlämningen sker mellan dig och den andra användaren, och
          PIF är inte part i den.
        </li>
        <li>
          Vi ansvarar inte för sakernas skick, för att en överlämning blir av eller för det som händer
          när ni ses.
        </li>
        <li>
          Tips: möts gärna på en allmän plats – din överlämningsadress behöver inte vara din
          bostadsadress – berätta för någon vart du ska, och dela aldrig mer personlig information än
          som behövs.
        </li>
      </ul>

      <h2 className={h2}>7. Tjänsten</h2>
      <p className={p}>
        Vi utvecklar PIF hela tiden och kan ändra, pausa eller avsluta funktioner. Vi gör vårt bästa
        för att tjänsten ska fungera, men kan inte lova att den alltid är tillgänglig eller felfri.
      </p>

      <h2 className={h2}>8. Ändringar i villkoren</h2>
      <p className={p}>
        Om vi ändrar villkoren meddelar vi det i appen eller via e-post. Väsentliga ändringar behöver
        du godkänna innan du kan fortsätta lägga upp, visa intresse, kommentera eller skicka
        meddelanden.
      </p>

      <h2 className={h2}>9. Personuppgifter</h2>
      <p className={p}>
        Hur vi hanterar personuppgifter står i vår{" "}
        <Link to="/privacy" className={link}>
          integritetspolicy
        </Link>
        .
      </p>

      <h2 className={h2}>10. Lag och kontakt</h2>
      <p className={p}>
        Svensk lag gäller för villkoren. Frågor:{" "}
        <a href="mailto:hej@pif.community" className={link}>
          hej@pif.community
        </a>
      </p>
    </article>
  );
}

function EnglishTerms() {
  return (
    <article className="text-left">
      <h1 className={h1}>PIF Terms of Use</h1>
      <p className={meta}>
        Effective from {TERMS_EFFECTIVE_DATE.en} · Version {TERMS_VERSION}
      </p>

      <h2 className={h2}>1. About PIF</h2>
      <p className={p}>
        PIF (Pay it Forward) is run by PIF App AB, company reg. no. 559129-3690. In PIF, neighbours
        can give away things they no longer use ("pif") and ask for things they need ("wish").
        Everything in PIF is free. Selling, charging, swapping or asking for anything in return is not
        allowed.
      </p>

      <h2 className={h2}>2. Your account</h2>
      <ul className={ul}>
        <li>You must be at least 16 years old to use PIF.</li>
        <li>
          One account per person. The information you give must be true, and you are responsible for
          what is done from your account.
        </li>
        <li>You can delete your account at any time under Settings.</li>
      </ul>

      <h2 className={h2}>3. What isn't allowed</h2>
      <p className={p}>You may not post, send or comment anything that:</p>
      <ul className={ul}>
        <li>
          is illegal, or concerns things that are illegal to hand over (for example drugs, firearms or
          prescription medicines);
        </li>
        <li>concerns alcohol or tobacco – not allowed in PIF because users can be as young as 16;</li>
        <li>is dangerous, for example recalled products or things that aren't safe to use;</li>
        <li>is threatening, violent, harassing, offensive, hateful or discriminatory;</li>
        <li>is spam, advertising, a sale or misleading;</li>
        <li>
          infringes someone else's rights, for example photos you may not use or information about
          other people.
        </li>
      </ul>
      <p className={p}>Describe what you pif honestly, and treat others with respect.</p>

      <h2 className={h2}>4. Zero tolerance, reports and blocking</h2>
      <ul className={ul}>
        <li>PIF has zero tolerance for objectionable content and for users who harass others.</li>
        <li>
          You can report posts, comments, messages and people, and block anyone you don't want contact
          with.
        </li>
        <li>
          We review reports within 24 hours. We remove content that breaks these terms, and in serious
          or repeated cases we suspend or delete the account.
        </li>
      </ul>

      <h2 className={h2}>5. Your content</h2>
      <ul className={ul}>
        <li>What you post (photos, texts) remains yours.</li>
        <li>
          By publishing a post you give PIF a free, non-exclusive right to show the post in the app,
          and to show its photo and title in our newsletter and when we talk about PIF on social media
          and in other marketing channels. We never show your address or your name in those contexts.
        </li>
        <li>You are responsible for having the right to use the photos and texts you post.</li>
      </ul>

      <h2 className={h2}>6. Handovers happen between you</h2>
      <ul className={ul}>
        <li>
          PIF puts you in touch. The handover itself happens between you and the other user, and PIF
          is not a party to it.
        </li>
        <li>
          We are not responsible for the condition of items, for a handover taking place, or for what
          happens when you meet.
        </li>
        <li>
          Tip: meet in a public place if you can – your handover address doesn't have to be your home
          address – tell someone where you're going, and never share more personal information than
          needed.
        </li>
      </ul>

      <h2 className={h2}>7. The service</h2>
      <p className={p}>
        We keep developing PIF and may change, pause or end features. We do our best to keep the
        service working, but can't promise it is always available or free of errors.
      </p>

      <h2 className={h2}>8. Changes to these terms</h2>
      <p className={p}>
        If we change these terms, we'll tell you in the app or by email. Material changes need your
        acceptance before you can continue to post, show interest, comment or send messages.
      </p>

      <h2 className={h2}>9. Personal data</h2>
      <p className={p}>
        How we handle personal data is described in our{" "}
        <Link to="/privacy" className={link}>
          privacy policy
        </Link>
        .
      </p>

      <h2 className={h2}>10. Law and contact</h2>
      <p className={p}>
        Swedish law applies to these terms. Questions:{" "}
        <a href="mailto:hej@pif.community" className={link}>
          hej@pif.community
        </a>
      </p>
    </article>
  );
}

/** The terms text in the current language, without the page frame (used in dialogs). */
export function TermsContent() {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("sv") ? <SwedishTerms /> : <EnglishTerms />;
}

export default function Terms() {
  const { i18n } = useTranslation();
  const isSwedish = i18n.language?.startsWith("sv");

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 pb-24 text-left">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <LegalBackButton label={isSwedish ? "Tillbaka" : "Back"} />
          <LanguageSelector />
        </div>
        {isSwedish ? <SwedishTerms /> : <EnglishTerms />}
      </div>
    </div>
  );
}
