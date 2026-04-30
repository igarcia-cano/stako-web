/* ============================================================
   STAKO — Supabase client (public + auth + admin + cliente)
   ============================================================ */
(function () {
  const SUPABASE_URL = "https://xkctsnwrihrbqvckojix.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY3RzbndyaWhyYnF2Y2tvaml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjI0NDYsImV4cCI6MjA5Mjc5ODQ0Nn0.rM7CXUTYabwsU1c_knJMHAmTvduC0JUypg6-dfpyx0Q";

  const TOKEN_KEY = "stako-auth";

  /* ========== Token storage ========== */
  function getToken() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expires_at && Date.now() / 1000 > parsed.expires_at) {
        // Try to refresh in the background; for simplicity, just clear
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return parsed;
    } catch (_) { return null; }
  }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, JSON.stringify(t)); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  function authHeaders(useUserToken) {
    const t = useUserToken ? getToken() : null;
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${t?.access_token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };
  }

  /* ========== Public ========== */
  async function joinWaitlist({ email, lang, source = "landing" }) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: "POST",
      headers: { ...authHeaders(false), Prefer: "return=minimal" },
      body: JSON.stringify({ email, lang, source }),
    });
    if (res.status === 201 || res.status === 200 || res.status === 204) return { ok: true };
    let body = null;
    try { body = await res.json(); } catch (_) {}
    const dupe = body && (body.code === "23505" ||
      (typeof body.message === "string" && body.message.toLowerCase().includes("duplicate")));
    return { ok: false, duplicate: dupe, status: res.status, message: (body && (body.message || body.hint)) || "err" };
  }
  async function getWaitlistCount() { return null; }

  /* ========== Auth ========== */
  async function signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (res.ok && body.access_token) {
      setToken(body);
      return { ok: true, user: body.user };
    }
    return { ok: false, message: body.error_description || body.msg || body.error || "Login failed" };
  }

  async function signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        email, password,
        options: {
          // Tras pulsar el enlace del correo, Supabase manda al usuario aquí
          emailRedirectTo: window.location.origin + "/confirmado.html",
        },
      }),
    });
    const body = await res.json();
    if (res.ok) {
      // Si el proyecto requiere email confirmation, no hay access_token aún
      if (body.access_token) {
        setToken(body);
        return { ok: true, user: body.user, immediate: true };
      }
      return { ok: true, user: body.user || body, immediate: false,
               message: "Te hemos enviado un email para confirmar tu cuenta." };
    }
    return { ok: false, message: body.error_description || body.msg || body.error || "Signup failed" };
  }

  function signInWithGoogle() {
    const redirect = window.location.origin + "/cuenta.html";
    const url = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
    window.location.href = url;
  }

  async function resetPassword(email) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        options: { redirectTo: window.location.origin + "/cuenta.html" },
      }),
    });
    if (res.ok) return { ok: true, message: "Te hemos enviado un email para restablecer tu contraseña." };
    let body = null; try { body = await res.json(); } catch(_) {}
    return { ok: false, message: (body && (body.error_description || body.msg)) || "Error" };
  }

  async function updatePassword(newPassword) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: { ...authHeaders(true) },
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) return { ok: true };
    let body = null; try { body = await res.json(); } catch(_) {}
    return { ok: false, message: (body && (body.error_description || body.msg)) || "Error" };
  }

  // OAuth callback: tras Google viene a /cuenta.html#access_token=...
  function readOAuthFragment() {
    if (!window.location.hash) return null;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    if (!accessToken) return null;
    const expiresIn = parseInt(params.get("expires_in") || "3600", 10);
    const refreshToken = params.get("refresh_token") || "";
    const tokenType = params.get("token_type") || "bearer";
    return { accessToken, expiresIn, refreshToken, tokenType };
  }

  async function consumeOAuthFragment() {
    const frag = readOAuthFragment();
    if (!frag) return null;

    // Get user info using the access_token
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${frag.accessToken}`,
      },
    });
    if (!userRes.ok) return null;
    const user = await userRes.json();

    const tokenObj = {
      access_token: frag.accessToken,
      refresh_token: frag.refreshToken,
      token_type: frag.tokenType,
      expires_in: frag.expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + frag.expiresIn,
      user,
    };
    setToken(tokenObj);
    // Limpiar el hash
    window.history.replaceState({}, document.title, window.location.pathname);
    return user;
  }

  function signOut() { clearToken(); }
  function currentUser() { return getToken()?.user || null; }
  function currentSession() { return getToken(); }

  async function isAdmin() {
    const t = getToken();
    if (!t) return false;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admins?select=user_id&user_id=eq.${t.user.id}`, {
      headers: authHeaders(true),
    });
    if (!res.ok) return false;
    const rows = await res.json().catch(() => []);
    return rows.length > 0;
  }

  /* ========== Client (logged-in user) ========== */
  async function clientMyPurchases() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/client_my_purchases`, {
      method: "POST", headers: authHeaders(true), body: "{}",
    });
    if (!res.ok) return [];
    return res.json();
  }
  async function clientMyBooks() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/client_my_books`, {
      method: "POST", headers: authHeaders(true), body: "{}",
    });
    if (!res.ok) return [];
    return res.json();
  }
  async function clientMyActivationCode(purchaseId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/client_my_activation_code`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ p_purchase_id: purchaseId }),
    });
    if (!res.ok) return null;
    return (await res.json()) || null;
  }
  async function clientCancelSubscription(purchaseId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/client_cancel_subscription`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ p_purchase_id: purchaseId }),
    });
    if (!res.ok) return { ok: false, message: "Error" };
    return res.json();
  }
  async function clientReactivateSubscription(purchaseId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/client_reactivate_subscription`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ p_purchase_id: purchaseId }),
    });
    if (!res.ok) return { ok: false, message: "Error" };
    return res.json();
  }

  /* ========== Admin queries ========== */
  async function adminListWaitlist() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist?select=*&order=created_at.desc`, {
      headers: authHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  }
  async function adminDeleteWaitlist(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist?id=eq.${id}`, {
      method: "DELETE", headers: authHeaders(true),
    });
    return res.ok;
  }
  async function adminListBotPurchases() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bot_purchases?select=*&order=created_at.desc`, {
      headers: authHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  }
  async function adminUpdateBotPurchase(id, patch) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bot_purchases?id=eq.${id}`, {
      method: "PATCH", headers: { ...authHeaders(true), Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    return res.ok;
  }
  async function adminListBookPurchases() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/book_purchases?select=*&order=created_at.desc`, {
      headers: authHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  }
  async function adminGenActivationCode(purchaseId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/gen_bot_activation_code`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ p_purchase_id: purchaseId }),
    });
    if (!res.ok) {
      let msg = "No se pudo generar el código";
      try { const b = await res.json(); msg = b.message || b.hint || msg; } catch (_) {}
      return { ok: false, message: msg };
    }
    const code = await res.json();
    return { ok: true, code };
  }
  async function adminCreateSubscription({ email, amount_eur, payment_method, months, notes, waitlist_id }) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_subscription`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({
        p_email: email,
        p_amount_eur: amount_eur,
        p_payment_method: payment_method || null,
        p_months: months || 1,
        p_notes: notes || null,
        p_waitlist_id: waitlist_id || null,
      }),
    });
    if (!res.ok) {
      let msg = "Error";
      try { const b = await res.json(); msg = b.message || b.hint || msg; } catch (_) {}
      return { ok: false, message: msg };
    }
    return await res.json();
  }
  async function adminRenewSubscription(purchaseId, months) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_renew_subscription`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ p_purchase_id: purchaseId, p_months: months }),
    });
    if (!res.ok) return { ok: false, message: "Error" };
    return await res.json();
  }
  async function adminSetExpiresAt(purchaseId, expiresAt) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_set_expires_at`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ p_purchase_id: purchaseId, p_expires_at: expiresAt }),
    });
    if (!res.ok) return { ok: false, message: "Error" };
    return await res.json();
  }
  async function adminListActivationCodes(purchaseId) {
    const url = purchaseId
      ? `${SUPABASE_URL}/rest/v1/bot_activation_codes?select=*&purchase_id=eq.${purchaseId}&order=created_at.desc`
      : `${SUPABASE_URL}/rest/v1/bot_activation_codes?select=*&order=created_at.desc`;
    const res = await fetch(url, { headers: authHeaders(true) });
    if (!res.ok) return [];
    return res.json();
  }
  async function adminListLicenses() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bot_licenses?select=*&order=activated_at.desc`, {
      headers: authHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  }
  async function adminRevokeLicense(chatId, reason = "cancelled") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/revoke_bot_license`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ p_chat_id: chatId, p_reason: reason }),
    });
    return res.ok;
  }

  /* ========== Blog (public read + admin CRUD) ========== */
  function _slugify(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);
  }

  async function blogListCategories() {
    const url = `${SUPABASE_URL}/rest/v1/blog_categories?select=*&order=display_order.asc`;
    const res = await fetch(url, { headers: authHeaders(false) });
    if (!res.ok) return [];
    return res.json();
  }

  async function blogListPublishedPosts({ category, q, limit = 20, offset = 0 } = {}) {
    let url = `${SUPABASE_URL}/rest/v1/blog_posts?select=id,slug,title,subtitle,excerpt,category_slug,tags,cover_image_url,author,published_at,reading_time_min&status=eq.published&order=published_at.desc&limit=${limit}&offset=${offset}`;
    if (category) url += `&category_slug=eq.${encodeURIComponent(category)}`;
    if (q)        url += `&or=(title.ilike.*${encodeURIComponent(q)}*,excerpt.ilike.*${encodeURIComponent(q)}*)`;
    const res = await fetch(url, { headers: authHeaders(false) });
    if (!res.ok) return [];
    return res.json();
  }

  async function blogGetPostBySlug(slug) {
    const url = `${SUPABASE_URL}/rest/v1/blog_posts?select=*&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`;
    const res = await fetch(url, { headers: authHeaders(false) });
    if (!res.ok) return null;
    const arr = await res.json();
    return arr[0] || null;
  }

  /* --- Admin --- */
  async function adminBlogListAllPosts({ status, q } = {}) {
    let url = `${SUPABASE_URL}/rest/v1/blog_posts?select=id,slug,title,subtitle,excerpt,category_slug,tags,cover_image_url,author,status,published_at,reading_time_min,created_at,updated_at&order=created_at.desc&limit=200`;
    if (status && status !== "all") url += `&status=eq.${status}`;
    if (q) url += `&or=(title.ilike.*${encodeURIComponent(q)}*,slug.ilike.*${encodeURIComponent(q)}*)`;
    const res = await fetch(url, { headers: authHeaders(true) });
    if (!res.ok) return [];
    return res.json();
  }

  async function adminBlogGetPost(id) {
    const url = `${SUPABASE_URL}/rest/v1/blog_posts?select=*&id=eq.${id}&limit=1`;
    const res = await fetch(url, { headers: authHeaders(true) });
    if (!res.ok) return null;
    const arr = await res.json();
    return arr[0] || null;
  }

  async function adminBlogCreatePost(data) {
    const slug = (data.slug && data.slug.trim()) || _slugify(data.title);
    const body = {
      slug,
      title: data.title,
      subtitle: data.subtitle || null,
      excerpt: data.excerpt || null,
      body_md: data.body_md || "",
      category_slug: data.category_slug || null,
      tags: data.tags || [],
      cover_image_url: data.cover_image_url || null,
      author: data.author || "Equipo Stako",
      status: data.status || "draft",
      published_at: data.published_at || null,
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
      method: "POST",
      headers: { ...authHeaders(true), Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    if (!res.ok) return { ok: false, message: txt };
    const arr = JSON.parse(txt);
    return { ok: true, post: arr[0] };
  }

  async function adminBlogUpdatePost(id, patch) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(true), Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    const txt = await res.text();
    if (!res.ok) return { ok: false, message: txt };
    const arr = JSON.parse(txt);
    return { ok: true, post: arr[0] };
  }

  async function adminBlogDeletePost(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${id}`, {
      method: "DELETE",
      headers: authHeaders(true),
    });
    return { ok: res.ok };
  }

  async function adminBlogPublish(id) {
    return adminBlogUpdatePost(id, { status: "published" });
  }
  async function adminBlogUnpublish(id) {
    return adminBlogUpdatePost(id, { status: "draft" });
  }

  window.StakoSupabase = {
    // Public
    joinWaitlist, getWaitlistCount,
    // Auth
    signIn, signUp, signInWithGoogle, signOut,
    resetPassword, updatePassword,
    currentUser, currentSession, isAdmin,
    consumeOAuthFragment,
    // Client
    clientMyPurchases, clientMyBooks, clientMyActivationCode,
    clientCancelSubscription, clientReactivateSubscription,
    // Admin
    adminListWaitlist, adminDeleteWaitlist,
    adminListBotPurchases, adminUpdateBotPurchase,
    adminListBookPurchases,
    adminGenActivationCode, adminListActivationCodes,
    adminListLicenses, adminRevokeLicense,
    adminCreateSubscription, adminRenewSubscription, adminSetExpiresAt,
    // Blog public
    blogListCategories, blogListPublishedPosts, blogGetPostBySlug,
    // Blog admin
    adminBlogListAllPosts, adminBlogGetPost,
    adminBlogCreatePost, adminBlogUpdatePost, adminBlogDeletePost,
    adminBlogPublish, adminBlogUnpublish,
    // Constants
    SUPABASE_URL,
  };
})();
