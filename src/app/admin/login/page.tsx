"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginCard() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.replace(params.get("next") || "/admin/intakes");
      router.refresh();
    } else {
      setError("That password isn't right.");
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <form className="ad-login-card" onSubmit={submit}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand.png" alt="Nebula Digital" />
      <h1>Intakes</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        autoComplete="current-password"
        disabled={busy}
      />
      <div className="ad-login-err">{error}</div>
      <button
        className="ad-btn ad-btn-solid"
        type="submit"
        disabled={busy || !password}
        style={{ width: "100%", justifyContent: "center", padding: "14px" }}
      >
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="ad">
      <div className="ad-login">
        <Suspense fallback={null}>
          <LoginCard />
        </Suspense>
      </div>
    </div>
  );
}
