import { getDictionary } from "@/lib/i18n";
import { LegalPageShell } from "@/components/shared/legal-page-shell";

export default async function TermsPage() {
  const { locale } = await getDictionary();

  if (locale === "en") {
    return (
      <LegalPageShell locale={locale} title="Terms of Use" updatedLabel="Last updated: August 18, 2026">
        <p>
          <strong>Draft notice:</strong> these terms describe how TrackQuo actually works today. They have not yet
          been reviewed by a lawyer — have them reviewed before relying on them for a paid, public launch.
        </p>

        <h2>What TrackQuo is</h2>
        <p>
          TrackQuo is a quote-follow-up and revenue-recovery tool for service businesses. It tracks quotes you send,
          schedules and sends follow-up messages, and reports on conversion. It is designed to work alongside your
          existing CRM and accounting software — it is not a replacement for either, and does not provide
          accounting, payroll, tax, or general project-management functionality.
        </p>

        <h2>Your responsibilities</h2>
        <ul>
          <li>You are responsible for the accuracy of the customer data you enter.</li>
          <li>You are responsible for obtaining valid consent from your customers before enabling automated email or SMS follow-up for them.</li>
          <li>You will not use TrackQuo to send unsolicited messages, spam, or content that violates applicable law.</li>
          <li>You are responsible for keeping your account credentials confidential.</li>
        </ul>

        <h2>No delivery or outcome guarantee</h2>
        <p>
          TrackQuo helps you schedule and send follow-up messages, but cannot guarantee delivery, that a customer
          will respond, or that a quote will convert. Message delivery depends on third-party providers (email/SMS)
          and factors outside our control.
        </p>

        <h2>Service availability</h2>
        <p>
          The service is provided on an &quot;as is&quot; basis during this development phase, without uptime
          guarantees. Features and pricing may change as the product evolves.
        </p>

        <h2>Account termination</h2>
        <p>
          You may delete your company account at any time from Settings, which permanently removes your data. We
          may suspend accounts used in violation of these terms.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the extent permitted by law, TrackQuo is not liable for indirect, incidental, or consequential damages
          arising from use of the service, including lost revenue from missed or failed follow-ups.
        </p>

        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the Province of Quebec, Canada.</p>
      </LegalPageShell>
    );
  }

  return (
    <LegalPageShell locale={locale} title="Conditions d'utilisation" updatedLabel="Dernière mise à jour : 18 août 2026">
      <p>
        <strong>Avis — version brouillon :</strong> ces conditions décrivent le fonctionnement réel de TrackQuo à
        cette étape. Elles n&apos;ont pas encore été révisées par un avocat — faites-les valider avant de vous en
        servir pour un lancement public payant.
      </p>

      <h2>Ce qu&apos;est TrackQuo</h2>
      <p>
        TrackQuo est un outil de suivi de soumissions et de récupération de revenu pour les entreprises de services.
        Il suit les soumissions que vous envoyez, planifie et envoie des messages de relance, et présente des
        statistiques de conversion. Il est conçu pour fonctionner aux côtés de votre CRM et de votre logiciel
        comptable existants — il ne remplace ni l&apos;un ni l&apos;autre, et n&apos;offre aucune fonctionnalité de
        comptabilité, de paie, de fiscalité ou de gestion de projet complète.
      </p>

      <h2>Vos responsabilités</h2>
      <ul>
        <li>Vous êtes responsable de l&apos;exactitude des données clients que vous saisissez.</li>
        <li>Vous êtes responsable d&apos;obtenir un consentement valide de vos clients avant d&apos;activer le suivi automatique par courriel ou SMS pour eux.</li>
        <li>Vous n&apos;utiliserez pas TrackQuo pour envoyer des messages non sollicités, du pourriel, ou du contenu contraire à la loi applicable.</li>
        <li>Vous êtes responsable de garder vos identifiants de compte confidentiels.</li>
      </ul>

      <h2>Aucune garantie de livraison ou de résultat</h2>
      <p>
        TrackQuo vous aide à planifier et envoyer des messages de suivi, mais ne peut garantir la livraison, qu&apos;un
        client répondra, ou qu&apos;une soumission se conclura en contrat. La livraison des messages dépend de
        fournisseurs tiers (courriel/SMS) et de facteurs hors de notre contrôle.
      </p>

      <h2>Disponibilité du service</h2>
      <p>
        Le service est offert &quot;tel quel&quot; durant cette phase de développement, sans garantie de temps de
        disponibilité. Les fonctionnalités et les prix peuvent évoluer avec le produit.
      </p>

      <h2>Résiliation de compte</h2>
      <p>
        Vous pouvez supprimer le compte de votre entreprise en tout temps depuis les Paramètres, ce qui retire vos
        données de façon permanente. Nous pouvons suspendre les comptes utilisés en violation de ces conditions.
      </p>

      <h2>Limitation de responsabilité</h2>
      <p>
        Dans la mesure permise par la loi, TrackQuo n&apos;est pas responsable des dommages indirects, accessoires ou
        consécutifs découlant de l&apos;utilisation du service, y compris la perte de revenu liée à des suivis
        manqués ou échoués.
      </p>

      <h2>Loi applicable</h2>
      <p>Ces conditions sont régies par les lois de la province de Québec, Canada.</p>
    </LegalPageShell>
  );
}
