"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage(""); setError("");
    if (!token) { setError("Lien invalide ou incomplet. Demandez un nouveau lien."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) setError(result.error.message || "Le lien a expiré ou n'est plus valide.");
      else setMessage("Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.");
    } catch {
      setError("Impossible de réinitialiser le mot de passe. Demandez un nouveau lien.");
    } finally { setBusy(false); }
  }

  return <main className="admin-auth"><form className="login-card" onSubmit={submit}>
    <div className="admin-mark">M<span>S</span></div><p className="admin-kicker">ESPACE PRIVÉ</p>
    <h1>Nouveau mot de passe</h1>
    <p className="admin-sub">Choisissez un mot de passe sécurisé pour votre espace d'administration.</p>
    <label>Nouveau mot de passe<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 caractères minimum" /></label>
    <label>Confirmer le mot de passe<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Répétez le mot de passe" /></label>
    {error && <p className="form-error">{error}</p>}
    {message && <p className="form-notice">{message}</p>}
    <button className="admin-submit" disabled={busy || !token}>{busy?"Mise à jour...":"Enregistrer le mot de passe"}</button>
    <Link className="back-store" href="/admin/login">← Retour à la connexion</Link>
  </form></main>;
}
