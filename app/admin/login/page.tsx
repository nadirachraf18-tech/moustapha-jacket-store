"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const result = await authClient.signIn.email({email,password});
    setBusy(false);
    if (result.error) { setError(result.error.message || "Identifiants invalides."); return; }
    router.push("/admin"); router.refresh();
  }
  return <main className="admin-auth"><form className="login-card" onSubmit={submit}>
    <div className="admin-mark">M<span>S</span></div><p className="admin-kicker">ESPACE PRIVÉ</p><h1>Administration</h1>
    <p className="admin-sub">Connectez-vous pour gérer votre boutique.</p>
    <label>Email professionnel<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@votreboutique.ma"/></label>
    <label>Mot de passe<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••"/></label>
    {error && <p className="form-error">{error}</p>}
    <button className="admin-submit" disabled={busy}>{busy?"Connexion...":"Se connecter"}</button>
    <a className="back-store" href="/admin/forgot-password">Mot de passe oublié ?</a>
    <a className="back-store" href="/">← Retour à la boutique</a>
  </form></main>;
}
