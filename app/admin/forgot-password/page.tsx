"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("nadirachraf18@gmail.com");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (result.error) setError(result.error.message || "Impossible d'envoyer le lien.");
      else setMessage("Si cette adresse est enregistrée, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte mail et vos spams.");
    } catch {
      setError("Une erreur est survenue. Réessayez dans quelques instants.");
    } finally { setBusy(false); }
  }

  return <main className="admin-auth"><form className="login-card" onSubmit={submit}>
    <div className="admin-mark">M<span>S</span></div><p className="admin-kicker">ESPACE PRIVÉ</p>
    <h1>Mot de passe oublié</h1>
    <p className="admin-sub">Entrez votre adresse e-mail. Nous vous enverrons un lien sécurisé pour choisir un nouveau mot de passe.</p>
    <label>Email professionnel<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
    {error && <p className="form-error">{error}</p>}
    {message && <p className="form-notice">{message}</p>}
    <button className="admin-submit" disabled={busy}>{busy?"Envoi...":"Envoyer le lien"}</button>
    <Link className="back-store" href="/admin/login">← Retour à la connexion</Link>
  </form></main>;
}
