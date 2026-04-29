# SEO de Stako — guía de mantenimiento

Este documento explica qué hay configurado y qué pasos requieren acción humana.

## ✅ Ya hecho (automático)

- **`favicon.svg`** + meta `theme-color` en los 9 HTMLs.
- **`og-image.png`** (1200×630, fondo negro + logo + tagline + URL en verde).
- **`robots.txt`** apuntando al sitemap, bloqueando `/admin` y `/cuenta`.
- **`sitemap.xml`** con 17 URLs (7 estáticas + 10 posts del blog), regenerable con `python _gen_sitemap.py`.
- **Meta tags completos** en cada HTML: description, keywords, author, robots, canonical, hreflang, og:*, twitter:*, theme-color.
- **JSON-LD structured data** en cada página: Organization, WebSite, WebPage; Article + BreadcrumbList dinámico en cada post del blog.
- **`noindex`** en `admin.html` y `cuenta.html`.
- **Vercel Web Analytics** activo en los 9 HTMLs.

## 🔴 Acciones que requieren intervención humana

### 1. Google Search Console (prioritario, 5 min)

URL: https://search.google.com/search-console

1. Inicia sesión con tu cuenta de Google.
2. Pulsa "Añadir propiedad" → elige "Prefijo de URL" → introduce `https://stakocapital.com`.
3. Para verificar la propiedad, elige el método **"Etiqueta HTML"** (es el más rápido).
4. Google te dará una etiqueta tipo:
   `<meta name="google-site-verification" content="ABC123XYZ..." />`
5. Pásamela y la añado a los HTMLs en 1 minuto, hago commit, push y verificas.
6. Una vez verificada, ve a "Sitemaps" en el menú izquierdo y envía: `https://stakocapital.com/sitemap.xml`.

### 2. Bing Webmaster Tools (opcional, 5 min)

URL: https://www.bing.com/webmasters

Mismo procedimiento que Google. Importa porque DuckDuckGo, Yahoo y otros buscadores usan el índice de Bing.
Si ya verificaste Search Console, Bing tiene un botón "Importar desde Search Console" que lo hace en 1 clic.

### 3. Indexación manual de URLs (opcional, después de Search Console)

Una vez Search Console esté activo, puedes acelerar la indexación:
1. En Search Console → "Inspección de URL".
2. Pega la URL (p. ej. `https://stakocapital.com/`).
3. Si dice "URL no está en Google", pulsa "Solicitar indexación".
4. Repite para `/blog`, `/bot` y los artículos importantes.

## 🔄 Mantenimiento periódico

### Regenerar sitemap.xml cuando publiques posts nuevos

```
python _gen_sitemap.py
git add sitemap.xml
git commit -m sitemap-update
git push origin main
```

### Regenerar og-image.png si cambia el branding

```
python _gen_ogimage.py
git add og-image.png
git commit -m og-image-update
git push origin main
```

## 📝 Notas técnicas

- El bloque SEO en cada HTML está delimitado por `<!-- SEO META BLOCK START -->` y `<!-- SEO META BLOCK END -->` (idempotente: re-ejecutar `_seo_patch.py` no duplica).
- El JSON-LD estático está delimitado por `<!-- JSON-LD START -->` y `<!-- JSON-LD END -->`.
- El JSON-LD dinámico de los posts del blog se inyecta desde `blog.jsx` con `data-stako-jsonld` y se limpia al desmontar el componente.
- El sitemap se genera leyendo posts publicados desde Supabase REST API (usa la anon key, sin secrets).
- hreflang está apuntando a la misma URL para `es`, `en` y `x-default` porque el cambio de idioma es client-side (no hay URLs separadas /en/). Si en el futuro se rediseñan las URLs por idioma, actualizar `_seo_patch.py`.

## ❓ Cuándo verás resultados en Google

- **Tras enviar el sitemap**: 1-7 días para que Google rastree las URLs.
- **Para aparecer en búsquedas**: 1-4 semanas para indexación inicial.
- **Para posicionar en top 10**: meses, depende de tráfico, backlinks y competencia.

SEO es un juego de plazo medio-largo. Lo técnico ya está perfecto, ahora toca contenido y tiempo.