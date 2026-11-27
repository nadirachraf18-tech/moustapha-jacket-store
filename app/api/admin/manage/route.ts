import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
const fail = (message:string,status=400) => NextResponse.json({error:message},{status});
const clean = (value:unknown,max=500) => String(value ?? "").trim().slice(0,max);

export async function GET() {
  const gate=await requireAdmin(); if(gate.response)return gate.response;
  try {
    const sql=neon(process.env.DATABASE_URL!);
    const [products,categories,promotions,banners,settings,customers,admins]=await Promise.all([
      sql`SELECT p.id,p.slug,p.name,p.description,p.regular_price,p.sale_price,p.is_active,p.category_id,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC`,
      sql`SELECT id,name,slug,description,is_active,sort_order FROM categories ORDER BY sort_order,name`,
      sql`SELECT id,code,discount_type,discount_value,min_order_amount,starts_at,ends_at,usage_limit,used_count,is_active FROM promotions ORDER BY created_at DESC`,
      sql`SELECT id,title,subtitle,image_url,cta_text,cta_url,is_active,sort_order FROM store_banners ORDER BY sort_order,created_at DESC`,
      sql`SELECT key,value FROM store_settings ORDER BY key`,
      sql`SELECT phone,customer_name,city,count(*)::int AS orders_count,sum(total)::numeric AS lifetime_value,max(created_at) AS last_order FROM orders GROUP BY phone,customer_name,city ORDER BY max(created_at) DESC LIMIT 300`,
      sql`SELECT id,name,email,role,banned,"createdAt" FROM neon_auth."user" WHERE role IN ('admin','superadmin') ORDER BY "createdAt"`
    ]);
    return NextResponse.json({products,categories,promotions,banners,settings,customers,admins});
  } catch { return fail("Impossible de charger les données de gestion",500); }
}

export async function POST(request:NextRequest) {
  const gate=await requireAdmin(); if(gate.response)return gate.response;
  try {
    const body=await request.json(), sql=neon(process.env.DATABASE_URL!);
    if(body.action==="product") {
      const name=clean(body.name,160), slug=clean(body.slug,180).toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,"");
      const regular=Number(body.regularPrice), sale=Number(body.salePrice);
      if(!name||!slug||!Number.isFinite(regular)||!Number.isFinite(sale)||regular<0||sale<0||sale>regular) return fail("Informations produit invalides.");
      const rows=await sql`INSERT INTO products(slug,name,description,regular_price,sale_price,is_active,category_id) VALUES(${slug},${name},${clean(body.description,3000)},${regular},${sale},true,${body.categoryId||null}) RETURNING id`;
      const productId=rows[0].id;
      const variants=Array.isArray(body.variants)?body.variants:[];
      for(const v of variants) {
        const color=clean(v.color,60), hex=/^#[0-9a-fA-F]{6}$/.test(String(v.hex||""))?v.hex:null;
        const size=clean(v.size,5), stock=Number(v.stock);
        if(!color||!["M","L","XL","XXL"].includes(size)||!Number.isInteger(stock)||stock<0) continue;
        await sql`INSERT INTO product_variants(product_id,color_name,color_hex,size,stock_quantity) VALUES(${productId},${color},${hex},${size},${stock}) ON CONFLICT(product_id,color_name,size) DO UPDATE SET stock_quantity=EXCLUDED.stock_quantity,color_hex=EXCLUDED.color_hex,updated_at=now()`;
      }
      return NextResponse.json({success:true,id:productId},{status:201});
    }
    if(body.action==="category") {
      const name=clean(body.name,100), slug=clean(body.slug||body.name,120).toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,"");
      if(!name||!slug)return fail("Nom de catégorie invalide.");
      const rows=await sql`INSERT INTO categories(name,slug,description) VALUES(${name},${slug},${clean(body.description,500)}) RETURNING id`;
      return NextResponse.json({success:true,id:rows[0].id},{status:201});
    }
    if(body.action==="promotion") {
      const code=clean(body.code,40).toUpperCase().replace(/\s+/g,"");
      const type=body.discountType==="fixed"?"fixed":"percentage", value=Number(body.discountValue), minimum=Number(body.minOrderAmount||0), limit=body.usageLimit?Number(body.usageLimit):null;
      if(!code||!Number.isFinite(value)||value<=0||(type==="percentage"&&value>100)||!Number.isFinite(minimum)||minimum<0||(limit!==null&&(!Number.isInteger(limit)||limit<1)))return fail("Paramètres de promotion invalides.");
      const rows=await sql`INSERT INTO promotions(code,discount_type,discount_value,min_order_amount,usage_limit,starts_at,ends_at,is_active) VALUES(${code},${type},${value},${minimum},${limit},${body.startsAt||null},${body.endsAt||null},true) RETURNING id`;
      return NextResponse.json({success:true,id:rows[0].id},{status:201});
    }
    if(body.action==="banner") {
      const rows=await sql`INSERT INTO store_banners(title,subtitle,image_url,cta_text,cta_url,is_active) VALUES(${clean(body.title,180)},${clean(body.subtitle,300)},${clean(body.imageUrl,2000)},${clean(body.ctaText,80)},${clean(body.ctaUrl,500)},true) RETURNING id`;
      return NextResponse.json({success:true,id:rows[0].id},{status:201});
    }
    return fail("Action inconnue.");
  } catch(e) { return fail(e instanceof Error&&e.message.includes("unique")?"Cette valeur existe déjà.":"Création impossible.",500); }
}

export async function PATCH(request:NextRequest) {
  const gate=await requireAdmin(); if(gate.response)return gate.response;
  try {
    const body=await request.json(), sql=neon(process.env.DATABASE_URL!);
    if(body.action==="product") {
      const id=clean(body.id,60), name=clean(body.name,160), slug=clean(body.slug,180), regular=Number(body.regularPrice), sale=Number(body.salePrice);
      if(!id||!name||!slug||!Number.isFinite(regular)||!Number.isFinite(sale)||regular<0||sale<0||sale>regular)return fail("Informations produit invalides.");
      const rows=await sql`UPDATE products SET name=${name},slug=${slug},description=${clean(body.description,3000)},regular_price=${regular},sale_price=${sale},is_active=${body.isActive===true},category_id=${body.categoryId||null},updated_at=now() WHERE id=${id} RETURNING id`;
      if(!rows.length)return fail("Produit introuvable.",404);
      return NextResponse.json({success:true});
    }
    if(body.action==="category") {
      const rows=await sql`UPDATE categories SET name=${clean(body.name,100)},description=${clean(body.description,500)},is_active=${body.isActive===true},updated_at=now() WHERE id=${body.id} RETURNING id`;
      if(!rows.length)return fail("Catégorie introuvable.",404);
      return NextResponse.json({success:true});
    }
    if(body.action==="promotion") {
      const rows=await sql`UPDATE promotions SET is_active=${body.isActive===true},updated_at=now() WHERE id=${body.id} RETURNING id`;
      if(!rows.length)return fail("Promotion introuvable.",404);
      return NextResponse.json({success:true});
    }
    if(body.action==="banner") {
      const rows=await sql`UPDATE store_banners SET title=${clean(body.title,180)},subtitle=${clean(body.subtitle,300)},image_url=${clean(body.imageUrl,2000)},cta_text=${clean(body.ctaText,80)},cta_url=${clean(body.ctaUrl,500)},is_active=${body.isActive===true},updated_at=now() WHERE id=${body.id} RETURNING id`;
      if(!rows.length)return fail("Bannière introuvable.",404);
      return NextResponse.json({success:true});
    }
    if(body.action==="settings") {
      const entries:Record<string,unknown>={delivery_inside_casablanca:Number(body.casablancaFee),delivery_outside_casablanca:Number(body.otherCitiesFee),whatsapp_number:clean(body.whatsappNumber,30)};
      if(!Number.isFinite(entries.delivery_inside_casablanca as number)||(entries.delivery_inside_casablanca as number)<0||!Number.isFinite(entries.delivery_outside_casablanca as number)||(entries.delivery_outside_casablanca as number)<0||!/^\+?[0-9]{8,15}$/.test(String(entries.whatsapp_number)))return fail("Paramètres de boutique invalides.");
      for(const [key,value] of Object.entries(entries))await sql`INSERT INTO store_settings(key,value,updated_at) VALUES(${key},${JSON.stringify(value)}::jsonb,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`;
      return NextResponse.json({success:true});
    }
    return fail("Action inconnue.");
  } catch { return fail("Mise à jour impossible.",500); }
}

export async function DELETE(request:NextRequest) {
  const gate=await requireAdmin(); if(gate.response)return gate.response;
  try {
    const body=await request.json(), sql=neon(process.env.DATABASE_URL!);
    const tables:Record<string,string>={category:"categories",promotion:"promotions",banner:"store_banners"};
    const table=tables[String(body.type)];
    if(!table||!body.id)return fail("Suppression invalide.");
    if(table==="categories")await sql`UPDATE products SET category_id=NULL WHERE category_id=${body.id}`;
    const rows=table==="categories"?await sql`DELETE FROM categories WHERE id=${body.id} RETURNING id`:table==="promotions"?await sql`DELETE FROM promotions WHERE id=${body.id} RETURNING id`:await sql`DELETE FROM store_banners WHERE id=${body.id} RETURNING id`;
    if(!rows.length)return fail("Élément introuvable.",404);
    return NextResponse.json({success:true});
  } catch { return fail("Suppression impossible.",500); }
}
