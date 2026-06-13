"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { saveProfile, signIn, signUp, type ProfileInput } from "@/lib/auth";
import { SCHOOLS } from "@/data/schools";

/** Profile data captured at signup that couldn't be written yet (no session
 *  until the email is confirmed) — applied on first sign-in. */
const PENDING_PROFILE_KEY = "visalens:pending-profile";

function SchoolSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (school: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = SCHOOLS.filter((s) =>
    s.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        required
        placeholder="Search for your school"
        value={open ? query : value}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        className="al-input"
        style={
          open
            ? {
                borderColor: "#D8C7A8",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }
            : undefined
        }
      />
      {open && (
        <>
          {/* Click-away catcher */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 19 }}
          />
          <ul className="al-dropdown">
            {filtered.length === 0 ? (
              <li className="al-dropdown-empty">No matching schools found</li>
            ) : (
              filtered.map((school) => (
                <li key={school}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(school);
                      setOpen(false);
                    }}
                    className="al-dropdown-option"
                    style={
                      school === value
                        ? { color: "#8A5600", fontWeight: 500 }
                        : undefined
                    }
                  >
                    {school}
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [tab, setTab] = useState<"signin" | "signup">(initialTab);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  function switchTab(next: "signin" | "signup") {
    setTab(next);
    setError(null);
    setSignedUp(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // Apply profile data captured at signup, if it couldn't be saved then.
    try {
      const raw = localStorage.getItem(PENDING_PROFILE_KEY);
      if (raw && data.user) {
        const pending = JSON.parse(raw) as ProfileInput;
        const { error: profileError } = await saveProfile(
          data.user.id,
          pending
        );
        if (!profileError) localStorage.removeItem(PENDING_PROFILE_KEY);
      }
    } catch {
      // Never block sign-in on profile bookkeeping.
    }
    router.push("/dashboard");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!school) {
      setError("Please select your school from the list.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { data, error } = await signUp(email, password);
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const profile: ProfileInput = {
      email,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      dob,
      school_name: school,
    };
    // Without a session (email confirmation pending) RLS blocks this write,
    // so stash the profile locally and apply it on first sign-in instead.
    let saved = false;
    if (data.user) {
      const { error: profileError } = await saveProfile(data.user.id, profile);
      saved = !profileError;
    }
    if (!saved) {
      try {
        localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(profile));
      } catch {
        // Storage unavailable — profile can be completed from the dashboard.
      }
    }

    setLoading(false);
    setSignedUp(true);
  }

  const isSignin = tab === "signin";

  return (
    <div className="al-page">
      <span className="al-bg" aria-hidden="true" />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="al-nav">
        <Link href="/" className="al-brand">
          <span className="al-brand-icon" aria-hidden="true">
            ◈
          </span>
          <span className="al-brand-name">VISALENS</span>
        </Link>
      </nav>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="al-main">
        <div className="al-card">
          {/* Header */}
          <div className="al-card-icon" aria-hidden="true">
            ◈
          </div>
          <h1 className="al-heading">
            {isSignin ? "Welcome back." : "Create your account."}
          </h1>
          <p className="al-subtext">
            {isSignin
              ? "Sign in to access your eligibility dashboard."
              : "Join VisaLens to track your opportunities."}
          </p>

          {/* Tab switcher */}
          <div className="al-tabs">
            {(
              [
                { key: "signin", label: "Sign In" },
                { key: "signup", label: "Create Account" },
              ] as const
            ).map(({ key, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchTab(key)}
                  className={`al-tab${active ? " al-tab-active" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {isSignin ? (
            <form onSubmit={handleSignIn} className="al-form">
              <div className="al-field">
                <label className="al-label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="al-input"
                  placeholder="you@school.edu"
                />
              </div>
              <div className="al-field">
                <label className="al-label">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="al-input"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="al-submit"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : signedUp ? (
            <div className="al-success">
              Check your email to confirm your account.
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="al-form">
              <div className="al-name-grid">
                <div className="al-field">
                  <label className="al-label">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="al-input"
                    placeholder="Jane"
                  />
                </div>
                <div className="al-field">
                  <label className="al-label">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="al-input"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="al-field">
                <label className="al-label">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="al-input"
                />
              </div>
              <div className="al-field">
                <label className="al-label">School</label>
                <SchoolSelect value={school} onChange={setSchool} />
              </div>
              <div className="al-field">
                <label className="al-label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="al-input"
                  placeholder="you@school.edu"
                />
              </div>
              <div className="al-field">
                <label className="al-label">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="al-input"
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="al-field">
                <label className="al-label">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="al-input"
                  placeholder="Re-enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="al-submit"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {error && <div className="al-error">{error}</div>}

          {/* Footer */}
          <div className="al-card-footer">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </main>

      <style jsx>{`
        .al-page {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #fbf8f1;
          color: #11100d;
        }
        .al-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: radial-gradient(
            circle,
            #ddd5c4 1px,
            transparent 1px
          );
          background-size: 32px 32px;
        }

        /* ── Nav ─────────────────────────────────────────────── */
        .al-nav {
          position: relative;
          z-index: 10;
          height: 56px;
          padding: 0 64px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          background: rgba(251, 248, 241, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #e8dfcf;
        }
        .al-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .al-brand-icon {
          color: #f5a91d;
          font-size: 18px;
          line-height: 1;
        }
        .al-brand-name {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #11100d;
        }

        /* ── Main ────────────────────────────────────────────── */
        .al-main {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }

        /* ── Card ────────────────────────────────────────────── */
        .al-card {
          width: 100%;
          max-width: 480px;
          padding: 40px;
          background: #fffdf8;
          border: 1px solid #e8dfcf;
          border-radius: 16px;
          box-shadow: 0 8px 40px rgba(17, 16, 13, 0.07);
        }
        .al-card-icon {
          text-align: center;
          color: #f5a91d;
          font-size: 20px;
          line-height: 1;
          margin-bottom: 16px;
        }
        .al-heading {
          margin: 0;
          font-family: var(--font-serif);
          font-size: 28px;
          font-weight: 500;
          text-align: center;
          color: #11100d;
        }
        .al-subtext {
          margin: 8px 0 0;
          font-size: 14px;
          color: #6f6a60;
          text-align: center;
        }

        /* ── Tabs ────────────────────────────────────────────── */
        .al-tabs {
          margin-top: 32px;
          display: flex;
          gap: 0;
          background: #f3efe6;
          border-radius: 8px;
          padding: 4px;
        }
        .al-tab {
          flex: 1;
          padding: 10px 0;
          text-align: center;
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 400;
          color: #6f6a60;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .al-tab-active {
          background: #fffdf8;
          border-color: #e8dfcf;
          color: #11100d;
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        }

        /* ── Form ────────────────────────────────────────────── */
        .al-form {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .al-name-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .al-field {
          display: flex;
          flex-direction: column;
        }
        .al-label {
          margin-bottom: 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #aaa398;
        }

        /* ── Buttons ─────────────────────────────────────────── */
        .al-submit {
          margin-top: 24px;
          width: 100%;
          padding: 13px;
          background: #f5a91d;
          color: #11100d;
          font-family: var(--font-sans);
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .al-submit:hover {
          background: #d4890f;
        }
        .al-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .al-submit:disabled:hover {
          background: #f5a91d;
        }

        /* ── Messages ────────────────────────────────────────── */
        .al-error {
          margin-top: 16px;
          padding: 10px 14px;
          background: #ffe8e8;
          border: 1px solid #f5c0c0;
          border-radius: 8px;
          font-size: 13px;
          color: #d83a3a;
        }
        .al-success {
          margin-top: 28px;
          padding: 16px;
          background: #e6f7ed;
          border: 1px solid #a8dfc0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #1d9a57;
          text-align: center;
        }

        /* ── Card footer ─────────────────────────────────────── */
        .al-card-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e8dfcf;
          text-align: center;
          font-size: 12px;
          color: #aaa398;
        }

        @media (max-width: 600px) {
          .al-nav {
            padding: 0 24px;
          }
          .al-card {
            padding: 28px 24px;
          }
        }
      `}</style>

      {/* Inputs and dropdown need global styles for focus / placeholder /
          hover pseudo-states and to reach the SchoolSelect subtree. */}
      <style jsx global>{`
        .al-input {
          width: 100%;
          background: #fbf8f1;
          border: 1px solid #e8dfcf;
          border-radius: 8px;
          padding: 11px 14px;
          font-size: 14px;
          color: #11100d;
          outline: none;
          font-family: var(--font-sans);
          transition: border-color 0.15s ease;
        }
        .al-input::placeholder {
          color: #aaa398;
        }
        .al-input:focus {
          border-color: #f5a91d;
          box-shadow: 0 0 0 3px rgba(245, 169, 29, 0.1);
        }

        .al-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          z-index: 20;
          max-height: 200px;
          overflow-y: auto;
          margin: 0;
          padding: 0;
          list-style: none;
          background: #fffdf8;
          border: 1px solid #e8dfcf;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .al-dropdown-option {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          font-family: var(--font-sans);
          font-size: 13px;
          color: #11100d;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .al-dropdown-option:hover {
          background: #fbf8f1;
        }
        .al-dropdown-empty {
          padding: 10px 14px;
          font-size: 13px;
          color: #aaa398;
        }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            background: "#FBF8F1",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#AAA398",
              fontFamily: "var(--font-mono)",
            }}
          >
            Loading...
          </p>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
