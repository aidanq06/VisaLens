"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { saveProfile, signIn, signUp, type ProfileInput } from "@/lib/auth";
import { SCHOOLS } from "@/data/schools";

/** Profile data captured at signup that couldn't be written yet (no session
 *  until the email is confirmed) — applied on first sign-in. */
const PENDING_PROFILE_KEY = "visalens:pending-profile";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#080910",
  border: "1px solid #252838",
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "13px",
  color: "#e4e6f0",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#484d66",
  fontFamily: "var(--font-mono)",
  marginBottom: "6px",
  display: "block",
};

function submitButtonStyle(loading: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    background: loading ? "#1e2130" : "#f5a623",
    color: loading ? "#484d66" : "#080910",
    border: "none",
    cursor: loading ? "wait" : "pointer",
  };
}

function SchoolSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (school: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hoverIdx, setHoverIdx] = useState(-1);

  const filtered = SCHOOLS.filter((s) =>
    s.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        required
        placeholder="Search for your school…"
        value={open ? query : value}
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setHoverIdx(-1);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setHoverIdx(-1);
        }}
        style={inputStyle}
      />
      {open && (
        <>
          {/* Click-away catcher */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 90 }}
          />
          <ul
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 95,
              maxHeight: "200px",
              overflowY: "auto",
              background: "#0f1018",
              border: "1px solid #252838",
              borderRadius: "10px",
              padding: "4px",
              margin: 0,
              listStyle: "none",
            }}
          >
            {filtered.length === 0 ? (
              <li
                style={{
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#7a7f99",
                }}
              >
                No matching schools found
              </li>
            ) : (
              filtered.map((school, i) => (
                <li key={school}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(school);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(-1)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      border: "none",
                      cursor: "pointer",
                      color: school === value ? "#f5a623" : "#e4e6f0",
                      background:
                        hoverIdx === i ? "rgba(245,166,35,0.1)" : "transparent",
                    }}
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

  return (
    <div style={{ background: "#080910", minHeight: "100vh", color: "#e4e6f0" }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: "1px solid #1a1d2a",
          display: "flex",
          alignItems: "center",
          padding: "18px 32px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          <span style={{ color: "#f5a623", fontSize: "16px" }}>◈</span>
          <span style={{ fontWeight: "500", fontSize: "14px", color: "#e4e6f0" }}>
            VisaLens
          </span>
        </Link>
      </nav>

      {/* Centered card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#0f1018",
            border: "1px solid #252838",
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "28px",
              background: "#080910",
              border: "1px solid #252838",
              borderRadius: "10px",
              padding: "4px",
            }}
          >
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
                  onClick={() => switchTab(key)}
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: "7px",
                    fontSize: "12px",
                    fontWeight: active ? "600" : "400",
                    color: active ? "#f5a623" : "#7a7f99",
                    background: active ? "rgba(245,166,35,0.1)" : "transparent",
                    border: `1px solid ${
                      active ? "rgba(245,166,35,0.3)" : "transparent"
                    }`,
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={submitButtonStyle(loading)}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          ) : signedUp ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: "22px", marginBottom: "12px" }}>✉️</p>
              <p style={{ fontSize: "14px", color: "#e4e6f0" }}>
                Check your email to confirm your account
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#7a7f99",
                  marginTop: "8px",
                }}
              >
                Once confirmed, visit your dashboard to complete your profile.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignUp}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>School</label>
                <SchoolSelect value={school} onChange={setSchool} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={submitButtonStyle(loading)}
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}

          {error && (
            <p
              style={{
                marginTop: "16px",
                fontSize: "12px",
                color: "#ef9a9a",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "rgba(239,67,67,0.06)",
                border: "1px solid rgba(239,67,67,0.25)",
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            background: "#080910",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#7a7f99",
              fontFamily: "var(--font-mono)",
            }}
          >
            Loading…
          </p>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
