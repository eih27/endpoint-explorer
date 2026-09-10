export function Disclaimer() {
  return (
    <footer className="border-t border-line pt-8 text-xs leading-relaxed text-ink-faint">
      <p className="max-w-3xl">
        Product concept built using synthetic data to explore how clinical trial teams might inspect
        endpoint behavior. Not for clinical or statistical decision-making. All participants,
        studies, sites, and scores shown here are generated locally and are not derived from real
        patient data. Descriptive figures are not statistical inference and imply no significance.
      </p>
      <p className="mt-3 text-ink-faint">
        Endpoint Explorer · prototype · {new Date().getFullYear()}
      </p>
    </footer>
  );
}
