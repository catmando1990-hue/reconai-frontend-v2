import { LegalPage } from "@/components/legal/legal-page";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="2026-01-09">
      <p>
        This Privacy Policy describes how <strong>[COMPANY_LEGAL_NAME]</strong>{" "}
        (&quot;ReconAI&quot;, &quot;we&quot;, &quot;us&quot;, or
        &quot;our&quot;) collects, uses, discloses, and protects information
        when you use the ReconAI Services.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>Account and Profile Information</h3>
      <ul>
        <li>
          Contact details (e.g., email address) and basic account identifiers.
        </li>
        <li>
          Authentication and security signals (e.g., login timestamps,
          device/browser metadata).
        </li>
      </ul>

      <h3>Financial Data You Authorize</h3>
      <p>
        If you choose to connect a financial account, we may receive financial
        data through a third-party provider such as Plaid. Depending on your
        permissions and products enabled, this may include account identifiers,
        balances, transactions, and other related information.
      </p>

      <h3>Usage and Device Information</h3>
      <ul>
        <li>Pages viewed, features used, and interaction events.</li>
        <li>
          Approximate location (derived from IP), device type, and browser
          information.
        </li>
      </ul>

      <h3>Cookies and Similar Technologies</h3>
      <p>
        We may use cookies and similar technologies to keep you signed in,
        maintain preferences, and understand service usage. You can control
        cookies through your browser settings.
      </p>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>
          Provide and operate the Services, including account access and core
          features.
        </li>
        <li>
          Process and present your financial information in dashboards, reports,
          and insights.
        </li>
        <li>Improve product performance, reliability, and security.</li>
        <li>
          Detect, prevent, and respond to fraud, abuse, or security incidents.
        </li>
        <li>
          Communicate with you about updates, service notices, and support.
        </li>
      </ul>

      <h2>3. AI-Assisted Processing</h2>
      <p>
        ReconAI may use AI-assisted techniques to classify and summarize
        information. AI outputs are informational only and require user review.
        We do not guarantee accuracy or completeness of AI-generated outputs.
      </p>

      <h2>4. How We Share Information</h2>
      <p>We may share information in the following circumstances:</p>
      <ul>
        <li>
          <strong>Service Providers:</strong> with vendors who process data on
          our behalf (e.g., hosting, analytics).
        </li>
        <li>
          <strong>Financial Integrations:</strong> with providers like Plaid to
          enable bank connectivity.
        </li>
        <li>
          <strong>Legal:</strong> to comply with law, respond to lawful
          requests, or protect rights and safety.
        </li>
        <li>
          <strong>Business Transfers:</strong> in connection with mergers,
          acquisitions, or asset transfers.
        </li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>
        We retain information as needed to provide the Services and comply with
        legal obligations. Retention periods depend on the nature of the data
        and your relationship with ReconAI. You may request deletion subject to
        applicable law and legitimate business needs.
      </p>

      <h2>6. Security</h2>
      <p>
        We use reasonable administrative, technical, and organizational measures
        to protect information. However, no method of transmission or storage is
        fully secure, and we cannot guarantee absolute security.
      </p>

      <h2>7. Your Choices and Rights</h2>
      <ul>
        <li>
          You may access and update your account information through your
          account settings.
        </li>
        <li>
          You may disconnect linked financial accounts (subject to provider
          constraints).
        </li>
        <li>
          You may request access, correction, or deletion of certain information
          by contacting us.
        </li>
      </ul>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        The Services are not directed to children under 13, and we do not
        knowingly collect personal information from children under 13.
      </p>

      <h2>9. International Users</h2>
      <p>
        If you access the Services from outside the United States, you
        understand that information may be processed and stored in the United
        States and other jurisdictions.
      </p>

      <h2>10. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If changes are
        material, we will provide notice as required by law. The effective date
        above reflects the latest version.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy questions or requests, contact:{" "}
        <strong>admin@reconaitechnology.com</strong>.
      </p>
    </LegalPage>
  );
}
