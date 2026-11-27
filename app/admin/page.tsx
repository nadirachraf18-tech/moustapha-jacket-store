"use client";
import { useEffect, useMemo, useState } from "react";

type Variant = { id:string; color_name:string; size:string; stock_quantity:number };
type Order = { id:string; order_number:number; customer_name:string; phone:string; city:string; address:string; status:string; total:number; created_at:string; color_name:string; size:string; quantity:number };
const statuses = ["pending","confirmed","preparing","shipped","delivered","cancelled"];
const labels:Record<string,string> = {pending:"En attente",confirmed:"Confirmée",preparing:"En préparation",shipped:"Expédiée",delivered:"Livrée",cancelled:"Annulée"};
const colors:Record<string,string> = {"Camel":"#b98559","Bleu marine":"#17263e","Kaki":"#68734b","Chocolat":"#503528","Noir":"#191919"};

export default function AdminPage() {
  const [variants,setVariants]=useState<Variant[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [saving,setSaving]=useState("");
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [activeTab,setActiveTab]=useState("overview");
  async function load(){
    setLoading(true); setError("");
    try { const r=await fetch("/api/admin",{cache:"no-store"}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Accès refusé"); setVariants(d.variants||[]); setOrders(d.orders||[]); }
    catch(e){setError(e instanceof Error?e.message:"Erreur de chargement");}
    finally{setLoading(false);}
  }
  useEffect(()=>{load();},[]);
  async function updateStock(v:Variant, stock:number){
    setSaving(v.id); setError("");
    try { const r=await fetch("/api/admin",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"stock",variantId:v.id,stock})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Erreur de sauvegarde"); await load(); }
    catch(e){setError(e instanceof Error?e.message:"Erreur");} finally{setSaving("");}
  }
  async function updateStatus(o:Order,status:string){
    setSaving(o.id); setError("");
    try { const r=await fetch("/api/admin",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"status",orderId:o.id,status})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Erreur de mise à jour"); await load(); }
    catch(e){setError(e instanceof Error?e.message:"Erreur");} finally{setSaving("");}
  }
  const totalStock=variants.reduce((n,v)=>n+v.stock_quantity,0);
  const pending=orders.filter(o=>["pending","confirmed","preparing"].includes(o.status)).length;
  const lowStock=variants.filter(v=>v.stock_quantity>0&&v.stock_quantity<=3).length;
  const filteredOrders=useMemo(()=>orders.filter(o=>(statusFilter==="all"||o.status===statusFilter)&&[o.customer_name,o.phone,o.city,String(o.order_number)].join(" ").toLowerCase().includes(search.toLowerCase())),[orders,statusFilter,search]);
  const grouped=useMemo(()=>Object.entries(variants.reduce((acc,v)=>{(acc[v.color_name]??=[]).push(v);return acc;},{} as Record<string,Variant[]>)),[variants]);
  return <main className="admin-shell admin-v2">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/">MOUSTAPHA<span>SHOP</span></a>
      <p className="side-label">ESPACE BOUTIQUE</p>
      <a className={activeTab==="overview"?"side-link active":"side-link"} href="#overview" onClick={()=>setActiveTab("overview")}><i>▦</i> Vue générale</a>
      <a className={activeTab==="products"?"side-link active":"side-link"} href="#products" onClick={()=>setActiveTab("products")}><i>◇</i> Produits & stock</a>
      <a className={activeTab==="orders"?"side-link active":"side-link"} href="#orders" onClick={()=>setActiveTab("orders")}><i>▤</i> Commandes <b className="nav-count">{pending}</b></a>
      <div className="sidebar-bottom"><span className="online-dot"/> Boutique connectée<br/><small>Administration sécurisée</small></div>
    </aside>
    <section className="admin-main" id="overview">
      <header className="admin-top admin-top-v2"><div><span className="admin-kicker">TABLEAU DE BORD / MOUSTAPHA SHOP</span><h1>Bonjour, bienvenue 👋</h1><p>Voici un aperçu de votre boutique aujourd'hui.</p></div><div className="top-actions"><button className="refresh-button" onClick={load} disabled={loading}>↻ Actualiser</button><a className="store-link" href="/" target="_blank">Voir la boutique ↗</a></div></header>
      {error&&<p className="form-error admin-alert">{error}</p>}
      <div className="welcome-strip"><div><span className="strip-eyebrow">PRODUIT EN VEDETTE</span><strong>Veste simili cuir</strong><small>Collection femme · 5 couleurs · 4 tailles</small></div><div className="strip-price"><strong>150 DH</strong><del>250 DH</del><span>-40%</span></div></div>
      <div className="section-title"><div><span className="admin-kicker">VOTRE ACTIVITÉ</span><h2>Vue d'ensemble</h2></div><span className="live-label"><i/> Données en direct</span></div>
      <div className="stat-grid stat-grid-v2">
        <article className="stat-card"><div className="stat-icon pink-icon">◇</div><span>Variantes produit</span><strong>{variants.length}</strong><small>5 couleurs · 4 tailles</small></article>
        <article className="stat-card"><div className="stat-icon green-icon">▤</div><span>Stock disponible</span><strong>{totalStock}</strong><small>Unités en inventaire</small></article>
        <article className="stat-card"><div className="stat-icon blue-icon">♧</div><span>Commandes reçues</span><strong>{orders.length}</strong><small>Total des commandes</small></article>
        <article className="stat-card"><div className="stat-icon amber-icon">◷</div><span>À traiter</span><strong>{pending}</strong><small>Demandent votre attention</small></article>
      </div>
      <section className="admin-panel panel-v2" id="products">
        <div className="panel-head"><div><span className="admin-kicker">GESTION DES QUANTITÉS</span><h2>Stock par couleur et taille</h2><p>Modifiez les quantités disponibles. Les ventes confirmées mettent le stock à jour.</p></div><span className="inventory-total">{totalStock} unités</span></div>
        {lowStock>0&&<div className="stock-warning">⚠ {lowStock} variante(s) ont un stock faible (3 unités ou moins).</div>}
        {loading?<p>Chargement du stock…</p>:<div className="stock-groups">{grouped.map(([color,items])=><article className="stock-color-card" key={color}><div className="stock-color-head"><span className="color-dot" style={{background:colors[color]||"#aaa"}}/><strong>{color}</strong><small>{items.reduce((n,v)=>n+v.stock_quantity,0)} en stock</small></div><div className="size-stock-grid">{items.sort((a,b)=>a.size.localeCompare(b.size)).map(v=><StockRow key={v.id} variant={v} busy={saving===v.id} onSave={n=>updateStock(v,n)}/>)}</div></article>)}</div>}
      </section>
      <section className="admin-panel panel-v2" id="orders">
        <div className="panel-head"><div><span className="admin-kicker">SUIVI COMMERCIAL</span><h2>Dernières commandes</h2><p>Consultez les commandes et mettez à jour leur statut.</p></div><span className="inventory-total">{orders.length} commande(s)</span></div>
        <div className="order-toolbar"><input className="order-search" placeholder="Rechercher nom, téléphone, ville, N°..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Tous les statuts</option>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></div>
        {loading?<p>Chargement des commandes…</p>:filteredOrders.length===0?<div className="empty-orders"><span>▤</span><strong>Aucune commande à afficher</strong><small>Les nouvelles commandes apparaîtront ici.</small></div>:<div className="orders-list">{filteredOrders.map(o=><article className="order-card order-card-v2" key={o.id}><div className="order-main-info"><b>Commande #{o.order_number}</b><strong>{o.customer_name}</strong><p>{o.phone} · {o.city}</p><small>{o.color_name} / {o.size} · Quantité {o.quantity}</small></div><div className="order-date">{new Date(o.created_at).toLocaleDateString("fr-FR")}</div><div className="order-actions"><strong>{Number(o.total).toFixed(0)} DH</strong><select className={`status-select status-${o.status}`} value={o.status} disabled={saving===o.id} onChange={e=>updateStatus(o,e.target.value)}>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></div></article>)}</div>}
      </section>
      <footer className="admin-footer">Moustapha Shop · Espace d'administration <span>Version 2.0</span></footer>
    </section>
  </main>;
}
function StockRow({variant,busy,onSave}:{variant:Variant;busy:boolean;onSave:(n:number)=>void}){
 const [value,setValue]=useState(String(variant.stock_quantity));
 useEffect(()=>setValue(String(variant.stock_quantity)),[variant.stock_quantity]);
 const qty=Number(value);
 return <div className="size-stock-item"><div><span className="size-label">{variant.size}</span><span className={`stock-state ${qty===0?"out":qty<=3?"low":"available"}`}>{qty===0?"Épuisé":qty<=3?"Stock faible":"Disponible"}</span></div><div className="stock-edit"><input aria-label={`Stock ${variant.color_name} taille ${variant.size}`} type="number" min="0" value={value} onChange={e=>setValue(e.target.value)}/><button disabled={busy||!Number.isInteger(qty)||qty<0||qty===variant.stock_quantity} onClick={()=>onSave(qty)}>{busy?"…":"Enregistrer"}</button></div></div>;
}
