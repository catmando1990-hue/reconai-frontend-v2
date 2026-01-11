export default function LegalPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Legal & Disclaimers</h1>
      <p className="mt-4 text-muted-foreground">
        This platform provides information, not professional advice.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-6 text-muted-foreground">
        <li>
          <strong>Bookkeeping:</strong> Informational only
        </li>
        <li>
          <strong>Accounting:</strong> Consult a licensed CPA
        </li>
        <li>
          <strong>Tax:</strong> Consult a CPA, EA, or tax attorney
        </li>
        <li>
          <strong>Legal:</strong> Consult a licensed attorney
        </li>
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">
        ReconAI is not a registered investment advisor, broker-dealer, or tax
        professional. All information provided is for informational purposes
        only.
      </p>
    </main>
  );
}
