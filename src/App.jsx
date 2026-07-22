const { useState } = React;

function getUKTax(gross) {
  let tax = 0;
  const pa = 12570;
  const taxable = Math.max(0, gross - pa);
  if (taxable > 0) tax += Math.min(taxable, 37700) * 0.20;
  if (taxable > 37700) tax += Math.min(taxable - 37700, 125140 - 37700) * 0.40;
  if (taxable > 125140) tax += (taxable - 125140) * 0.45;
  const ni = gross > 12570 ? Math.min(gross - 12570, 50270 - 12570) * 0.08 + Math.max(0, gross - 50270) * 0.02 : 0;
  return tax + ni;
}

function getUSTax(gross) {
  const deduction = 14600;
  const taxable = Math.max(0, gross - deduction);
  let tax = 0;
  const brackets = [[11600,0.10],[35550,0.12],[53375,0.22],[91425,0.24],[51775,0.32],[365625,0.35],[Infinity,0.37]];
  let rem = taxable;
  for (const [size, rate] of brackets) {
    if (rem <= 0) break;
    tax += Math.min(rem, size) * rate;
    rem -= size;
  }
  const fica = Math.min(gross, 168600) * 0.062 + gross * 0.0145;
  return tax + fica;
}

function getAUSTax(gross) {
  let tax = 0;
  const portions = [[18200,0],[26800,0.19],[90000,0.325],[55000,0.37],[Infinity,0.45]];
  let rem = gross;
  for (const [size, rate] of portions) {
    if (rem <= 0) break;
    tax += Math.min(rem, size) * rate;
    rem -= size;
  }
  const lito = gross <= 37500 ? 700 : gross <= 66667 ? Math.max(0, 700 - (gross-37500)*0.015) : 0;
  const medicare = gross > 26000 ? gross * 0.02 : 0;
  return Math.max(0, tax - lito) + medicare;
}

const fmt = (n, sym = "$") => sym + Math.round(n).toLocaleString();
const pct = n => (n * 100).toFixed(1) + "%";
const PERIODS = { annual: 1, monthly: 12, weekly: 52 };

const AED_RATES = { AED: 1, USD: 3.67, GBP: 4.65, EUR: 3.98, AUD: 2.43, INR: 0.044 };
const SYMBOLS = { AED: "AED ", USD: "$", GBP: "£", EUR: "€", AUD: "A$", INR: "₹" };

export default function UAESalaryCalculator() {
  const [salary, setSalary] = useState("120000");
  const [currency, setCurrency] = useState("AED");
  const [residency, setResidency] = useState("expat");
  const [period, setPeriod] = useState("annual");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const inputAmount = parseFloat(salary) || 0;
    const toAED = AED_RATES[currency];
    const grossAED = inputAmount * toAED;
    const socialInsurance = residency === "national" ? grossAED * 0.05 : 0;
    const gpssaEmployer = residency === "national" ? grossAED * 0.125 : 0;
    const takeHomeAED = grossAED - socialInsurance;
    const grossUSD = grossAED / AED_RATES.USD;
    const usTaxUSD = getUSTax(grossUSD);
    const ukTaxUSD = getUKTax(grossUSD * 1.27) / 1.27;
    const ausTaxRate = grossUSD > 0 ? getAUSTax(grossUSD * 1.55) / (grossUSD * 1.55) : 0;
    const periods = PERIODS[period];
    const sym = SYMBOLS[currency];
    setResult({
      grossAED, takeHomeAED, socialInsurance, gpssaEmployer,
      grossUSD, sym, currency, inputAmount, toAED, periods,
      perPeriod: { gross: inputAmount / periods, net: (takeHomeAED / toAED) / periods },
      comparisons: [
        { country: "🇦🇪 UAE (You)", taxUSD: 0, taxPct: 0, netUSD: grossUSD, color: "#d97706" },
        { country: "🇺🇸 USA (est.)", taxUSD: usTaxUSD, taxPct: usTaxUSD / grossUSD, netUSD: grossUSD - usTaxUSD, color: "#3b5bdb" },
        { country: "🇬🇧 UK (est.)", taxUSD: ukTaxUSD, taxPct: ukTaxUSD / grossUSD, netUSD: grossUSD - ukTaxUSD, color: "#dc2626" },
        { country: "🇦🇺 Australia (est.)", taxUSD: grossUSD * ausTaxRate, taxPct: ausTaxRate, netUSD: grossUSD * (1 - ausTaxRate), color: "#059669" },
      ],
    });
  };

  const inputStyle = { width: "100%", padding: "12px", border: "2px solid #fde68a", borderRadius: 10, fontSize: 16, boxSizing: "border-box", outline: "none" };
  const labelStyle = { display: "block", fontWeight: 600, marginBottom: 6, color: "#333" };
  const pl = { annual: "Annual", monthly: "Monthly", weekly: "Weekly" }[period];

  return (
    <div style={{ fontFamily: "'Segoe UI',Arial,sans-serif", background: "#fefce8", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🇦🇪</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#1a1a2e" }}>UAE Salary Calculator</h1>
          <p style={{ margin: "8px 0 0", color: "#555", fontSize: 16 }}>Zero income tax for expats — see exactly what you keep, and how much more than back home.</p>
        </div>

        <div style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", borderRadius: 16, padding: 24, marginBottom: 24, color: "#fff", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 4 }}>0% Income Tax</div>
          <div style={{ fontSize: 16, opacity: 0.9 }}>The UAE charges zero personal income tax. What you earn is what you keep.</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 20 }}>
            <div>
              <label style={labelStyle}>Gross Salary</label>
              <input type="number" value={salary} onChange={e => setSalary(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={inputStyle}>
                <option value="AED">AED (Dirhams)</option>
                <option value="USD">USD (US Dollars)</option>
                <option value="GBP">GBP (Pounds)</option>
                <option value="EUR">EUR (Euros)</option>
                <option value="AUD">AUD (Aus Dollars)</option>
                <option value="INR">INR (Indian Rupees)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Residency Type</label>
              <select value={residency} onChange={e => setResidency(e.target.value)} style={inputStyle}>
                <option value="expat">Expat / Foreign National</option>
                <option value="national">UAE National (GPSSA applies)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Frequency</label>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={inputStyle}>
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <button onClick={calculate} style={{ width: "100%", marginTop: 24, padding: "16px", background: "linear-gradient(135deg, #d97706, #b45309)", color: "#fff", border: "none", borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
            Calculate My UAE Take-Home
          </button>
        </div>

        {result && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: `${pl} Gross`, value: `${result.sym}${Math.round(result.perPeriod.gross).toLocaleString()}`, color: "#d97706", bg: "#fffbeb" },
                { label: `${pl} Take-Home`, value: `${result.sym}${Math.round(result.perPeriod.net).toLocaleString()}`, color: "#059669", bg: "#f0fdf4" },
                { label: "Income Tax", value: "AED 0 🎉", color: "#059669", bg: "#f0fdf4" },
                { label: "Effective Tax Rate", value: residency === "national" ? "5% (GPSSA)" : "0%", color: residency === "national" ? "#d97706" : "#059669", bg: "#fffbeb" },
              ].map((item, i) => (
                <div key={i} style={{ background: item.bg, borderRadius: 14, padding: 20, textAlign: "center", border: `2px solid ${item.color}22` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 4, fontWeight: 500 }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Annual Summary (AED)</h3>
                {[
                  { label: "Gross Salary", value: `AED ${Math.round(result.grossAED).toLocaleString()}`, bold: true },
                  { label: "Income Tax", value: "AED 0", color: "#059669" },
                  { label: residency === "national" ? "GPSSA (employee 5%)" : "Social Insurance", value: residency === "national" ? `−AED ${Math.round(result.socialInsurance).toLocaleString()}` : "AED 0 (expat exempt)", color: residency === "national" ? "#d97706" : "#059669" },
                  { label: "GPSSA (employer 12.5%)", value: residency === "national" ? `AED ${Math.round(result.gpssaEmployer).toLocaleString()} (employer pays)` : "N/A", color: "#888" },
                  { label: "Annual Take-Home", value: `AED ${Math.round(result.takeHomeAED).toLocaleString()}`, bold: true, color: "#059669", border: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderTop: row.border ? "2px solid #e9ecef" : "1px solid #f1f3f5", gap: 8 }}>
                    <span style={{ fontSize: 14, color: "#444", fontWeight: row.bold ? 700 : 400, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 600, color: row.color || "#222", textAlign: "right" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>🌍 Country Comparison</h3>
                <p style={{ margin: "0 0 16px", fontSize: 12, color: "#888" }}>Same salary, estimated tax in each country (USD equivalent)</p>
                {result.comparisons.map((c, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{c.country}</span>
                      <span style={{ fontSize: 13, color: c.taxPct > 0 ? "#dc2626" : "#059669", fontWeight: 700 }}>
                        {c.taxPct > 0 ? `−${pct(c.taxPct)} tax` : "0% tax ✓"}
                      </span>
                    </div>
                    <div style={{ height: 8, background: "#f1f3f5", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.max(2, (1 - c.taxPct) * 100)}%`, background: c.color, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>Keep: ${Math.round(c.netUSD).toLocaleString()} USD/yr</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>💡 Things to Know as a UAE Expat</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { icon: "💰", title: "Zero Income Tax", desc: "UAE has no personal income tax law. Expats keep 100% of their salary." },
                  { icon: "🏥", title: "Health Insurance", desc: "Employer-provided health insurance is mandatory in Dubai & Abu Dhabi." },
                  { icon: "🏠", title: "Housing Allowance", desc: "Many packages include a housing allowance (typically 25–35% of salary)." },
                  { icon: "✈️", title: "Annual Flights", desc: "Home flights are often included in package — factor into total comp." },
                  { icon: "🏦", title: "No Pension", desc: "UAE nationals have GPSSA. Expats must plan private retirement savings." },
                  { icon: "📊", title: "VAT Applies", desc: "5% VAT applies to most goods and services since 2018." },
                ].map((item, i) => (
                  <div key={i} style={{ padding: 16, background: "#fffbeb", borderRadius: 12, border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#333", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 12, padding: 16, fontSize: 13, color: "#664d03" }}>
              <strong>Note:</strong> Country comparisons are estimates using simplified tax models. Exchange rates are approximate. UAE salary packages often include non-cash benefits (housing, flights, schooling) not reflected here. Tax obligations may still exist in your home country on worldwide income — consult a tax adviser.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
