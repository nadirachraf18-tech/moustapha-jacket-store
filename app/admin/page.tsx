"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type Variant = { id:string; product_name:string; color_name:string; color_image_url?:string|null; size:string; stock_quantity:number };
type Order = { id:string; order_number:number; customer_name:string; phone:string; city:string; address:string; notes?:string; status:string; total:number; subtotal?:number; delivery_fee?:number; created_at:string; product_name?:string; color_name:string; size:string; quantity:number };
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
  const router=useRouter();
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
  async function uploadColorPhoto(productName:string,colorName:string,file?:File){
    if(!file)return;
    const key=productName+"|||"+colorName;setSaving(key);setError("");
    try{
      if(!file.type.startsWith("image/"))throw new Error("Veuillez choisir une image.");
      const bitmap=await createImageBitmap(file);
      const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
      const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Compression image impossible.");
      ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
      const imageUrl=canvas.toDataURL("image/webp",0.82);
      const match=variants.find(v=>v.product_name===productName&&v.color_name===colorName);
      if(!match)throw new Error("Variante introuvable.");
      const response=await fetch("/api/admin/color-images",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:(match as any).product_id,colorName,imageUrl})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Enregistrement impossible.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Erreur d'envoi");}
    finally{setSaving("");}
  }
  function sendClientConfirmation(o:Order){
    const cleanPhone=String(o.phone||"").replace(/\\D/g,"");
    const clientPhone=cleanPhone.startsWith("0")?"212"+cleanPhone.slice(1):cleanPhone.startsWith("212")?cleanPhone:cleanPhone;
    if(!clientPhone){setError("Numéro de téléphone client invalide.");return;}
    const subtotal=Number(o.subtotal??(Number(o.total)-Number(o.delivery_fee||0)));
    const delivery=Number(o.delivery_fee??(Number(o.total)-subtotal));
    const message=[
      "🌸 *MOUSTAPHA SHOP — CONFIRMATION DE COMMANDE*",
      "",
      "Bonjour "+o.customer_name+",",
      "Nous vous confirmons la bonne réception de votre commande. ❤️",
      "",
      "📦 *DÉTAILS DE VOTRE COMMANDE*",
      "N° de commande : #"+o.order_number,
      "Article : "+(o.product_name||"Veste femme simili cuir"),
      "Couleur : "+(o.color_name||"—"),
      "Taille : "+(o.size||"—"),
      "Quantité : "+Number(o.quantity||1),
      "",
      "💰 *RÉCAPITULATIF*",
      "Sous-total : "+subtotal.toFixed(0)+" DH",
      "Livraison : "+delivery.toFixed(0)+" DH",
      "*Total à payer à la livraison : "+Number(o.total).toFixed(0)+" DH*",
      "",
      "🚚 Ville : "+o.city,
      "📍 Adresse : "+o.address,
      "",
      "Merci pour votre confiance ! Nous vous contacterons pour le suivi de votre livraison.",
      "*Moustapha Shop*"
    ].join("\\n");
    window.open("https://wa.me/"+clientPhone+"?text="+encodeURIComponent(message),"_blank","noopener,noreferrer");
  }
  async function updateStatus(o:Order,status:string){
    setSaving(o.id); setError("");
    try { const r=await fetch("/api/admin",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"status",orderId:o.id,status})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Erreur de mise à jour"); await load(); }
    catch(e){setError(e instanceof Error?e.message:"Erreur");} finally{setSaving("");}
  }
  const totalStock=variants.reduce((n,v)=>n+v.stock_quantity,0);
  const pending=orders.filter(o=>["pending","confirmed","preparing"].includes(o.status)).length;
  const lowStock=variants.filter(v=>v.stock_quantity>0&&v.stock_quantity<=3).length;
  const outOfStock=variants.filter(v=>v.stock_quantity===0).length;
  const revenue=orders.filter(o=>o.status!=="cancelled").reduce((sum,o)=>sum+Number(o.total||0),0);
  async function logout(){await authClient.signOut();router.push("/admin/login");router.refresh();}
  const filteredOrders=useMemo(()=>orders.filter(o=>(statusFilter==="all"||o.status===statusFilter)&&[o.customer_name,o.phone,o.city,String(o.order_number)].join(" ").toLowerCase().includes(search.toLowerCase())),[orders,statusFilter,search]);
  const grouped=useMemo(()=>Object.entries(variants.reduce((acc,v)=>{const key=v.product_name+"|||"+v.color_name;(acc[key]??=[]).push(v);return acc;},{} as Record<string,Variant[]>)),[variants]);
  return <main className="admin-shell admin-v2">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/">MOUSTAPHA<span>SHOP</span></a>
      <p className="side-label">ESPACE BOUTIQUE</p>
      <a className={activeTab==="overview"?"side-link active":"side-link"} href="#overview" onClick={()=>setActiveTab("overview")}><i>▦</i> Vue générale</a>
      <a className={activeTab==="products"?"side-link active":"side-link"} href="#products" onClick={()=>setActiveTab("products")}><i>◇</i> Produits & stock</a>
      <a className={activeTab==="orders"?"side-link active":"side-link"} href="#orders" onClick={()=>setActiveTab("orders")}><i>▤</i> Commandes <b className="nav-count">{pending}</b></a>
      <a className={activeTab==="photos"?"side-link active":"side-link"} href="#photos" onClick={()=>setActiveTab("photos")}><i>▧</i> Photos produit</a>
      <a className="side-link" href="/admin/manage"><i>⚙</i> Gestion complète</a>
      <button className="side-logout" onClick={logout}>↪ Déconnexion</button>
      <div className="sidebar-bottom"><span className="online-dot"/> Boutique connectée<br/><small>Administration sécurisée</small></div>
    </aside>
    <section className="admin-main" id="overview">
      <header className="admin-top admin-top-v2"><div><span className="admin-kicker">TABLEAU DE BORD / MOUSTAPHA SHOP</span><h1>Bonjour, bienvenue 👋</h1><p>Voici un aperçu de votre boutique aujourd'hui.</p></div><div className="top-actions"><span className="admin-user-chip">● Admin connecté</span><button className="refresh-button" onClick={load} disabled={loading}>↻ Actualiser</button><a className="store-link" href="/" target="_blank">Voir la boutique ↗</a></div></header>
      {error&&<p className="form-error admin-alert">{error}</p>}
      <div className="welcome-strip"><div><span className="strip-eyebrow">PRODUIT EN VEDETTE</span><strong>Veste simili cuir</strong><small>Collection femme · 5 couleurs · 4 tailles</small></div><div className="strip-price"><strong>150 DH</strong><del>250 DH</del><span>-40%</span></div></div>
      <div className="section-title"><div><span className="admin-kicker">VOTRE ACTIVITÉ</span><h2>Vue d'ensemble</h2></div><span className="live-label"><i/> Données en direct</span></div>
      <div className="stat-grid stat-grid-v2">
        <article className="stat-card"><div className="stat-icon pink-icon">◇</div><span>Variantes produit</span><strong>{variants.length}</strong><small>5 couleurs · 4 tailles</small></article>
        <article className="stat-card"><div className="stat-icon green-icon">▤</div><span>Stock disponible</span><strong>{totalStock}</strong><small>Unités en inventaire</small></article>
        <article className="stat-card"><div className="stat-icon blue-icon">♧</div><span>Commandes reçues</span><strong>{orders.length}</strong><small>Total des commandes</small></article>
        <article className="stat-card"><div className="stat-icon amber-icon">◷</div><span>À traiter</span><strong>{pending}</strong><small>Demandent votre attention</small></article>
        <article className="stat-card"><div className="stat-icon blue-icon">↗</div><span>Chiffre des commandes</span><strong>{revenue.toLocaleString("fr-FR")} DH</strong><small>Hors commandes annulées</small></article>
      </div>
      <section className="admin-panel panel-v2" id="products">
        <div className="panel-head"><div><span className="admin-kicker">GESTION DES QUANTITÉS</span><h2>Stock par couleur et taille</h2><p>Modifiez les quantités disponibles. Le stock de la variante commandée diminue automatiquement à chaque commande.</p></div><span className="inventory-total">{totalStock} unités</span></div>
        {lowStock>0&&<div className="stock-warning">⚠ {lowStock} variante(s) ont un stock faible (3 unités ou moins) · {outOfStock} variante(s) épuisée(s).</div>}
        {loading?<p>Chargement du stock…</p>:<div className="stock-groups">{grouped.map(([groupKey,items])=>{const [productName,color]=groupKey.split("|||");return <article className="stock-color-card" key={groupKey}><div className="stock-color-head"><label title={items[0]?.color_image_url?"Changer la photo":"Ajouter la photo du "+color} style={{position:"relative",display:"grid",placeItems:"center",width:48,height:54,flex:"0 0 48px",borderRadius:8,overflow:"hidden",background:"#f7f2f6",border:"1px solid #eadfe8",cursor:"pointer"}}>{items[0]?.color_image_url?<img className="stock-color-thumb" style={{width:"100%",height:"100%",objectFit:"cover"}} src={items[0].color_image_url} alt={color}/>:<span style={{fontSize:22,color:"#a34f80"}}>＋</span>}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!!saving} style={{display:"none"}} onChange={e=>{uploadColorPhoto(productName,color,e.target.files?.[0]);e.currentTarget.value="";}}/></label><strong>{productName} — {color}</strong><small>{items.reduce((n,v)=>n+v.stock_quantity,0)} en stock</small></div><div className="size-stock-grid">{items.sort((a,b)=>a.size.localeCompare(b.size)).map(v=><StockRow key={v.id} variant={v} busy={saving===v.id} onSave={n=>updateStock(v,n)}/>)}</div></article>})}</div>}
      </section>
      <ProductImagesManager />
      <section className="admin-panel panel-v2" id="orders">
        <div className="panel-head"><div><span className="admin-kicker">SUIVI COMMERCIAL</span><h2>Dernières commandes</h2><p>Consultez les commandes et mettez à jour leur statut.</p></div><span className="inventory-total">{orders.length} commande(s)</span></div>
        <div className="order-toolbar"><input className="order-search" placeholder="Rechercher nom, téléphone, ville, N°..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Tous les statuts</option>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></div>
        {loading?<p>Chargement des commandes…</p>:filteredOrders.length===0?<div className="empty-orders"><span>▤</span><strong>Aucune commande à afficher</strong><small>Les nouvelles commandes apparaîtront ici.</small></div>:<div className="orders-list">{filteredOrders.map(o=><article className="order-card order-card-v2" key={o.id}><div className="order-main-info"><b>Commande #{o.order_number}</b><strong>{o.customer_name}</strong><p>{o.phone} · {o.city}</p><small>{o.color_name} / {o.size} · Quantité {o.quantity}</small></div><div className="order-date">{new Date(o.created_at).toLocaleDateString("fr-FR")}</div><div className="order-actions"><strong>{Number(o.total).toFixed(0)} DH</strong><select className={`status-select status-${o.status}`} value={o.status} disabled={saving===o.id} onChange={e=>updateStatus(o,e.target.value)}>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select><button type="button" className="whatsapp-confirm-button" style={{background:"#25D366",color:"#fff",border:0,borderRadius:8,padding:"9px 12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",marginTop:6}} onClick={()=>sendClientConfirmation(o)} title="Ouvrir WhatsApp avec le message de confirmation prérempli">💬 Envoyer confirmation</button></div></article>)}</div>}
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


type ProductImage = { id:string; image_url:string; alt_text:string; sort_order:number };
function ProductImagesManager(){
 const [images,setImages]=useState<ProductImage[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 async function refresh(){
  setLoading(true);
  try{const r=await fetch("/api/admin/images",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Chargement impossible");setImages(d.images||[]);}
  catch(e){setError(e instanceof Error?e.message:"Erreur");}
  finally{setLoading(false);}
 }
 useEffect(()=>{refresh();},[]);
 async function compress(file:File){
  if(!file.type.startsWith("image/"))throw new Error("Veuillez choisir un fichier image.");
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Compression image impossible.");
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  return canvas.toDataURL("image/webp",0.82);
 }
 async function upload(files:FileList|null){
  if(!files?.length)return;
  setBusy(true);setError("");setNotice("");
  try{
   for(const file of Array.from(files)){
    if(images.length>=8)throw new Error("Maximum 8 photos par produit.");
    const imageUrl=await compress(file);
    const r=await fetch("/api/admin/images",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imageUrl,altText:file.name.replace(/\\.[^.]+$/,"")||"Veste simili cuir Moustapha Shop"})});
    const d=await r.json();if(!r.ok)throw new Error(d.error||"Échec du téléversement");
    setImages(old=>[...old,d.image]);
   }
   setNotice("Photos ajoutées avec succès. Elles sont maintenant visibles sur la boutique.");
  }catch(e){setError(e instanceof Error?e.message:"Erreur d'envoi");}
  finally{setBusy(false);}
 }
 async function action(imageId:string,kind:"delete"|"up"|"down"){
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/images",{method:kind==="delete"?"DELETE":"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(kind==="delete"?{imageId}:{imageId,direction:kind})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Action impossible");
   if(kind==="delete")setImages(old=>old.filter(x=>x.id!==imageId));else setImages(d.images||[]);
   setNotice(kind==="delete"?"Photo supprimée.":"Ordre des photos mis à jour.");
  }catch(e){setError(e instanceof Error?e.message:"Erreur");}
  finally{setBusy(false);}
 }
 return <section className="admin-panel panel-v2 image-manager" id="photos">
  <div className="panel-head"><div><span className="admin-kicker">GALERIE PRODUIT</span><h2>Photos de l'article</h2><p>Ajoutez jusqu'à 8 photos. La première photo sera l'image principale de la boutique.</p></div><span className="inventory-total">{images.length}/8 photos</span></div>
  <div className="image-upload-zone">
   <div className="upload-symbol">＋</div><strong>Ajouter des photos du produit</strong><small>JPG, PNG ou WebP · Compression automatique · 8 photos maximum</small>
   <label className="upload-button">{busy?"Traitement…":"Choisir des photos"}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy||images.length>=8} onChange={e=>{upload(e.target.files);e.currentTarget.value="";}} /></label>
  </div>
  {error&&<p className="form-error">{error}</p>}{notice&&<p className="form-notice">{notice}</p>}
  {loading?<p>Chargement des photos…</p>:images.length===0?<div className="empty-orders"><span>▧</span><strong>Aucune photo ajoutée</strong><small>Ajoutez vos premières photos pour remplacer l'image provisoire de la boutique.</small></div>:<div className="product-image-grid">{images.map((img,i)=><article className="product-image-card" key={img.id}><div className="product-image-preview"><img src={img.image_url} alt={img.alt_text}/>{i===0&&<span className="main-image-tag">PHOTO PRINCIPALE</span>}</div><div className="product-image-actions"><span>Photo {i+1}</span><div><button disabled={busy||i===0} onClick={()=>action(img.id,"up")} title="Monter">↑</button><button disabled={busy||i===images.length-1} onClick={()=>action(img.id,"down")} title="Descendre">↓</button><button className="delete-image" disabled={busy} onClick={()=>{if(confirm("Supprimer cette photo ?"))action(img.id,"delete");}}>Supprimer</button></div></div></article>)}</div>}
 </section>;
}
