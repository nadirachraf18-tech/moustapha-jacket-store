"use client";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Truck, ShieldCheck, MessageCircle } from "lucide-react";

const colors = [
 {name:"Camel",hex:"#b98253"},{name:"Bleu marine",hex:"#17243d"},{name:"Kaki",hex:"#68704b"},{name:"Chocolat",hex:"#503326"},{name:"Noir",hex:"#171717"}
];
const sizes=["M","L","XL","XXL"];
type Variant={id:string;color_name:string;color_image_url?:string|null;size:string;stock_quantity:number};
type Image={id:string;image_url:string;alt_text:string};
export default function Home(){
 const [color,setColor]=useState("Camel"),[size,setSize]=useState("M"),[quantity,setQuantity]=useState(1);
 const [variants,setVariants]=useState<Variant[]>([]),[images,setImages]=useState<Image[]>([]);
 const [form,setForm]=useState({customerName:"",phone:"",city:"",address:"",notes:""});
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [catalogLoaded,setCatalogLoaded]=useState(false);
 const variant=variants.find(v=>v.color_name===color&&v.size===size);
 const available=variant?.stock_quantity||0;
 const phone=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||"212612203744";
 useEffect(()=>{fetch("/api/catalog").then(r=>r.json()).then(d=>{setVariants(d.variants||[]);setImages(d.images||[]);}).catch(()=>{}).finally(()=>setCatalogLoaded(true));},[]);
 const productImage=variants.find(v=>v.color_name===color&&v.color_image_url)?.color_image_url||images[0]?.image_url;
 async function order(e:React.FormEvent){
  e.preventDefault();setNotice("");
  if(!variant){setNotice("Cette variante n'est pas disponible.");return;}
  if(quantity>available){setNotice("Stock insuffisant. Quantité disponible : "+available);return;}
  setBusy(true);
  try{
   const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({variantId:variant.id,quantity,...form})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Commande impossible");
   const msg=`Bonjour Moustapha Shop, ma commande #${d.order.order_number} est enregistrée. Veste simili cuir, couleur ${color}, taille ${size}, quantité ${quantity}. Total: ${d.order.total} DH. Nom: ${form.customerName}, téléphone: ${form.phone}, ville: ${form.city}, adresse: ${form.address}.`;
   window.open(`https://wa.me/${phone.replace(/\\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank","noopener,noreferrer");
   setNotice("Commande enregistrée ! Votre numéro est #"+d.order.order_number+". WhatsApp va s'ouvrir pour confirmation.");
   setForm({customerName:"",phone:"",city:"",address:"",notes:""});
   setVariants(old=>old.map(v=>v.id===variant.id?{...v,stock_quantity:v.stock_quantity-quantity}:v));
  }catch(err){setNotice(err instanceof Error?err.message:"Une erreur est survenue.");}
  finally{setBusy(false);}
 }
 const selectedColor=colors.find(c=>c.name===color)!;
 return <main>
  <div className="announcement">LIVRAISON PARTOUT AU MAROC · OFFRE LIMITÉE</div>
  <header className="header"><a className="brand" href="#">MOUSTAPHA<span>SHOP</span></a><a className="header-cta" href="#commander"><ShoppingBag size={17}/> Commander</a></header>
  <section className="hero wrap">
   <div className="visual"><div className="visual-tag">NOUVELLE COLLECTION</div>{productImage?<img src={productImage} alt={images[0]?.alt_text||"Veste simili cuir femme"} className="product-photo"/>:<div className="jacket-placeholder"><span>PHOTO PRODUIT À AJOUTER</span><small>Les photos seront ajoutées à la galerie produit</small></div>}<div className="visual-foot">MOUSTAPHA SHOP · WOMEN&apos;S EDITION</div></div>
   <div className="details"><p className="eyebrow">LA PIÈCE INDISPENSABLE</p><h1>Le style qui<br/><em>fait la différence.</em></h1><p className="intro">La veste simili cuir qui apporte une touche chic à toutes vos tenues. Facile à porter, facile à associer.</p><div className="price-line"><strong>150 DH</strong><del>250 DH</del><span>-40%</span></div><p className="micro">Vous économisez 100 DH</p>
    <div className="selector"><div className="selector-head"><b>Couleur</b><span>{color}</span></div><div className="swatches">{colors.map(c=><button key={c.name} aria-label={c.name} title={c.name} onClick={()=>setColor(c.name)} className={color===c.name?"swatch selected":"swatch"} style={{background:c.hex}}/>)}</div></div>
    <div className="selector"><div className="selector-head"><b>Taille</b><span>{size}</span></div><div className="sizes">{sizes.map(s=><button key={s} onClick={()=>setSize(s)} className={size===s?"size selected":"size"}>{s}</button>)}</div></div>
    <p className="micro">{!catalogLoaded?"Vérification du stock…":available>0?`${available} pièce(s) disponible(s) pour cette variante`:"Rupture de stock pour cette variante"}</p>
    <div className="selector"><div className="selector-head"><b>Quantité</b></div><div className="quantity"><button onClick={()=>setQuantity(Math.max(1,quantity-1))}>−</button><span>{quantity}</span><button onClick={()=>setQuantity(Math.min(Math.max(1,available),quantity+1))} disabled={quantity>=available}>+</button></div></div>
   </div>
  </section>
  <section className="order-section wrap" id="commander"><div className="order-intro"><p className="eyebrow">COMMANDE SÉCURISÉE</p><h2>Recevez votre veste</h2><p>Remplissez vos coordonnées. Votre commande sera enregistrée et WhatsApp s'ouvrira pour confirmer les détails.</p><div className="trust"><span><Truck size={17}/> Livraison Maroc</span><span><ShieldCheck size={17}/> Paiement à la livraison</span></div></div>
   <form className="order-form" onSubmit={order}><div className="form-summary"><b>{color} · {size} · {quantity} pièce(s)</b><strong>{quantity*150} DH</strong></div>
    <label>Nom complet<input required value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} placeholder="Votre nom"/></label>
    <label>Téléphone<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="06XXXXXXXX"/></label>
    <label>Ville<input required value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Votre ville"/></label>
    <label>Adresse de livraison<textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Quartier, rue, numéro…"/></label>
    <label>Remarque (facultatif)<input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Informations complémentaires"/></label>
    {notice&&<p className="form-notice">{notice}</p>}
    <button className="order-button" disabled={busy||!catalogLoaded||!variant||available<quantity}>{busy?"Enregistrement…":<><MessageCircle size={19}/> Confirmer ma commande</>}</button>
    <small>Prix : 150 DH · Livraison calculée selon la ville. Paiement à la livraison.</small>
   </form>
  </section>
  <section className="benefits wrap"><div><b>Un look affirmé</b><p>Une coupe facile à porter au quotidien.</p></div><div><b>Plusieurs coloris</b><p>Choisissez la teinte qui vous ressemble.</p></div><div><b>Tailles M à XXL</b><p>Un choix de tailles pour votre confort.</p></div></section>
  <footer>© {new Date().getFullYear()} Moustapha Shop · Casablanca, Maroc</footer>
 </main>;
}
