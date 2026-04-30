/* ============================================================
   STAKO — Blog público
   Renderiza /blog (lista) o /blog?p=:slug (detalle)
   Soporta posts bilingües: si el post tiene title_en y body_md_en,
   se muestra la versión EN cuando lang=en. Si solo tiene una versión,
   se muestra esa con un banner avisando.
   ============================================================ */
const { useState: _bUseState, useEffect: _bUseEffect, useMemo: _bUseMemo } = React;

function _bFmtDate(iso, lang) {
  if (!iso) return "—";
  const d = new Date(iso);
  const locale = lang === "en" ? "en-US" : "es-ES";
  return d.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
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

/* ------------------------------------------------------------
   Localizar un post según el idioma actual.
   Devuelve: { title, subtitle, excerpt, body, isFallback, originalLang }
   - isFallback: true si pediste lang X pero el post solo está en Y
   - originalLang: idioma real del contenido devuelto ("es"|"en")
   ------------------------------------------------------------ */
function _bLocalizePost(post, lang) {
  if (!post) return null;
  const hasEN = !!(post.title_en && post.title_en.trim() && post.body_md_en && post.body_md_en.trim());
  const hasES = !!(post.title && post.title.trim() && post.body_md && post.body_md.trim());

  if (lang === "en" && hasEN) {
    return {
      title:    post.title_en,
      subtitle: post.subtitle_en || "",
      excerpt:  post.excerpt_en  || "",
      body:     post.body_md_en,
      isFallback: false,
      originalLang: "en",
    };
  }
  if (lang === "en" && !hasEN && hasES) {
    return {
      title:    post.title,
      subtitle: post.subtitle || "",
      excerpt:  post.excerpt  || "",
      body:     post.body_md,
      isFallback: true,
      originalLang: "es",
    };
  }
  if (lang === "es" && hasES) {
    return {
      title:    post.title,
      subtitle: post.subtitle || "",
      excerpt:  post.excerpt  || "",
      body:     post.body_md,
      isFallback: false,
      originalLang: "es",
    };
  }
  if (lang === "es" && !hasES && hasEN) {
    return {
      title:    post.title_en,
      subtitle: post.subtitle_en || "",
      excerpt:  post.excerpt_en  || "",
      body:     post.body_md_en,
      isFallback: true,
      originalLang: "en",
    };
  }
  // fallback final: lo que haya
  return {
    title:    post.title    || post.title_en    || "",
    subtitle: post.subtitle || post.subtitle_en || "",
    excerpt:  post.excerpt  || post.excerpt_en  || "",
    body:     post.body_md  || post.body_md_en  || "",
    isFallback: false,
    originalLang: hasES ? "es" : "en",
  };
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
  const { t, lang } = useApp();
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
        <div className="eyebrow">— {t.blog.hero_eyebrow}</div>
        <h1 className="display blog-hero__title">{t.blog.hero_title}</h1>
        <p className="blog-hero__sub text-muted">{t.blog.hero_sub}</p>
      </header>

      <div className="blog-toolbar">
        <div className="blog-cats">
          <button
            className={"blog-cat" + (activeCat === "" ? " is-active" : "")}
            onClick={() => setActiveCat("")}
          >{t.blog.filter_all}</button>
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
          placeholder={t.blog.search_ph}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {posts === null && (
        <div className="blog-loading text-muted">{t.blog.loading}</div>
      )}

      {posts !== null && posts.length === 0 && (
        <div className="blog-empty">
          <p className="text-muted">{t.blog.empty_category}</p>
        </div>
      )}

      {posts !== null && posts.length > 0 && (
        <div className="blog-grid">
          {posts.map((p) => <BlogCard key={p.id} post={p} lang={lang} t={t} />)}
        </div>
      )}
    </div>
  );
}

function BlogCard({ post, lang, t }) {
  const cat = post.category_slug;
  const url = _bBuildPostUrl(post.slug);
  const loc = _bLocalizePost(post, lang);
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
        <h3 className="blog-card__title">{loc.title}</h3>
        {loc.excerpt && <p className="blog-card__excerpt text-muted">{loc.excerpt}</p>}
        <div className="blog-card__meta">
          <span className="mono">{_bFmtDate(post.published_at, lang)}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{post.reading_time_min} {t.blog.reading_time}</span>
          {loc.isFallback && (
            <>
              <span className="dot-sep">·</span>
              <span className="mono blog-card__lang-warn">{loc.originalLang.toUpperCase()}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

/* === Detalle === */
function BlogPostPage({ slug }) {
  const { t, lang } = useApp();
  const [post, setPost] = _bUseState(undefined);
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

  // SEO
  _bUseEffect(() => {
    if (!post) return;
    const loc = _bLocalizePost(post, lang);
    if (!loc || !loc.title) return;
    const SITE = "https://stakocapital.com";
    const url = SITE + _bBuildPostUrl(post.slug);
    const fullTitle = loc.title + " — Stako";
    const img = post.cover_image_url || (SITE + "/og-image.png");

    document.title = fullTitle;
    document.documentElement.lang = loc.originalLang;

    const setAttr = (sel, attr, val) => {
      const el = document.querySelector(sel);
      if (el && val != null) el.setAttribute(attr, val);
    };
    setAttr('link[rel="canonical"]', "href", url);
    setAttr('meta[name="description"]', "content", loc.excerpt || "");
    setAttr('meta[property="og:url"]', "content", url);
    setAttr('meta[property="og:title"]', "content", loc.title);
    setAttr('meta[property="og:description"]', "content", loc.excerpt || "");
    setAttr('meta[property="og:type"]', "content", "article");
    setAttr('meta[property="og:image"]', "content", img);
    setAttr('meta[property="og:image:alt"]', "content", loc.title);
    setAttr('meta[name="twitter:url"]', "content", url);
    setAttr('meta[name="twitter:title"]', "content", loc.title);
    setAttr('meta[name="twitter:description"]', "content", loc.excerpt || "");
    setAttr('meta[name="twitter:image"]', "content", img);
    setAttr('meta[name="twitter:image:alt"]', "content", loc.title);

    document.querySelectorAll('script[data-stako-jsonld]').forEach(s => s.remove());
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      "mainEntityOfPage": { "@type": "WebPage", "@id": url },
      "headline": loc.title,
      "description": loc.excerpt || "",
      "image": img,
      "datePublished": post.published_at || post.created_at || null,
      "dateModified": post.updated_at || post.published_at || null,
      "author": { "@type": "Organization", "name": post.author || t.blog.author_default, "url": SITE + "/" },
      "publisher": {
        "@type": "Organization",
        "name": "Stako",
        "logo": { "@type": "ImageObject", "url": SITE + "/favicon.svg" }
      },
      "inLanguage": loc.originalLang === "en" ? "en-US" : "es-ES"
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": lang === "en" ? "Home" : "Inicio", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog" },
        { "@type": "ListItem", "position": 3, "name": loc.title, "item": url }
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
  }, [post, lang]);

  if (post === undefined) {
    return <div className="container blog-wrap"><div className="blog-loading text-muted">{t.blog.loading}</div></div>;
  }
  if (post === null) {
    return (
      <div className="container blog-wrap blog-404">
        <div className="eyebrow">— {t.blog.not_found_eyebrow}</div>
        <h1 className="display">{t.blog.not_found_h1}</h1>
        <p className="text-muted">{t.blog.not_found_lead}</p>
        <a href="/blog" className="btn btn-ghost" style={{ marginTop: 20 }}>{t.blog.back_to_blog}</a>
      </div>
    );
  }

  const cat = cats.find((c) => c.slug === post.category_slug);
  const loc = _bLocalizePost(post, lang);
  const html = _bRenderMarkdown(loc.body);

  return (
    <article className="blog-article">
      <div className="container blog-article__inner">
        <a href="/blog" className="blog-back">{t.blog.back_btn}</a>

        {cat && <div className="eyebrow blog-article__cat">{cat.name}</div>}
        <h1 className="display blog-article__title">{loc.title}</h1>
        {loc.subtitle && <p className="blog-article__subtitle text-muted">{loc.subtitle}</p>}

        <div className="blog-article__meta">
          <span className="mono">{post.author || t.blog.author_default}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{_bFmtDate(post.published_at, lang)}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{post.reading_time_min} {t.blog.reading_time}</span>
        </div>

        {loc.isFallback && (
          <div className="blog-lang-banner">
            <div className="blog-lang-banner__title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              {loc.originalLang === "es" ? t.blog.lang_banner_only_es_title : t.blog.lang_banner_only_en_title}
            </div>
            <p className="blog-lang-banner__body">
              {loc.originalLang === "es" ? t.blog.lang_banner_only_es_body : t.blog.lang_banner_only_en_body}
            </p>
          </div>
        )}

        {post.cover_image_url && (
          <figure className="blog-article__cover">
            <img src={post.cover_image_url} alt={loc.title} />
          </figure>
        )}

        <div
          className="blog-article__body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="blog-article__tags">
            {post.tags.map((tg) => (
              <span key={tg} className="blog-tag mono">#{tg}</span>
            ))}
          </div>
        )}

        <BlogDisclaimer t={t} />
      </div>
    </article>
  );
}

/* === Disclaimer obligatorio === */
function BlogDisclaimer({ t }) {
  return (
    <aside className="blog-disclaimer">
      <div className="eyebrow">— {t.blog.disclaimer_eyebrow}</div>
      <p>
        {t.blog.disclaimer_body_a} <strong>{t.blog.disclaimer_body_b}</strong>{t.blog.disclaimer_body_c}
      </p>
    </aside>
  );
}
