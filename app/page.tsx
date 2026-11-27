"use client";

import { useState } from "react";
import { ShoppingBag, Truck, ShieldCheck, MessageCircle, ChevronDown } from "lucide-react";

const colors = [
  { name: "Camel", hex: "#b98253" },
  { name: "Bleu marine", hex: "#17243d" },
  { name: "Kaki", hex: "#68704b" },
  { name: "Chocolat", hex: "#503326" },
  { name: "Noir", hex: "#171717" },
];
const sizes = ["M", "L", "XL", "XXL"];

export default function Home() {
  const [color, setColor] = useState(colors[0].name);
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "212612203744";
  const message = `Bonjour Moustapha Shop, je souhaite commander la veste simili cuir. Couleur: ${color}, Taille: ${size}, Quantité: ${quantity}. Prix: 150 DH.`;
  const whatsappUrl = phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return <main>
    <div className="announcement">LIVRAISON PARTOUT AU MAROC · OFFRE LIMITÉE</div>
    <header className="header"><a className="brand" href="#">MOUSTAPHA<span>SHOP</span></a><a className="header-cta" href="#commander"><ShoppingBag size={17}/> Commander</a></header>
    <section className="hero wrap">
      <div className="visual"><div className="visual-tag">NOUVELLE COLLECTION</div><div className="jacket-placeholder"><span>VOTRE PHOTO PRODUIT</span><small>Ajouter les photos de la veste dans /public/products</small></div><div className="visual-foot">MOUSTAPHA SHOP · WOMEN&apos;S EDITION</div></div>
      <div className="details"><p className="eyebrow">LA PIÈCE INDISPENSABLE</p><h1>Le style qui<br/><em>fait la différence.</em></h1><p className="intro">La veste simili cuir qui apporte une touche chic à toutes vos tenues. Facile à porter, facile à associer.</p><div className="price-line"><strong>150 DH</strong><del>250 DH</del><span>-40%</span></div><p className="micro">Vous économisez 100 DH</p>
        <div className="selector"><div className="selector-head"><b>Couleur</b><span>{color}</span></div><div className="swatches">{colors.map(c=><button key={c.name} aria-label={c.name} title={c.name} onClick={()=>setColor(c.name)} className={color===c.name?"swatch selected":"swatch"} style={{background:c.hex}} />)}</div></div>
        <div className="selector"><div className="selector-head"><b>Taille</b><span>{size}</span></div><div className="sizes">{sizes.map(s=><button key={s} onClick={()=>setSize(s)} className={size===s?"size selected":"size"}>{s}</button>)}</div></div>
        <div className="selector"><div className="selector-head"><b>Quantité</b></div><div className="quantity"><button onClick={()=>setQuantity(Math.max(1,quantity-1))}>−</button><span>{quantity}</span><button onClick={()=>setQuantity(quantity+1)}>+</button></div></div>
        <a id="commander" className="order-button" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={19}/> Commander sur WhatsApp</a>
        <div className="trust"><span><Truck size={17}/> Livraison Maroc</span><span><ShieldCheck size={17}/> Paiement à la livraison</span></div>
      </div>
    </section>
    <section className="benefits wrap"><div><b>Un look affirmé</b><p>Une coupe facile à porter au quotidien.</p></div><div><b>Plusieurs coloris</b><p>Choisissez la teinte qui vous ressemble.</p></div><div><b>Tailles M à XXL</b><p>Un choix de tailles pour votre confort.</p></div></section>
    <footer>© {new Date().getFullYear()} Moustapha Shop · Casablanca, Maroc</footer>
  </main>;
}
