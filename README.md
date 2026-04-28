# Stako — Web

Hub de Stako: landing pública, página del bot de trading y panel de administración.

🌐 **En producción:** [stakocapital.com](https://stakocapital.com)

Web estática (React + Babel standalone desde CDN, sin bundler) servida por Vercel.

## Estructura

- `index.html` / `landing.jsx` — landing pública
- `bot.html` / `bot-page.jsx` — página del bot
- `admin.html` / `admin.jsx` — panel de administración
- `cuenta.html` / `cuenta.jsx` — área de cliente
- `auth.jsx` — autenticación (login/signup, dropdown)
- `supabase-client.js` — cliente Supabase
- `i18n.js` — traducciones
- `shared.jsx` — componentes compartidos
- `tweaks-panel.jsx` — panel de ajustes
- `styles.css` / `admin.css` — estilos

## Deploy

Auto-deploy a Vercel desde `main`. El dominio principal es `stakocapital.com`; la URL antigua de Vercel redirige (307) al dominio principal.
