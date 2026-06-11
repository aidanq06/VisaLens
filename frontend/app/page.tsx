import Link from "next/link";
import { sampleOpportunities } from "@/data/mockAnalysis";

export default function Home() {
  return (
    <div style={{ background: "#080910", minHeight: "100vh", color: "#e4e6f0" }}>
      {/* Radial glow */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(245,166,35,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Nav */}
      <nav
        style={{ borderBottom: "1px solid #1a1d2a", position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}>
            <span style={{ color: "#f5a623", fontSize: "14px" }}>◈</span>
          </div>
          <span style={{ fontWeight: "500", letterSpacing: "-0.01em", fontSize: "14px", color: "#e4e6f0" }}>VisaLens</span>
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", color: "#f5a623", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", fontFamily: "var(--font-mono)" }}>AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <span style={{ fontSize: "12px", color: "#7a7f99", fontFamily: "var(--font-mono)" }}>Risk Engine for International Students</span>
          <Link href="/radar" style={{ fontSize: "12px", color: "#7a7f99", textDecoration: "none", fontFamily: "var(--font-mono)" }}>
            Radar
          </Link>
          <Link href="/scan" style={{ fontSize: "12px", padding: "8px 16px", borderRadius: "10px", background: "#f5a623", color: "#080910", fontWeight: "600", textDecoration: "none" }}>
            Analyze →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 10, paddingTop: "96px", paddingBottom: "80px", textAlign: "center", maxWidth: "896px", margin: "0 auto", padding: "96px 24px 80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "999px", color: "#f5a623", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", fontFamily: "var(--font-mono)", fontSize: "12px", marginBottom: "32px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f5a623" }} />
          AI-powered eligibility risk analysis
        </div>

        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(48px, 8vw, 80px)", lineHeight: "1.06", color: "#e4e6f0", marginBottom: "24px" }}>
          Don&apos;t lose the
          <br />
          <em style={{ color: "#f5a623" }}>opportunity</em>
          <br />
          after finding it.
        </h1>

        <p style={{ fontSize: "18px", lineHeight: "1.7", maxWidth: "620px", margin: "0 auto 40px", color: "#7a7f99" }}>
          One workflow for international students: the Radar discovers fresh
          internships straight from company career feeds, VisaLens scores your
          eligibility risk on each one, the Action Queue tells you what to do
          first today — and when the organizer replies, your case updates with
          the blockers resolved.
        </p>

        <div style={{ display: "flex", flexDirection: "row", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/radar" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: "600", background: "#f5a623", color: "#080910", textDecoration: "none" }}>
            Find Internships <span>→</span>
          </Link>
          <Link href="/scan" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: "600", color: "#f5a623", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.3)", textDecoration: "none" }}>
            Analyze an Opportunity
          </Link>
          <Link href="/results?demo=true" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", borderRadius: "12px", fontSize: "15px", color: "#7a7f99", background: "#0f1018", border: "1px solid #252838", textDecoration: "none" }}>
            See demo results
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section style={{ position: "relative", zIndex: 10, padding: "0 24px 80px", maxWidth: "1024px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", borderRadius: "16px", overflow: "hidden", background: "#252838" }}>
          {[
            { step: "01", title: "Radar finds roles early", desc: "Company career feeds are monitored directly, so internships surface here before public job boards — each scored for fit and urgency.", icon: "◉" },
            { step: "02", title: "AI extracts, rules decide", desc: 'Phrases like "eligible to work in the U.S." are extracted as evidence; a deterministic rule engine scores the risk — every point auditable.', icon: "◎" },
            { step: "03", title: "Action Queue ranks your day", desc: "Every role is classified: apply now, verify first, ask your DSO, or likely blocked — with the reasons and next steps spelled out.", icon: "◈" },
            { step: "04", title: "Verify, update, decide", desc: "Send the generated organizer email, paste the reply, and watch the case update: blockers resolved, score recalculated, decision clearer.", icon: "✓" },
          ].map(({ step, title, desc, icon }) => (
            <div key={step} style={{ padding: "32px 28px", background: "#0f1018" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "20px", color: "#f5a623" }}>{icon}</span>
                <span style={{ fontSize: "11px", color: "#484d66", fontFamily: "var(--font-mono)" }}>{step}</span>
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "500", color: "#e4e6f0", marginBottom: "8px" }}>{title}</h3>
              <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#7a7f99" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk signals */}
      <section style={{ position: "relative", zIndex: 10, padding: "0 24px 80px", maxWidth: "1024px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#484d66", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>Risk Signals</p>
          <h2 style={{ fontSize: "20px", fontWeight: "500", color: "#e4e6f0" }}>What VisaLens detects</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {[
            { phrase: '"Must be eligible to work in the U.S."', risk: "high", label: "Work authorization required" },
            { phrase: '"U.S. citizens or permanent residents only"', risk: "high", label: "Citizenship restriction" },
            { phrase: '"Paid internship"', risk: "medium_high", label: "Paid role — work auth may apply" },
            { phrase: '"NSF-funded"', risk: "medium_high", label: "Federal funding restriction" },
            { phrase: '"Open worldwide"', risk: "low", label: "International students welcome" },
            { phrase: '"No work authorization required"', risk: "low", label: "Explicitly eligible" },
          ].map(({ phrase, risk, label }) => {
            const c = risk === "high" ? "#ef4343" : risk === "medium_high" ? "#f5a623" : "#2ecc71";
            return (
              <div key={phrase} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", borderRadius: "12px", background: "#0f1018", border: "1px solid #1e2130" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}70`, flexShrink: 0, marginTop: "6px" }} />
                <div>
                  <p style={{ fontSize: "12px", color: c, fontFamily: "var(--font-mono)", marginBottom: "2px" }}>{phrase}</p>
                  <p style={{ fontSize: "12px", color: "#7a7f99" }}>{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sample opportunities */}
      <section style={{ position: "relative", zIndex: 10, padding: "0 24px 80px", maxWidth: "1024px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#484d66", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>Demo Cases</p>
          <h2 style={{ fontSize: "20px", fontWeight: "500", color: "#e4e6f0" }}>See VisaLens in action</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {sampleOpportunities.map((opp) => {
            const c = opp.category === "internship" ? "#f5a623" : opp.category === "research" ? "#ef4343" : "#2ecc71";
            return (
              <Link key={opp.id} href="/results?demo=true" style={{ padding: "16px", borderRadius: "12px", display: "block", background: "#0f1018", border: "1px solid #252838", textDecoration: "none" }}>
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", color: c, background: `${c}15`, border: `1px solid ${c}30`, fontFamily: "var(--font-mono)", textTransform: "capitalize" }}>{opp.category}</span>
                </div>
                <h3 style={{ fontSize: "13px", fontWeight: "500", color: "#e4e6f0", marginBottom: "8px" }}>{opp.title}</h3>
                <p style={{ fontSize: "12px", lineHeight: "1.5", color: "#7a7f99", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{opp.text}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                  {opp.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", color: "#484d66", background: "#161823", fontFamily: "var(--font-mono)" }}>{tag}</span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 10, padding: "28px 24px", textAlign: "center", borderTop: "1px solid #1a1d2a" }}>
        <p style={{ fontSize: "12px", color: "#484d66" }}>VisaLens AI — For informational purposes only. Not legal or immigration advice.</p>
      </footer>
    </div>
  );
}
