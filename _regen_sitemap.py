"""
Stako: regenera sitemap.xml consultando Supabase para los blog posts publicados.

Uso:
    python -X utf8 _regen_sitemap.py

Luego, commit + push del sitemap.xml resultante.

NOTA: usa la anon key de Supabase, que es PUBLICA (no es un secreto).
La misma key ya está expuesta en supabase-client.js.
"""
import json
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = "https://stakocapital.com"

SUPA_URL = "https://xkctsnwrihrbqvckojix.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY3RzbndyaWhyYnF2Y2tvaml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjI0NDYsImV4cCI6MjA5Mjc5ODQ0Nn0.rM7CXUTYabwsU1c_knJMHAmTvduC0JUypg6-dfpyx0Q"


def fetch_blog_posts():
    url = (
        f"{SUPA_URL}/rest/v1/blog_posts"
        "?select=slug,updated_at,published_at"
        "&status=eq.published"
        "&order=published_at.desc"
    )
    req = urllib.request.Request(url, headers={
        "apikey": ANON_KEY,
        "Authorization": "Bearer " + ANON_KEY,
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def main():
    posts = fetch_blog_posts()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    static_pages = [
        ("/", "weekly", "1.0"),
        ("/blog", "daily", "0.9"),
        ("/bot", "monthly", "0.8"),
        ("/aviso-legal", "yearly", "0.3"),
        ("/privacidad", "yearly", "0.3"),
        ("/cookies", "yearly", "0.3"),
        ("/aviso-riesgo", "yearly", "0.3"),
    ]

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

    for loc, freq, prio in static_pages:
        lines += [
            "  <url>",
            f"    <loc>{SITE}{loc}</loc>",
            f"    <lastmod>{today}</lastmod>",
            f"    <changefreq>{freq}</changefreq>",
            f"    <priority>{prio}</priority>",
            "  </url>",
        ]

    for p in posts:
        slug = p["slug"]
        lastmod = (p.get("updated_at") or p.get("published_at") or today)[:10]
        lines += [
            "  <url>",
            f"    <loc>{SITE}/blog?p={urllib.parse.quote(slug)}</loc>",
            f"    <lastmod>{lastmod}</lastmod>",
            "    <changefreq>monthly</changefreq>",
            "    <priority>0.7</priority>",
            "  </url>",
        ]

    lines.append("</urlset>")
    out = ROOT / "sitemap.xml"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"OK: sitemap.xml regenerado")
    print(f"  - {len(static_pages)} paginas estaticas")
    print(f"  - {len(posts)} posts publicados")
    print(f"  - {out.stat().st_size} bytes")


if __name__ == "__main__":
    main()
