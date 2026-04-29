# Stako · Notas SEO y mantenimiento

Última actualización: 29 abril 2026

---

## 1. Resolver el push de Git (acción una sola vez)

**Estado actual:** el commit `2218646` está hecho en local pero no se ha podido hacer push porque el repo es de la cuenta `igarcia-cano` y el Credential Manager intentaba autenticarse con `igarcia-onmi` (otra cuenta tuya, sin permisos sobre el repo).

He limpiado todas las credenciales caché de GitHub. **En el próximo push:**

1. Abre PowerShell o CMD en `C:\Proyectos\stako-web`.
2. Ejecuta:
   ```
   "C:\Program Files\Git\cmd\git.exe" push origin main
   ```
3. Te aparecerá una ventana del navegador o el dialog "Sign in to GitHub". Inicia sesión con la cuenta **`igarcia-cano`** (la propietaria del repo). Si tienes activa otra sesión en el navegador, primero cierra sesión en github.com y vuelve a entrar con `igarcia-cano`.
4. Tras la autenticación, el push se completará y la credencial queda guardada.
5. **A partir de ahí, ningún dialog más.** Como solo habrá una cuenta cacheada, Git no preguntará.

> Si en el futuro quieres volver a tener `igarcia-onmi` como segunda cuenta (no recomendado para este repo), puedes añadirla con el botón "Add a new account" cuando te lo pida.

---

## 2. Lo que se ha mejorado en SEO (commit `2218646`)

### Archivos nuevos
- **`favicon.svg`** · icono de pestaña con el logo Stako (cuadrado negro + gráfica verde).
- **`og-image.png`** (1200×630) · imagen para previsualización en WhatsApp, Twitter, LinkedIn, etc.
- **`robots.txt`** · permite indexación, bloquea `/admin` y `/cuenta`, apunta al sitemap.
- **`sitemap.xml`** · lista de las 7 páginas estáticas + los 10 posts del blog.
- **`manifest.webmanifest`** · permite "Instalar app" en móvil/Chrome.

### Cambios en cada HTML
- `<title>` único y descriptivo por página.
- `<meta description>` única y de longitud óptima (140-160 caracteres).
- `<meta robots>` con `noindex,nofollow` en `/admin` y `/cuenta`, e `index,follow` en el resto.
- `<link rel="canonical">` correcto en cada página.
- **Open Graph completo**: `og:title`, `og:description`, `og:url`, `og:image` (con dimensiones), `og:type`, `og:site_name`, `og:locale`.
- **Twitter Cards**: `summary_large_image` con título, descripción e imagen propios.
- `<link rel="preconnect">` a unpkg y Supabase (mejora carga inicial).
- `<link rel="manifest">` apuntando al webmanifest.

### Datos estructurados (JSON-LD)
- En **`index.html`**: `Organization` (titular Iván García Cano, dirección, email) + `WebSite`.
- En **`blog.html`**: `Blog` + `BreadcrumbList`.
- En cada **post de blog** (inyectado dinámicamente desde `blog.jsx`): `Article` con autor, fechas, imagen y publisher + `BreadcrumbList` con 3 niveles.

Esto es lo que permite que Google muestre rich snippets (autor, fecha, imagen) en los resultados de búsqueda.

---

## 3. Google Search Console (acción manual, 5 minutos)

Para que Google sepa que tu web existe y empiece a indexarla rápido:

1. Entra en https://search.google.com/search-console con tu cuenta Google (la misma que uses para el dominio).
2. Pulsa "Añadir propiedad" → "Prefijo de URL" → introduce `https://stakocapital.com/`.
3. **Verificación**: la opción más rápida es "Etiqueta HTML" — te darán una línea del tipo:
   ```html
   <meta name="google-site-verification" content="ABC123..." />
   ```
   Pásamela y la añado a `index.html`. Tras hacer redeploy y pulsar "Verificar" en Search Console, quedará verificado.
4. Ya verificado, en el menú "Sitemaps" introduce: `sitemap.xml` y pulsa Enviar.
5. Listo. Google empezará a rastrear las URLs en horas/días.

> **Alternativa rápida** sin verificación: puedes ir a https://www.google.com/ping?sitemap=https://stakocapital.com/sitemap.xml para avisar a Google del sitemap, pero la verificación en Search Console te da datos de tráfico orgánico, posiciones, errores de indexación, etc. Vale la pena.

### Bing Webmaster Tools (opcional)
Mismo proceso en https://www.bing.com/webmasters · si verificas Google Search Console, Bing permite importar la verificación con un clic.

---

## 4. Cómo regenerar el sitemap cuando publiques nuevos posts

He guardado un script auxiliar que **NO** sube secretos al repo. Lo puedes ejecutar siempre que publiques posts nuevos:

```
cd C:\Proyectos\stako-web
python -X utf8 _regen_sitemap.py
```

Eso consulta Supabase, regenera `sitemap.xml` con los posts actualizados y lo deja listo para commit + push.

---

## 5. Vercel Web Analytics

Ya está activo. Verificado:
- `https://stakocapital.com/_vercel/insights/script.js` → 200, 2495 bytes.
- En cada HTML hay `<script defer src="/_vercel/insights/script.js"></script>`.

Los datos aparecerán en `https://vercel.com/igarcia-onmis-projects/stako-web/analytics` en cuanto haya navegación.

---

## 6. Resumen de archivos a no perder de vista

| Archivo | Propósito | ¿Regenerable? |
|---|---|---|
| `favicon.svg` | Icono de pestaña | Manual |
| `og-image.png` | Imagen previsualización redes | `_seo_bootstrap.py` |
| `robots.txt` | Reglas para crawlers | Manual o script |
| `sitemap.xml` | URLs para crawlers | `_regen_sitemap.py` |
| `manifest.webmanifest` | Metadata PWA | Manual |
