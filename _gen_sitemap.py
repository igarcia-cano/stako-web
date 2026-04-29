"""
Genera sitemap.xml dinamicamente leyendo posts publicados desde Supabase.
Uso:
    python _gen_sitemap.py
Resultado: escribe sitemap.xml en la raiz del proyecto.

Re-ejecutar manualmente cuando se publican posts nuevos.
NOTA: usa la anon key (publica). No requiere secrets en el repo.
"""
import json
import urllib.request
import urllib.parse
from datetime import datetime, timezone

SUPA_URL = "https://xkctsnwrihrbqvckojix.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY3RzbndyaWhyYnF2Y2tvaml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjI0NDYsImV4cCI6MjA5Mjc5ODQ0Nn0.rM7CXUTYabwsU1c_knJMHAmTvduC0JUypg6-dfpyx0Q"
SITE = "https://stakocapital.com"

# Paginas estaticas (prioridad y frecuencia)
STATIC_PAGES = [
    ("/",              "1.0", "weekly"),
    ("/bot",           "0.9", "weekly"),
    ("/blog",          "0.9", "daily"),
    ("/aviso-legal",   "0.3", "yearly"),
    ("/privacidad",    "0.3", "yearly"),
    ("/cookies",       "0.3", "yearly"),
    ("/aviso-riesgo",  "0.5", "yearly"),
]

def fetch_posts():
    """Fetch published posts from Supabase REST API."""
    url = (
        f"{SUPA_URL}/rest/v1/blog_posts"
        f"?select=slug,updated_at,published_at"
        f"&status=eq.published"
        f"&order=published_at.desc"
    )
    req = urllib.request.Request(url, headers={
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))

def fmt_date(d):
    if not d:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # supabase devuelve ISO 8601, quedarse con la parte de fecha
    return d[:10]

def main():
    posts = fetch_posts()
    print(f"  {len(posts)} posts publicados")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    parts = ['<?xml version="1.0" encoding="UTF-8"?>']
    parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    # Estaticas
    for path, prio, freq in STATIC_PAGES:
        parts.append("  <url>")
        parts.append(f"    <loc>{SITE}{path}</loc>")
        parts.append(f"    <lastmod>{today}</lastmod>")
        parts.append(f"    <changefreq>{freq}</changefreq>")
        parts.append(f"    <priority>{prio}</priority>")
        parts.append("  </url>")

    # Posts del blog (URL con query param ?p=slug)
    for p in posts:
        slug = p["slug"]
        lastmod = fmt_date(p.get("updated_at") or p.get("published_at"))
        loc = f"{SITE}/blog?p={urllib.parse.quote(slug)}"
        parts.append("  <url>")
        parts.append(f"    <loc>{loc}</loc>")
        parts.append(f"    <lastmod>{lastmod}</lastmod>")
        parts.append("    <changefreq>monthly</changefreq>")
        parts.append("    <priority>0.7</priority>")
        parts.append("  </url>")

    parts.append("</urlset>")
    xml = "\n".join(parts) + "\n"

    out = r"C:\Proyectos\stako-web\sitemap.xml"
    with open(out, "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"  Generado: {out} ({len(xml)} bytes)")
    print(f"  Total URLs: {len(STATIC_PAGES) + len(posts)}")

if __name__ == "__main__":
    main()
