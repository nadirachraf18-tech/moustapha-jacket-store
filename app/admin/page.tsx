import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { signOut } from "./signout";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const session = await auth.getSession();
  if (!session) redirect("/admin/login");
  return <main className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/">MOUSTAPHA<span>SHOP</span></a><p className="side-label">MENU PRINCIPAL</p><a className="side-link active" href="/admin">▦　Vue générale</a><a className="side-link" href="/admin#products">◇　Produits & stock</a><a className="side-link" href="/admin#orders">▤　Commandes</a><a className="side-link" href="/admin#settings">⚙　Paramètres</a><div className="sidebar-bottom">Espace administrateur<br/>Accès privé</div></aside>
    <section className="admin-main"><header className="admin-top"><div><span className="admin-kicker">TABLEAU DE BORD</span><h1>Bonjour, {session.user.name || "Admin"} 👋</h1><p>Bienvenue dans la gestion de Moustapha Shop.</p></div><form action={signOut}><button className="logout-button">Déconnexion</button></form></header>
      <div className="stat-grid"><article className="stat-card"><span>Produits actifs</span><strong>1</strong><small>Veste simili cuir</small></article><article className="stat-card"><span>Variantes</span><strong>20</strong><small>5 couleurs · 4 tailles</small></article><article className="stat-card"><span>Commandes</span><strong>0</strong><small>En attente de ventes</small></article><article className="stat-card"><span>Prix promotionnel</span><strong>150 DH</strong><small>Au lieu de 250 DH</small></article></div>
      <section className="admin-panel" id="products"><div className="panel-head"><div><span className="admin-kicker">CATALOGUE</span><h2>Produit & stock</h2></div><span className="status-pill">Base Neon connectée</span></div><p>Le produit et ses 20 variantes sont créés dans la base de données. Les quantités sont actuellement à zéro et seront modifiables depuis le module de stock à finaliser.</p><div className="variant-table"><div className="variant-row variant-heading"><span>Couleur</span><span>Tailles</span><span>Stock initial</span></div>{["Camel","Bleu marine","Kaki","Chocolat","Noir"].map(c=><div className="variant-row" key={c}><span>{c}</span><span>M · L · XL · XXL</span><span>0 unité</span></div>)}</div></section>
      <section className="admin-panel" id="orders"><div className="panel-head"><div><span className="admin-kicker">VENTES</span><h2>Commandes</h2></div></div><p>Aucune commande enregistrée pour le moment. Le formulaire et le suivi des commandes restent à connecter.</p></section>
      <section className="admin-panel" id="settings"><div className="panel-head"><div><span className="admin-kicker">BOUTIQUE</span><h2>Paramètres</h2></div></div><p>Le numéro WhatsApp n’est pas encore configuré. Le prix et les frais de livraison sont enregistrés dans Neon.</p></section>
    </section>
  </main>;
}
