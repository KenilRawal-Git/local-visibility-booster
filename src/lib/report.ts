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
    <h1>${businessName} — Local Visibility Report</h1>
    <p>${monthLabel}</p>
    <ul>${highlights.map(h => `<li>${h}</li>`).join('')}</ul>
    <table border="1">
      ${keywords.map(k => `<tr><td>${k.phrase}</td><td>${k.rank ?? '-'}</td></tr>`).join('')}
    </table>
  `;
}
