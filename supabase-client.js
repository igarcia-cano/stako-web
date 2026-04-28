/* ============================================================
   STAKO — Supabase client (public + admin)
   ============================================================ */
(function () {
  const SUPABASE_URL = "https://xkctsnwrihrbqvckojix.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY3RzbndyaWhyYnF2Y2tvaml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjI0NDYsImV4cCI6MjA5Mjc5ODQ0Nn0.rM7CXUTYabwsU1c_knJMHAmTvduC0JUypg6-dfpyx0Q";

  const TOKEN_KEY = "stako-auth";

  function getToken() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expires_at && Date.now() / 1000 > parsed.expires_at) {
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

  // ---------- Public ----------
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

  // Public count is not possible after locking SELECT. Return null gracefully.
  async function getWaitlistCount() { return null; }

  // ---------- Auth ----------
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
  function signOut() { clearToken(); }
  function currentUser() { return getToken()?.user || null; }

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

  // ---------- Admin queries ----------
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

  // ---------- Bot licenses ----------
  async function adminGenActivationCode(purchaseId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/gen_bot_activation_code`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ p_purchase_id: purchaseId }),
    });
    if (!res.ok) {
      let msg = "No se pudo generar el código";
      try { const b = await res.json(); msg = b.message || b.hint || msg; } catch (_) {}
      return { ok: false, message: msg };
    }
    const code = await res.json(); // PostgREST devuelve el TEXT directo
    return { ok: true, code };
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
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ p_chat_id: chatId, p_reason: reason }),
    });
    return res.ok;
  }

  window.StakoSupabase = {
    joinWaitlist, getWaitlistCount,
    signIn, signOut, currentUser, isAdmin,
    adminListWaitlist, adminDeleteWaitlist,
    adminListBotPurchases, adminUpdateBotPurchase,
    adminListBookPurchases,
    adminGenActivationCode, adminListActivationCodes,
    adminListLicenses, adminRevokeLicense,
    SUPABASE_URL,
  };
})();
