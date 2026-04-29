/* ============================================================
   STAKO — Blog público
   Renderiza /blog (lista) o /blog?p=:slug (detalle)
   Usamos query params para evitar problemas de rewrites en hosting estático
   ============================================================ */
const { useState: _bUseState, useEffect: _bUseEffect, useMemo: _bUseMemo } = React;

function _bFmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function _bRenderMarkdown(md) {
  if (!md) return "";
  try {
    const html = window.marked.parse(md, { breaks: true, gfm: true });
    return window.DOMPurify.sanitize(html);
  } catch (e) {
    return "";
  }
}

function _bGetSlugFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    return p ? decodeURIComponent(p) : null;
  } catch (e) {
    return null;
  }
}

function _bBuildPostUrl(slug) {
  return "/blog?p=" + encodeURIComponent(slug);
}

/* === Router principal === */
function BlogRouter() {
  const [slug, setSlug] = _bUseState(_bGetSlugFromQuery());

  _bUseEffect(() => {
    const onPop = () => setSlug(_bGetSlugFromQuery());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (slug) return <BlogPostPage slug={slug} />;
  return <BlogListPage />;
}

/* === Lista === */
function BlogListPage() {
  const [posts, setPosts]           = _bUseState(null);
  const [categories, setCategories] = _bUseState([]);
  const [activeCat, setActiveCat]   = _bUseState("");
  const [q, setQ]                   = _bUseState("");

  _bUseEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, c] = await Promise.all([
        window.StakoSupabase.blogListPublishedPosts({ category: activeCat || undefined, q: q || undefined }),
        window.StakoSupabase.blogListCategories(),
      ]);
      if (!cancelled) { setPosts(p); setCategories(c); }
    })();
    return () => { cancelled = true; };
  }, [activeCat, q]);

  return (
    <div className="container blog-wrap">
      <header className="blog-hero">
        <div className="eyebrow">— Blog</div>
        <h1 className="display blog-hero__title">Análisis y educación financiera.</h1>
        <p className="blog-hero__sub text-muted">
          Mercados, macro, inversión a largo plazo e historia económica. Sin recomendaciones,
          sin consejos: contexto e información para que decidas tú.
        </p>
      </header>

      <div className="blog-toolbar">
        <div className="blog-cats">
          <button
            className={"blog-cat" + (activeCat === "" ? " is-active" : "")}
            onClick={() => setActiveCat("")}
          >Todos</button>
          {categories.map((c) => (
            <button
              key={c.slug}
              className={"blog-cat" + (activeCat === c.slug ? " is-active" : "")}
              onClick={() => setActiveCat(c.slug)}
              title={c.description || ""}
            >{c.name}</button>
          ))}
        </div>
        <input
          type="search"
          className="blog-search"
          placeholder="Buscar..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {posts === null && (
        <div className="blog-loading text-muted">Cargando…</div>
      )}

      {posts !== null && posts.length === 0 && (
        <div className="blog-empty">
          <p className="text-muted">Aún no hay artículos publicados en esta categoría.</p>
        </div>
      )}

      {posts !== null && posts.length > 0 && (
        <div className="blog-grid">
          {posts.map((p) => <BlogCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}

function BlogCard({ post }) {
  const cat = post.category_slug;
  const url = _bBuildPostUrl(post.slug);
  return (
    <a href={url} className="blog-card">
      {post.cover_image_url ? (
        <div className="blog-card__cover">
          <img src={post.cover_image_url} alt="" loading="lazy" />
        </div>
      ) : (
        <div className="blog-card__cover blog-card__cover--placeholder">
          <span className="mono">Stako</span>
        </div>
      )}
      <div className="blog-card__body">
        {cat && <div className="blog-card__cat eyebrow">{cat}</div>}
        <h3 className="blog-card__title">{post.title}</h3>
        {post.excerpt && <p className="blog-card__excerpt text-muted">{post.excerpt}</p>}
        <div className="blog-card__meta">
          <span className="mono">{_bFmtDate(post.published_at)}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{post.reading_time_min} min</span>
        </div>
      </div>
    </a>
  );
}

/* === Detalle === */
function BlogPostPage({ slug }) {
  const [post, setPost] = _bUseState(undefined); // undefined=loading, null=not-found, obj=ok
  const [cats, setCats] = _bUseState([]);

  _bUseEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, c] = await Promise.all([
        window.StakoSupabase.blogGetPostBySlug(slug),
        window.StakoSupabase.blogListCategories(),
      ]);
      if (!cancelled) { setPost(p || null); setCats(c); }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // SEO: actualizar título, meta y JSON-LD Article cuando llega el post
  _bUseEffect(() => {
    if (!post || !post.title) return;
    const SITE = "https://stakocapital.com";
    const url = SITE + _bBuildPostUrl(post.slug);
    const fullTitle = post.title + " — Stako";
    const img = post.cover_image_url || (SITE + "/og-image.png");

    document.title = fullTitle;

    const setAttr = (sel, attr, val) => {
      const el = document.querySelector(sel);
      if (el && val != null) el.setAttribute(attr, val);
    };
    setAttr('link[rel="canonical"]', "href", url);
    setAttr('meta[name="description"]', "content", post.excerpt || "");
    setAttr('meta[property="og:url"]', "content", url);
    setAttr('meta[property="og:title"]', "content", post.title);
    setAttr('meta[property="og:description"]', "content", post.excerpt || "");
    setAttr('meta[property="og:type"]', "content", "article");
    setAttr('meta[property="og:image"]', "content", img);
    setAttr('meta[property="og:image:alt"]', "content", post.title);
    setAttr('meta[name="twitter:url"]', "content", url);
    setAttr('meta[name="twitter:title"]', "content", post.title);
    setAttr('meta[name="twitter:description"]', "content", post.excerpt || "");
    setAttr('meta[name="twitter:image"]', "content", img);
    setAttr('meta[name="twitter:image:alt"]', "content", post.title);

    document.querySelectorAll('script[data-stako-jsonld]').forEach(s => s.remove());
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      "mainEntityOfPage": { "@type": "WebPage", "@id": url },
      "headline": post.title,
      "description": post.excerpt || "",
      "image": img,
      "datePublished": post.published_at || post.created_at || null,
      "dateModified": post.updated_at || post.published_at || null,
      "author": { "@type": "Organization", "name": post.author || "Equipo Stako", "url": SITE + "/" },
      "publisher": {
        "@type": "Organization",
        "name": "Stako",
        "logo": { "@type": "ImageObject", "url": SITE + "/favicon.svg" }
      },
      "inLanguage": "es-ES"
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": "Blog",   "item": SITE + "/blog" },
        { "@type": "ListItem", "position": 3, "name": post.title, "item": url }
      ]
    };
    [article, breadcrumb].forEach(obj => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-stako-jsonld", "post");
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });

    return () => {
      document.querySelectorAll('script[data-stako-jsonld]').forEach(s => s.remove());
    };
  }, [post]);

  if (post === undefined) {
    return <div className="container blog-wrap"><div className="blog-loading text-muted">Cargando…</div></div>;
  }
  if (post === null) {
    return (
      <div className="container blog-wrap blog-404">
        <div className="eyebrow">— 404</div>
        <h1 className="display">Artículo no encontrado.</h1>
        <p className="text-muted">El artículo que buscas no existe o ha sido despublicado.</p>
        <a href="/blog" className="btn btn-ghost" style={{ marginTop: 20 }}>← Volver al blog</a>
      </div>
    );
  }

  const cat = cats.find((c) => c.slug === post.category_slug);
  const html = _bRenderMarkdown(post.body_md);

  return (
    <article className="blog-article">
      <div className="container blog-article__inner">
        <a href="/blog" className="blog-back">← Blog</a>

        {cat && <div className="eyebrow blog-article__cat">{cat.name}</div>}
        <h1 className="display blog-article__title">{post.title}</h1>
        {post.subtitle && <p className="blog-article__subtitle text-muted">{post.subtitle}</p>}

        <div className="blog-article__meta">
          <span className="mono">{post.author || "Equipo Stako"}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{_bFmtDate(post.published_at)}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{post.reading_time_min} min de lectura</span>
        </div>

        {post.cover_image_url && (
          <figure className="blog-article__cover">
            <img src={post.cover_image_url} alt={post.title} />
          </figure>
        )}

        <div
          className="blog-article__body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="blog-article__tags">
            {post.tags.map((t) => (
              <span key={t} className="blog-tag mono">#{t}</span>
            ))}
          </div>
        )}

        <BlogDisclaimer />
      </div>
    </article>
  );
}

/* === Disclaimer obligatorio === */
function BlogDisclaimer() {
  return (
    <aside className="blog-disclaimer">
      <div className="eyebrow">— Aviso</div>
      <p>
        Este contenido es <strong>informativo y educativo</strong>. No constituye recomendación
        de inversión, asesoramiento financiero ni invitación a comprar o vender activos.
        Consulta con un asesor registrado en la CNMV antes de tomar decisiones financieras.
        La inversión conlleva riesgo de pérdida del capital invertido.
      </p>
    </aside>
  );
}

/* === Footer simple === */
/* (eliminado — usamos Footer de shared.jsx con enlaces legales) */
