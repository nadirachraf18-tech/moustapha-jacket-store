"use client";
import { useEffect, useState } from "react";

type Variant = { id:string; color_name:string; size:string; stock_quantity:number };
type Order = { id:string; order_number:number; customer_name:string; phone:string; city:string; address:string; status:string; total:number; created_at:string; color_name:string; size:string; quantity:number };
const statuses = ["pending","confirmed","preparing","shipped","delivered","cancelled"];
const labels:Record<string,string> = {pending:"En attente",confirmed:"Confirmée",preparing:"En préparation",shipped:"Expédiée",delivered:"Livrée",cancelled:"Annulée"};

export default function AdminPage() {
  const [variants,setVariants]=useState<Variant[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [saving,setSaving]=useState("");
  async function load(){
    setLoading(true); setError("");
    try { const r=await fetch("/api/admin",{cache:"no-store"}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Accès refusé"); setVariants(d.variants||[]); setOrders(d.orders||[]); }
    catch(e){setError(e instanceof Error?e.message:"Erreur de chargement");}
    finally{setLoading(false);}
  }
  useEffect(()=>{load();},[]);
  async function updateStock(v:Variant, stock:number){
    setSaving(v.id); setError("");
    try { const r=await fetch("/api/admin",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"stock",variantId:v.id,stock})}); const d=await r.json(); if(!r.ok) throw new Error(d.error); await load(); }
    catch(e){setError(e instanceof Error?e.message:"Erreur");} finally{setSaving("");}
  }
  async function updateStatus(o:Order,status:string){
    setSaving(o.id); setError("");
    try { const r=await fetch("/api/admin",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"status",orderId:o.id,status})}); const d=await r.json(); if(!r.ok) throw new Error(d.error); await load(); }
    catch(e){setError(e instanceof Error?e.message:"Erreur");} finally{setSaving("");}
  }
  const totalStock=variants.reduce((n,v)=>n+v.stock_quantity,0);
  return <main className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/">MOUSTAPHA<span>SHOP</span></a><p className="side-label">MENU PRINCIPAL</p><a className="side-link active" href="#overview">▦　Vue générale</a><a className="side-link" href="#products">◇　Produits & stock</a><a className="side-link" href="#orders">▤　Commandes</a><div className="sidebar-bottom">Espace administrateur<br/>Accès privé</div></aside>
    <section className="admin-main" id="overview"><header className="admin-top"><div><span className="admin-kicker">TABLEAU DE BORD</span><h1>Gestion de la boutique 👋</h1><p>Veste simili cuir · 150 DH au lieu de 250 DH</p></div><a className="logout-button" href="/">Voir la boutique</a></header>
      {error&&<p className="form-error">{error}</p>}
      <div className="stat-grid"><article className="stat-card"><span>Variantes</span><strong>{variants.length}</strong><small>5 couleurs · 4 tailles</small></article><article className="stat-card"><span>Stock disponible</span><strong>{totalStock}</strong><small>Unités toutes variantes</small></article><article className="stat-card"><span>Commandes</span><strong>{orders.length}</strong><small>Total enregistrées</small></article><article className="stat-card"><span>À traiter</span><strong>{orders.filter(o=>["pending","confirmed","preparing"].includes(o.status)).length}</strong><small>En attente de traitement</small></article></div>
      <section className="admin-panel" id="products"><div className="panel-head"><div><span className="admin-kicker">INVENTAIRE</span><h2>Stock par couleur et taille</h2></div><button className="logout-button" onClick={load}>Actualiser</button></div>
        {loading?<p>Chargement du stock…</p>:<div className="variant-table"><div className="variant-row variant-heading"><span>Couleur</span><span>Taille</span><span>Quantité</span><span>Action</span></div>{variants.map(v=><StockRow key={v.id} variant={v} busy={saving===v.id} onSave={n=>updateStock(v,n)}/>)}</div>}
      </section>
      <section className="admin-panel" id="orders"><div className="panel-head"><div><span className="admin-kicker">VENTES</span><h2>Commandes clients</h2></div></div>
        {orders.length===0?<p>Aucune commande pour le moment.</p>:<div className="orders-list">{orders.map(o=><article className="order-card" key={o.id}><div><b>Commande #{o.order_number}</b><p>{o.customer_name} · {o.phone}</p><p>{o.color_name} / {o.size} · Qté {o.quantity}</p><small>{o.city} — {o.address}</small></div><div className="order-actions"><strong>{Number(o.total).toFixed(0)} DH</strong><select value={o.status} disabled={saving===o.id} onChange={e=>updateStatus(o,e.target.value)}>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></div></article>)}</div>}
      </section>
    </section>
  </main>;
}
function StockRow({variant,busy,onSave}:{variant:Variant;busy:boolean;onSave:(n:number)=>void}){
 const [value,setValue]=useState(String(variant.stock_quantity));
 useEffect(()=>setValue(String(variant.stock_quantity)),[variant.stock_quantity]);
 return <div className="variant-row"><span>{variant.color_name}</span><span>{variant.size}</span><span><input aria-label="Quantité en stock" type="number" min="0" value={value} onChange={e=>setValue(e.target.value)} style={{width:78}}/></span><span><button className="logout-button" disabled={busy||!Number.isInteger(Number(value))||Number(value)<0} onClick={()=>onSave(Number(value))}>{busy?"…":"Enregistrer"}</button></span></div>;
}
