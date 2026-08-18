import { getDictionary } from "@/lib/i18n";
import { LegalPageShell } from "@/components/shared/legal-page-shell";

export default async function PrivacyPage() {
  const { locale } = await getDictionary();

  if (locale === "en") {
    return (
      <LegalPageShell locale={locale} title="Privacy Policy" updatedLabel="Last updated: August 18, 2026">
        <p>
          <strong>Draft notice:</strong> this policy describes TrackQuo&apos;s actual data practices as of this
          version of the product. It has not yet been reviewed by a lawyer and should not be treated as final legal
          advice — have it reviewed before relying on it with real customers, particularly regarding Quebec&apos;s
          Act respecting the protection of personal information in the private sector (Law 25).
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>Account information: your name, email, and password (stored as a salted hash, never in plain text).</li>
          <li>Company information: business name, type, contact details, time zone, and business hours.</li>
          <li>Customer records you enter: name, email, phone, address, notes, and language preference.</li>
          <li>Quote details and the content of follow-up messages sent and received.</li>
          <li>An activity log of actions taken in the app (e.g. quote created, follow-up activated, message sent).</li>
        </ul>

        <h2>Why we collect it</h2>
        <p>
          Solely to operate the quote-follow-up service you signed up for: tracking your quotes, scheduling and
          sending follow-up messages, and showing you the resulting analytics. We do not sell data, and we do not
          use it for advertising.
        </p>

        <h2>Consent for customer outreach</h2>
        <p>
          Before any automated email or SMS is sent to one of your customers, TrackQuo requires you to record that
          customer&apos;s explicit consent for that channel. You are responsible for obtaining that consent from
          your own customers before enabling it in the app.
        </p>

        <h2>Where data is stored</h2>
        <p>
          Application data is stored in a PostgreSQL database hosted in Canada (Supabase, Montreal region). The
          application itself runs on Vercel&apos;s infrastructure. If you connect a real email or SMS provider, that
          provider will also process the content of messages sent through it.
        </p>

        <h2>Retention and deletion</h2>
        <p>
          Data is retained as long as your account is active. You can delete a customer record at any time from the
          Customers page, and delete your entire company account (which removes all associated data) from Settings.
          To request deletion or an export of your data outside the app, contact us at the address below.
        </p>

        <h2>Cookies</h2>
        <p>
          We use two cookies: one to keep you signed in (httpOnly, required for the app to function) and one to
          remember your language preference. Neither is used for advertising or cross-site tracking.
        </p>

        <h2>Contact</h2>
        <p>Questions about this policy or your data: contact the team through the email address on your account invite.</p>
      </LegalPageShell>
    );
  }

  return (
    <LegalPageShell locale={locale} title="Politique de confidentialité" updatedLabel="Dernière mise à jour : 18 août 2026">
      <p>
        <strong>Avis — version brouillon :</strong> cette politique décrit les pratiques réelles de TrackQuo à cette
        étape du produit. Elle n&apos;a pas encore été révisée par un avocat et ne doit pas être considérée comme un
        avis juridique final — faites-la valider avant de vous y fier avec de vrais clients, en particulier au
        regard de la Loi 25 sur la protection des renseignements personnels dans le secteur privé.
      </p>

      <h2>Ce que nous recueillons</h2>
      <ul>
        <li>Informations de compte : votre nom, courriel et mot de passe (stocké sous forme de hachage salé, jamais en texte clair).</li>
        <li>Informations sur l&apos;entreprise : nom, type d&apos;entreprise, coordonnées, fuseau horaire et heures d&apos;ouverture.</li>
        <li>Fiches clients que vous saisissez : nom, courriel, téléphone, adresse, notes et langue préférée.</li>
        <li>Détails des soumissions et contenu des messages de suivi envoyés et reçus.</li>
        <li>Un journal d&apos;activité des actions posées dans l&apos;application (ex. : soumission créée, suivi activé, message envoyé).</li>
      </ul>

      <h2>Pourquoi nous les recueillons</h2>
      <p>
        Uniquement pour faire fonctionner le service de suivi de soumissions auquel vous vous êtes inscrit : suivre
        vos soumissions, planifier et envoyer des messages de relance, et afficher les statistiques qui en découlent.
        Nous ne vendons aucune donnée et ne l&apos;utilisons pas à des fins publicitaires.
      </p>

      <h2>Consentement pour rejoindre vos clients</h2>
      <p>
        Avant qu&apos;un courriel ou SMS automatique soit envoyé à l&apos;un de vos clients, TrackQuo exige que vous
        ayez enregistré le consentement explicite de ce client pour ce canal. Il est de votre responsabilité
        d&apos;obtenir ce consentement auprès de vos propres clients avant de l&apos;activer dans l&apos;application.
      </p>

      <h2>Où sont stockées les données</h2>
      <p>
        Les données de l&apos;application sont stockées dans une base de données PostgreSQL hébergée au Canada
        (Supabase, région de Montréal). L&apos;application elle-même tourne sur l&apos;infrastructure de Vercel. Si
        vous branchez un vrai fournisseur de courriel ou SMS, ce fournisseur traitera aussi le contenu des messages
        envoyés par son intermédiaire.
      </p>

      <h2>Conservation et suppression</h2>
      <p>
        Les données sont conservées tant que votre compte est actif. Vous pouvez supprimer une fiche client en tout
        temps depuis la page Clients, et supprimer complètement le compte de votre entreprise (ce qui retire toutes
        les données associées) depuis les Paramètres. Pour demander une suppression ou une exportation de vos
        données en dehors de l&apos;application, contactez-nous à l&apos;adresse ci-dessous.
      </p>

      <h2>Témoins (cookies)</h2>
      <p>
        Nous utilisons deux témoins : un pour vous garder connecté (httpOnly, requis pour le fonctionnement de
        l&apos;application) et un pour retenir votre préférence de langue. Aucun n&apos;est utilisé à des fins
        publicitaires ou de pistage entre sites.
      </p>

      <h2>Contact</h2>
      <p>
        Questions à propos de cette politique ou de vos données : contactez l&apos;équipe via l&apos;adresse courriel
        fournie lors de votre invitation.
      </p>
    </LegalPageShell>
  );
}
