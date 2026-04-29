"""
Aplica mejoras SEO a todos los HTMLs:
- og:image, og:image:width/height/alt completos
- twitter:image
- meta keywords (suaves, no determinantes pero suman)
- meta author + robots
- JSON-LD Organization + WebSite (en index.html)
- JSON-LD WebPage (en cada pagina)
- noindex en admin.html y cuenta.html
- hreflang ES/EN

Idempotente: si ya esta puesto, no lo duplica.
"""
import os
import re

ROOT = r"C:\Proyectos\stako-web"
SITE = "https://stakocapital.com"

# Configuracion por pagina: (filename, path, title, description, og_type, noindex, extra_keywords)
PAGES = {
    "index.html": dict(
        path="/",
        title="Stako — Hub de inversión y economía",
        description="Stako es un hub de inversión automatizada: bot de trading en Telegram con tu capital aislado en Binance, blog educativo de mercado y próximamente eBooks. Sin asesoramiento financiero.",
        og_type="website",
        noindex=False,
        keywords="inversión, bot de trading, automatización, Binance, Telegram, economía, mercados financieros, blog financiero, educación financiera",
    ),
    "bot.html": dict(
        path="/bot",
        title="Bot de trading en Telegram — Stako",
        description="Bot de trading automatizado en Telegram. Tu capital permanece aislado en tu cuenta de Binance, conectado vía API. Suscripción mensual de €39. Sin asesoramiento financiero.",
        og_type="website",
        noindex=False,
        keywords="bot trading Telegram, trading automatizado, API Binance, bot inversión, automatización trading",
    ),
    "blog.html": dict(
        path="/blog",
        title="Blog — Stako",
        description="Blog educativo sobre macroeconomía, historia financiera, mercados y actualidad. Análisis informativos sin recomendaciones de inversión.",
        og_type="website",
        noindex=False,
        keywords="blog economía, blog financiero, educación financiera, macroeconomía, mercados, historia financiera, actualidad económica",
    ),
    "cuenta.html": dict(
        path="/cuenta",
        title="Mi cuenta — Stako",
        description="Área privada de cliente Stako.",
        og_type="website",
        noindex=True,
        keywords="",
    ),
    "admin.html": dict(
        path="/admin",
        title="Admin — Stako",
        description="Panel de administración interno.",
        og_type="website",
        noindex=True,
        keywords="",
    ),
    "aviso-legal.html": dict(
        path="/aviso-legal",
        title="Aviso legal — Stako",
        description="Información legal sobre el titular de stakocapital.com en cumplimiento de la LSSI-CE.",
        og_type="website",
        noindex=False,
        keywords="aviso legal, LSSI-CE, titular Stako",
    ),
    "privacidad.html": dict(
        path="/privacidad",
        title="Política de privacidad — Stako",
        description="Política de privacidad y tratamiento de datos personales conforme al RGPD y la LOPDGDD.",
        og_type="website",
        noindex=False,
        keywords="privacidad, RGPD, LOPDGDD, tratamiento de datos",
    ),
    "cookies.html": dict(
        path="/cookies",
        title="Política de cookies — Stako",
        description="Información sobre el uso de cookies en stakocapital.com conforme al artículo 22.2 de la LSSI-CE.",
        og_type="website",
        noindex=False,
        keywords="cookies, política de cookies, LSSI 22.2, AEPD",
    ),
    "aviso-riesgo.html": dict(
        path="/aviso-riesgo",
        title="Aviso de riesgo — Stako",
        description="Aviso de riesgo CNMV: información sobre los riesgos asociados a las criptomonedas y activos financieros.",
        og_type="website",
        noindex=False,
        keywords="aviso de riesgo, CNMV, criptomonedas, riesgo de inversión",
    ),
}

def patch_html(filename, cfg):
    path = os.path.join(ROOT, filename)
    if not os.path.exists(path):
        print(f"  [skip] {filename} no existe")
        return False

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # --- 1) Reemplazar / añadir <title> ---
    if re.search(r"<title>.*?</title>", content, flags=re.DOTALL):
        content = re.sub(r"<title>.*?</title>", f"<title>{cfg['title']}</title>", content, count=1, flags=re.DOTALL)

    # --- 2) Reemplazar meta description ---
    desc_re = r'<meta name="description"[^>]*/>'
    desc_tag = f'<meta name="description" content="{cfg["description"]}" />'
    if re.search(desc_re, content):
        content = re.sub(desc_re, desc_tag, content, count=1)
    else:
        content = content.replace("<title>", desc_tag + "\n<title>", 1)

    # --- 3) Bloque SEO completo (idempotente: marcador HTML comment) ---
    seo_marker_start = "<!-- SEO META BLOCK START -->"
    seo_marker_end = "<!-- SEO META BLOCK END -->"

    canonical = f"{SITE}{cfg['path']}"
    robots = "noindex, nofollow" if cfg["noindex"] else "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"

    seo_block = f"""{seo_marker_start}
<meta name="robots" content="{robots}" />
<meta name="author" content="Iván García Cano" />
<meta name="publisher" content="Stako" />"""
    if cfg["keywords"]:
        seo_block += f'\n<meta name="keywords" content="{cfg["keywords"]}" />'
    seo_block += f"""
<link rel="canonical" href="{canonical}" />
<link rel="alternate" hreflang="es" href="{canonical}" />
<link rel="alternate" hreflang="en" href="{canonical}" />
<link rel="alternate" hreflang="x-default" href="{canonical}" />
<meta property="og:type" content="{cfg['og_type']}" />
<meta property="og:title" content="{cfg['title']}" />
<meta property="og:description" content="{cfg['description']}" />
<meta property="og:url" content="{canonical}" />
<meta property="og:site_name" content="Stako" />
<meta property="og:locale" content="es_ES" />
<meta property="og:image" content="{SITE}/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Stako — Inversión automatizada, decisiones humanas" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{cfg['title']}" />
<meta name="twitter:description" content="{cfg['description']}" />
<meta name="twitter:url" content="{canonical}" />
<meta name="twitter:image" content="{SITE}/og-image.png" />
<meta name="twitter:image:alt" content="Stako — Inversión automatizada, decisiones humanas" />
{seo_marker_end}"""

    # Si ya existe el bloque, lo reemplazamos
    if seo_marker_start in content:
        content = re.sub(
            re.escape(seo_marker_start) + r".*?" + re.escape(seo_marker_end),
            seo_block,
            content,
            count=1,
            flags=re.DOTALL,
        )
    else:
        # Eliminar las og: y twitter: y canonical viejas (pueden duplicarse), luego insertar bloque
        content = re.sub(r'\s*<meta property="og:[^"]+"[^>]*/>', "", content)
        content = re.sub(r'\s*<meta name="twitter:[^"]+"[^>]*/>', "", content)
        content = re.sub(r'\s*<link rel="canonical"[^>]*/>', "", content)
        # Insertar bloque despues de la meta description
        content = re.sub(desc_re, desc_tag + "\n" + seo_block, content, count=1)

    # --- 4) JSON-LD ---
    org_jsonld = """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Stako",
  "alternateName": "Stako Capital",
  "url": "https://stakocapital.com",
  "logo": "https://stakocapital.com/og-image.png",
  "description": "Hub de inversión automatizada: bot de trading en Telegram, blog educativo y próximamente eBooks.",
  "founder": {
    "@type": "Person",
    "name": "Iván García Cano"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "C/ Río Guadarrama",
    "postalCode": "28939",
    "addressLocality": "Arroyomolinos",
    "addressRegion": "Madrid",
    "addressCountry": "ES"
  },
  "email": "stakobot@outlook.com",
  "sameAs": []
}
</script>"""

    website_jsonld = """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Stako",
  "url": "https://stakocapital.com",
  "inLanguage": "es-ES",
  "publisher": {
    "@type": "Organization",
    "name": "Stako",
    "logo": "https://stakocapital.com/og-image.png"
  }
}
</script>"""

    webpage_jsonld = f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "{cfg['title']}",
  "description": "{cfg['description']}",
  "url": "{canonical}",
  "inLanguage": "es-ES",
  "isPartOf": {{
    "@type": "WebSite",
    "name": "Stako",
    "url": "https://stakocapital.com"
  }}
}}
</script>"""

    jsonld_marker_start = "<!-- JSON-LD START -->"
    jsonld_marker_end = "<!-- JSON-LD END -->"

    if filename == "index.html":
        jsonld_block = f"{jsonld_marker_start}\n{org_jsonld}\n{website_jsonld}\n{webpage_jsonld}\n{jsonld_marker_end}"
    elif cfg["noindex"]:
        # No incluimos JSON-LD en zonas privadas (admin/cuenta)
        jsonld_block = f"{jsonld_marker_start}\n{jsonld_marker_end}"
    else:
        jsonld_block = f"{jsonld_marker_start}\n{webpage_jsonld}\n{jsonld_marker_end}"

    if jsonld_marker_start in content:
        content = re.sub(
            re.escape(jsonld_marker_start) + r".*?" + re.escape(jsonld_marker_end),
            jsonld_block,
            content,
            count=1,
            flags=re.DOTALL,
        )
    else:
        # Insertar antes de </head>
        content = content.replace("</head>", jsonld_block + "\n</head>", 1)

    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

print("Patcheando HTMLs...")
for fname, cfg in PAGES.items():
    changed = patch_html(fname, cfg)
    state = "OK " if changed else "skip"
    nx = " [noindex]" if cfg["noindex"] else ""
    print(f"  [{state}] {fname}{nx}")

print("\nVerificacion final:")
for fname, cfg in PAGES.items():
    p = os.path.join(ROOT, fname)
    if not os.path.exists(p):
        continue
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()
    has_og_image = "og:image" in c
    has_twitter = "twitter:image" in c
    has_jsonld = "application/ld+json" in c if not cfg["noindex"] else "(N/A)"
    has_robots = 'name="robots"' in c
    print(f"  {fname:24} og:image={has_og_image}  twitter:image={has_twitter}  json-ld={has_jsonld}  robots={has_robots}")
