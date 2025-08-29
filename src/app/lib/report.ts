export function renderMonthlyReportHTML({
  businessName,
  monthLabel,
  highlights,
  keywords
}: {
  businessName: string;
  monthLabel: string;
  highlights: string[];
  keywords: { phrase: string; rank?: number | null }[];
}) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:720px;margin:auto;padding:24px">
    <h1>${businessName} — Local Visibility Report</h1>
    <div style="color:#666">${monthLabel}</div>
    <hr/>
    <h2>Highlights</h2>
    <ul>${highlights.map(h => `<li>${h}</li>`).join('')}</ul>
    <h2>Keyword Snapshot</h2>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
      <thead><tr><th align="left">Keyword</th><th>Rank</th></tr></thead>
      <tbody>
        ${keywords.map(k => `<tr><td>${k.phrase}</td><td>${k.rank ?? '-'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}
