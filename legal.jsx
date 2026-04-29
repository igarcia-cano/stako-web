/* ============================================================
   STAKO — Páginas legales
   Renderiza una de: aviso-legal | privacidad | cookies | riesgo
   La página se determina por window.STAKO_LEGAL_PAGE (set en HTML)
   ============================================================ */
const { useState: _lUseState, useEffect: _lUseEffect } = React;

/* Datos del titular — CAMBIAR cuando los proporcione el usuario */
const TITULAR = {
  nombre: "[NOMBRE COMPLETO O RAZÓN SOCIAL DEL TITULAR]",
  nif: "[NIF / CIF]",
  direccion: "[DIRECCIÓN POSTAL COMPLETA]",
  email: "stakobot@outlook.com",
  web: "stakocapital.com",
  registroMercantil: null, // poner si es sociedad: "Registro Mercantil de [Provincia], Tomo X, Folio Y, Hoja Z"
};

const FECHA_ULT_ACT = "29 de abril de 2026";

function _lFormatTitular() {
  return TITULAR;
}

/* === Layout común === */
function LegalLayout({ title, eyebrow, lastUpdate, children }) {
  return (
    <article className="legal">
      <div className="container legal__inner">
        <header className="legal__head">
          <a href="/" className="legal__back">← {window.STAKO_I18N?.[document.documentElement.lang || "es"]?.legal?.back || "Inicio"}</a>
          {eyebrow && <div className="eyebrow legal__eyebrow">— {eyebrow}</div>}
          <h1 className="display legal__title">{title}</h1>
          {lastUpdate && (
            <p className="legal__date mono text-muted">
              Última actualización: {lastUpdate}
            </p>
          )}
        </header>
        <div className="legal__body">{children}</div>
        <footer className="legal__foot">
          <p className="text-muted">
            ¿Dudas o consultas sobre este documento? Escríbenos a{" "}
            <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>.
          </p>
        </footer>
      </div>
    </article>
  );
}

/* === 1. AVISO LEGAL === */
function AvisoLegal() {
  const t = TITULAR;
  return (
    <LegalLayout title="Aviso legal" eyebrow="Información legal y condiciones de uso" lastUpdate={FECHA_ULT_ACT}>
      <p className="legal__lead">
        El presente Aviso Legal regula el acceso y la utilización del sitio web{" "}
        <strong>{t.web}</strong> (en adelante, "el sitio web" o "Stako"), en cumplimiento de la
        Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio
        Electrónico (LSSI-CE).
      </p>

      <h2>1. Datos identificativos del titular</h2>
      <p>
        En cumplimiento del artículo 10 de la LSSI-CE, se informa de los datos identificativos del
        titular del sitio web:
      </p>
      <ul className="legal__data">
        <li><strong>Titular:</strong> {t.nombre}</li>
        <li><strong>NIF:</strong> {t.nif}</li>
        <li><strong>Domicilio:</strong> {t.direccion}</li>
        <li><strong>Correo electrónico:</strong> <a href={`mailto:${t.email}`}>{t.email}</a></li>
        <li><strong>Sitio web:</strong> {t.web}</li>
        {t.registroMercantil && <li><strong>Inscripción registral:</strong> {t.registroMercantil}</li>}
      </ul>

      <h2>2. Objeto y ámbito de aplicación</h2>
      <p>
        Este sitio web tiene por objeto ofrecer información sobre los productos y servicios de Stako:
        un bot de trading automatizado que opera sobre la cuenta de Binance del propio usuario, contenidos
        editoriales de educación e historia económica, y, en el futuro, libros sobre inversión y economía.
      </p>
      <p>
        El acceso al sitio web es libre y gratuito, salvo en aquellos servicios o productos que requieran
        suscripción o pago, claramente identificados como tales. La utilización del sitio web atribuye la
        condición de usuario e implica la aceptación plena de las disposiciones contenidas en este Aviso
        Legal en la versión publicada en el momento del acceso.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>El usuario se compromete a:</p>
      <ul>
        <li>Hacer un uso adecuado, lícito y diligente de los contenidos y servicios del sitio web.</li>
        <li>No emplear los contenidos con fines o efectos contrarios a la ley, la moral, las buenas costumbres o el orden público.</li>
        <li>No realizar actividades que dañen, sobrecarguen o deterioren el sitio web o impidan su normal utilización por otros usuarios.</li>
        <li>No introducir programas, virus, macros, applets, controles o cualquier otro dispositivo lógico o secuencia de caracteres que causen o puedan causar alteraciones en los sistemas informáticos del titular o de terceros.</li>
        <li>No suplantar la identidad de otros usuarios ni utilizar credenciales de acceso ajenas.</li>
        <li>Respetar los derechos de propiedad intelectual e industrial del titular y de terceros.</li>
      </ul>

      <h2>4. Naturaleza de los contenidos: información educativa, no asesoramiento</h2>
      <p>
        <strong>Los contenidos del sitio web tienen carácter exclusivamente informativo, educativo y
        divulgativo</strong>. En ningún caso constituyen asesoramiento financiero, recomendación
        personalizada de inversión, oferta o invitación a comprar o vender criptoactivos, valores o
        cualquier otro instrumento financiero.
      </p>
      <p>
        Stako no es asesor financiero registrado en la Comisión Nacional del Mercado de Valores (CNMV)
        ni presta servicios de inversión en el sentido del artículo 140 del texto refundido de la Ley
        del Mercado de Valores. Cualquier decisión financiera tomada por el usuario es de su exclusiva
        responsabilidad y debe basarse en su propio análisis y, en su caso, en el asesoramiento de un
        profesional debidamente autorizado.
      </p>
      <p>
        Para más información sobre los riesgos asociados a los productos sobre los que opera el bot, consulte
        el <a href="/aviso-riesgo">Aviso de riesgo</a>.
      </p>

      <h2>5. Servicio del bot de trading</h2>
      <p>
        El bot de trading que se ofrece a los suscriptores es un <strong>software de ejecución
        automatizada</strong> que opera sobre la cuenta personal de Binance del usuario, mediante
        claves API que el propio usuario configura y a las que el titular del sitio no tiene acceso
        directo. El usuario conserva en todo momento la propiedad y el control de sus fondos.
      </p>
      <p>
        El titular no presta servicios de custodia, intermediación, gestión de cartera ni ningún otro
        servicio de los enumerados en el artículo 30 del Reglamento (UE) 2023/1114 (MiCA). Las
        rentabilidades pasadas, en caso de mostrarse, no constituyen ninguna garantía de resultados
        futuros. El usuario asume íntegramente el riesgo de las operaciones ejecutadas en su nombre
        por el bot.
      </p>

      <h2>6. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del sitio web, incluyendo a título enunciativo pero no limitativo los
        textos, fotografías, gráficos, imágenes, iconos, tecnología, software, links, contenidos
        audiovisuales o sonoros, su diseño gráfico y códigos fuente, son propiedad del titular o de
        terceros, sin que pueda entenderse cedido al usuario ningún derecho de explotación más allá
        del estrictamente necesario para el correcto uso de la web.
      </p>
      <p>
        Las marcas, nombres comerciales o signos distintivos son titularidad del titular del sitio o
        de terceros, sin que el acceso al sitio web atribuya derecho alguno sobre ellos. Queda prohibida
        la reproducción, distribución, comunicación pública, transformación o cualquier otra actividad
        que pueda realizarse con los contenidos sin la autorización expresa y por escrito del titular.
      </p>

      <h2>7. Enlaces a sitios de terceros</h2>
      <p>
        El sitio web puede contener enlaces a sitios web de terceros (Binance, Telegram, redes sociales,
        proveedores de información financiera, etc.). El titular no controla ni se hace responsable del
        contenido, las políticas de privacidad ni las prácticas de dichos sitios. La inclusión de estos
        enlaces no implica ninguna recomendación, ratificación o asociación con sus titulares.
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        El titular no garantiza la disponibilidad continuada del sitio web ni la ausencia de errores,
        interrupciones, omisiones o fallos técnicos. Tampoco se responsabiliza de los daños y perjuicios
        que pudieran derivarse de:
      </p>
      <ul>
        <li>Interferencias, omisiones, interrupciones, virus informáticos o averías en la red telemática.</li>
        <li>Retrasos o bloqueos en el uso causados por deficiencias o sobrecargas en internet o en los servidores del titular o de terceros.</li>
        <li>El uso indebido o inadecuado del sitio web por parte del usuario.</li>
        <li>Decisiones de inversión adoptadas por el usuario sobre la base de los contenidos publicados.</li>
        <li>Pérdidas económicas o de cualquier otro tipo derivadas de las operaciones ejecutadas por el bot de trading sobre la cuenta del usuario.</li>
      </ul>

      <h2>9. Modificaciones</h2>
      <p>
        El titular se reserva el derecho a modificar el presente Aviso Legal en cualquier momento, así
        como cualesquiera otras condiciones generales o particulares, reglamentos de uso, instrucciones
        o avisos publicados en el sitio web. Toda modificación será publicada en el propio sitio y
        entrará en vigor desde el momento de su publicación.
      </p>

      <h2>10. Legislación aplicable y jurisdicción</h2>
      <p>
        El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier
        controversia que pudiera derivarse del acceso o uso del sitio web, las partes se someten a los
        Juzgados y Tribunales del domicilio del titular, salvo cuando la normativa aplicable, en
        particular en relaciones con consumidores, disponga lo contrario.
      </p>
    </LegalLayout>
  );
}

/* === 2. POLÍTICA DE PRIVACIDAD === */
function Privacidad() {
  const t = TITULAR;
  return (
    <LegalLayout title="Política de privacidad" eyebrow="Tratamiento de datos personales" lastUpdate={FECHA_ULT_ACT}>
      <p className="legal__lead">
        En Stako tratamos tus datos personales con el máximo respeto y conforme al Reglamento (UE)
        2016/679 (RGPD) y a la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos
        Personales y garantía de los derechos digitales (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul className="legal__data">
        <li><strong>Responsable:</strong> {t.nombre}</li>
        <li><strong>NIF:</strong> {t.nif}</li>
        <li><strong>Domicilio:</strong> {t.direccion}</li>
        <li><strong>Correo de contacto:</strong> <a href={`mailto:${t.email}`}>{t.email}</a></li>
      </ul>

      <h2>2. ¿Qué datos recabamos y con qué finalidad?</h2>

      <h3>a) Lista de espera (waitlist)</h3>
      <p>
        Si te apuntas a la lista de espera del bot, recogemos tu <strong>correo electrónico</strong>{" "}
        y, opcionalmente, el idioma de tu navegador. La finalidad es notificarte cuando el producto
        esté disponible y, en su caso, enviarte información comercial relacionada con Stako.
      </p>
      <p><strong>Base jurídica:</strong> tu consentimiento expreso al apuntarte (art. 6.1.a RGPD).</p>

      <h3>b) Cuenta de usuario</h3>
      <p>
        Si te creas una cuenta para gestionar tu suscripción, recogemos: <strong>correo
        electrónico</strong>, <strong>contraseña</strong> (almacenada cifrada con bcrypt en
        Supabase, no accesible para el responsable), e información de tu suscripción
        (estado, fecha de vencimiento, método de pago). Si te registras con Google, recibimos
        adicionalmente el nombre y la imagen de perfil que tu cuenta de Google nos comparta.
      </p>
      <p><strong>Base jurídica:</strong> ejecución del contrato de prestación de servicios (art. 6.1.b RGPD).</p>

      <h3>c) Suscripción al bot y código de activación</h3>
      <p>
        Cuando contratas el bot, almacenamos los datos de tu suscripción y el <strong>identificador
        de chat de Telegram</strong> (chat_id) que se vincula a tu licencia para autorizar al bot a
        operar. <strong>No almacenamos en ningún momento tus claves API de Binance ni tenemos acceso
        a tus fondos.</strong>
      </p>
      <p><strong>Base jurídica:</strong> ejecución del contrato (art. 6.1.b RGPD).</p>

      <h3>d) Comunicaciones por correo electrónico</h3>
      <p>
        Si nos escribes a <a href={`mailto:${t.email}`}>{t.email}</a>, conservamos tu correo y el
        contenido del mensaje el tiempo necesario para gestionar tu consulta y, en su caso, dar
        cumplimiento a obligaciones legales.
      </p>
      <p><strong>Base jurídica:</strong> tu consentimiento al iniciar la comunicación (art. 6.1.a RGPD).</p>

      <h3>e) Datos de navegación y cookies</h3>
      <p>
        Cuando visitas el sitio, recogemos datos técnicos como tu dirección IP, tipo de navegador,
        sistema operativo y páginas visitadas, mediante cookies y tecnologías similares. Consulta los
        detalles en nuestra <a href="/cookies">Política de cookies</a>.
      </p>

      <h2>3. ¿Durante cuánto tiempo conservamos tus datos?</h2>
      <ul>
        <li><strong>Lista de espera:</strong> hasta que solicites darte de baja o, como máximo, dos años desde el último contacto comercial.</li>
        <li><strong>Cuenta y suscripción:</strong> mientras la cuenta esté activa y, tras su baja, durante los plazos de prescripción legal de obligaciones fiscales y mercantiles (hasta 6 años).</li>
        <li><strong>Comunicaciones por email:</strong> el tiempo necesario para resolver la consulta, salvo obligación legal de conservación superior.</li>
        <li><strong>Datos de navegación:</strong> según se detalla en la Política de cookies.</li>
      </ul>

      <h2>4. ¿A quién comunicamos tus datos?</h2>
      <p>
        Solo compartimos tus datos con los <strong>encargados del tratamiento</strong> necesarios
        para prestar el servicio, todos ellos vinculados por un contrato conforme al art. 28 del RGPD:
      </p>
      <ul>
        <li><strong>Supabase Inc.</strong> (Estados Unidos): proveedor de base de datos y autenticación. La transferencia internacional se ampara en las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea.</li>
        <li><strong>Vercel Inc.</strong> (Estados Unidos): proveedor de alojamiento web. Misma garantía mediante Cláusulas Contractuales Tipo.</li>
        <li><strong>Google LLC</strong> (Estados Unidos): si te autenticas con Google. Misma garantía.</li>
        <li><strong>Telegram FZ-LLC</strong> (Emiratos Árabes Unidos): para la entrega de notificaciones del bot.</li>
        <li><strong>Binance</strong>: la conexión la realiza el usuario directamente con sus propias claves API; el titular no transmite datos a Binance.</li>
      </ul>
      <p>
        No vendemos ni cedemos tus datos a terceros con fines comerciales ajenos a la prestación del
        servicio. Solo comunicaremos tus datos a las autoridades cuando exista una obligación legal de
        hacerlo.
      </p>

      <h2>5. Tus derechos</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li><strong>Acceso:</strong> conocer qué datos tuyos tratamos.</li>
        <li><strong>Rectificación:</strong> corregir los datos inexactos o incompletos.</li>
        <li><strong>Supresión ("derecho al olvido"):</strong> solicitar que eliminemos tus datos cuando ya no sean necesarios.</li>
        <li><strong>Limitación:</strong> pedir que limitemos el tratamiento en ciertos casos (por ejemplo, mientras se verifica una rectificación).</li>
        <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado, de uso común y lectura mecánica.</li>
        <li><strong>Oposición:</strong> oponerte al tratamiento basado en intereses legítimos o con fines de marketing directo.</li>
        <li><strong>Retirar el consentimiento</strong> en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.</li>
        <li><strong>No ser objeto de decisiones automatizadas</strong> con efectos jurídicos. Stako no toma decisiones automatizadas que produzcan tales efectos sobre los usuarios.</li>
      </ul>
      <p>
        Para ejercer estos derechos, escríbenos a <a href={`mailto:${t.email}`}>{t.email}</a> indicando
        en el asunto "Protección de datos" y acompañando, en su caso, copia de tu DNI o documento
        equivalente que acredite tu identidad. Responderemos en el plazo máximo de un mes.
      </p>

      <h2>6. Reclamación ante la AEPD</h2>
      <p>
        Si consideras que el tratamiento de tus datos no se ajusta a la normativa, tienes derecho a
        presentar una reclamación ante la <strong>Agencia Española de Protección de Datos</strong>{" "}
        (C/ Jorge Juan, 6, 28001 Madrid; <a href="https://www.aepd.es" target="_blank" rel="noreferrer">www.aepd.es</a>).
        Te agradeceremos que, antes de hacerlo, contactes con nosotros para intentar resolver
        cualquier incidencia.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos personales contra
        el acceso no autorizado, la pérdida, alteración o destrucción. Estas medidas incluyen el cifrado
        en tránsito (HTTPS) y en reposo, controles de acceso basados en roles (Row Level Security en
        nuestra base de datos), copias de seguridad y registros de actividad.
      </p>

      <h2>8. Menores de edad</h2>
      <p>
        Los servicios de Stako no están dirigidos a menores de 18 años. No recogemos conscientemente
        datos de menores. Si detectamos que hemos tratado datos de un menor sin autorización paterna,
        procederemos a su eliminación inmediata.
      </p>

      <h2>9. Modificaciones de esta política</h2>
      <p>
        Podemos actualizar esta política para reflejar cambios en la normativa o en nuestros servicios.
        La versión vigente será siempre la publicada en esta URL, con indicación de la fecha de última
        actualización. Los cambios sustanciales se notificarán a los usuarios registrados por email.
      </p>
    </LegalLayout>
  );
}

/* === 3. POLÍTICA DE COOKIES === */
function Cookies() {
  const t = TITULAR;
  const reopenBanner = () => {
    try {
      localStorage.removeItem("stako-cookies-consent");
      window.dispatchEvent(new CustomEvent("stako:cookies-reopen"));
    } catch (_) {}
  };

  return (
    <LegalLayout title="Política de cookies" eyebrow="Información sobre cookies" lastUpdate={FECHA_ULT_ACT}>
      <p className="legal__lead">
        Esta política explica qué son las cookies, qué tipos utilizamos en {t.web} y cómo puedes
        gestionar tu consentimiento, en cumplimiento del artículo 22 de la LSSI-CE y de las directrices
        de la Agencia Española de Protección de Datos (AEPD).
      </p>

      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Una cookie es un pequeño fichero de texto que un sitio web almacena en tu navegador o
        dispositivo cuando lo visitas. Las cookies permiten al sitio recordar tu actividad y
        preferencias (idioma, tema, sesión iniciada, etc.) durante un periodo de tiempo, para que no
        tengas que reconfigurarlas cada vez que vuelves.
      </p>

      <h2>2. ¿Qué cookies utiliza este sitio web?</h2>
      <p>
        En Stako utilizamos exclusivamente cookies <strong>técnicas y de personalización propias</strong>,
        estrictamente necesarias para el funcionamiento del sitio. <strong>No utilizamos cookies
        publicitarias, de seguimiento de terceros, ni de análisis comportamental</strong>.
      </p>

      <div className="legal__table-wrap">
        <table className="legal__table">
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Tipo</th>
              <th>Finalidad</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">stako-theme</td>
              <td>Técnica · Propia</td>
              <td>Recordar tu preferencia de tema (claro / oscuro).</td>
              <td>Persistente · 1 año</td>
            </tr>
            <tr>
              <td className="mono">stako-lang</td>
              <td>Técnica · Propia</td>
              <td>Recordar el idioma seleccionado (ES / EN).</td>
              <td>Persistente · 1 año</td>
            </tr>
            <tr>
              <td className="mono">stako-auth</td>
              <td>Técnica · Propia</td>
              <td>Mantener tu sesión iniciada en zonas privadas (cuenta y admin).</td>
              <td>Sesión · hasta cierre o expiración del token</td>
            </tr>
            <tr>
              <td className="mono">stako-cookies-consent</td>
              <td>Técnica · Propia</td>
              <td>Recordar tu decisión sobre el aviso de cookies.</td>
              <td>Persistente · 6 meses</td>
            </tr>
            <tr>
              <td className="mono">supabase-auth-*</td>
              <td>Técnica · Tercero (Supabase)</td>
              <td>Token de sesión y refresco para la autenticación.</td>
              <td>Sesión · hasta expiración</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="legal__note">
        Estas cookies están <strong>exentas del deber de obtener consentimiento previo</strong> por
        considerarse estrictamente necesarias, según el considerando 66 de la Directiva 2009/136/CE y
        la Guía de Cookies de la AEPD.
      </p>

      <h2>3. Cookies de terceros</h2>
      <p>
        Determinadas funcionalidades de la web cargan recursos de terceros (CDN para librerías, servicios
        de autenticación con Google, etc.). Estos terceros pueden a su vez instalar cookies técnicas
        propias que escapan a nuestro control. Te recomendamos consultar las políticas de privacidad de:
      </p>
      <ul>
        <li><strong>Supabase:</strong> <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">supabase.com/privacy</a></li>
        <li><strong>Vercel:</strong> <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">vercel.com/legal/privacy-policy</a></li>
        <li><strong>Google (si usas login con Google):</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">policies.google.com/privacy</a></li>
      </ul>

      <h2>4. ¿Cómo gestionar tu consentimiento?</h2>
      <p>
        Cuando entras por primera vez en el sitio, te mostramos un aviso de cookies en el que puedes
        aceptar, rechazar o configurar tu preferencia. Como solo utilizamos cookies técnicas necesarias,
        rechazarlas implicaría no poder usar funciones básicas como la sesión iniciada o la preferencia
        de idioma.
      </p>
      <p>
        Puedes <button type="button" className="legal__inline-btn" onClick={reopenBanner}>
        reabrir el panel de cookies aquí</button> para revisar o cambiar tu decisión.
      </p>

      <h2>5. Configuración desde tu navegador</h2>
      <p>
        Adicionalmente, puedes configurar tu navegador para bloquear o eliminar cookies en cualquier
        momento. Te dejamos los enlaces a las instrucciones de los principales navegadores:
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/borrar-cookies-y-datos-del-sitio-firefox" target="_blank" rel="noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer">Microsoft Edge</a></li>
      </ul>

      <h2>6. Actualizaciones</h2>
      <p>
        Podremos modificar esta política cuando se introduzcan cookies nuevas o cambien las existentes.
        Cualquier cambio se publicará en esta URL, indicando la fecha de la última actualización.
      </p>
    </LegalLayout>
  );
}

/* === 4. AVISO DE RIESGO === */
function AvisoRiesgo() {
  return (
    <LegalLayout title="Aviso de riesgo" eyebrow="Información sobre los riesgos de la inversión en criptoactivos" lastUpdate={FECHA_ULT_ACT}>
      <div className="legal__warning">
        <div className="eyebrow legal__warning-eye">— Advertencia obligatoria CNMV</div>
        <p className="legal__warning-text">
          La inversión en criptoactivos no está regulada, puede no ser adecuada para inversores minoristas
          y perderse la totalidad del importe invertido.
        </p>
        <p className="legal__warning-sub mono text-muted">
          Texto literal de la Circular 1/2022 de la CNMV, de 10 de enero, sobre publicidad de criptoactivos.
        </p>
      </div>

      <p className="legal__lead">
        Este documento amplía el mensaje obligatorio de advertencia y detalla los principales riesgos a
        los que te expones cuando inviertes en criptoactivos o utilizas un servicio de trading
        automatizado sobre ellos. Léelo con atención antes de contratar el bot o tomar cualquier
        decisión de inversión.
      </p>

      <h2>1. Riesgos generales de la inversión en criptoactivos</h2>

      <h3>1.1 Pérdida total del capital</h3>
      <p>
        Los criptoactivos son productos de inversión de alto riesgo. Su precio puede caer de forma rápida
        y profunda, y existe la posibilidad real de <strong>perder todo el capital invertido</strong>. No
        existen mecanismos de garantía de depósitos ni de garantía de inversiones (FGD, FOGAIN) que
        cubran las pérdidas en criptoactivos.
      </p>

      <h3>1.2 Volatilidad extrema</h3>
      <p>
        El precio de los criptoactivos puede experimentar variaciones del 10%, 20% o más en un solo día.
        Esta volatilidad no se debe únicamente a factores económicos, sino también a noticias regulatorias,
        movimientos de grandes tenedores ("ballenas"), actividad en redes sociales, ciberataques o cambios
        técnicos en los protocolos subyacentes.
      </p>

      <h3>1.3 Falta de regulación y transición a MiCA</h3>
      <p>
        Hasta la plena entrada en vigor del <strong>Reglamento (UE) 2023/1114 (MiCA)</strong>, la mayor
        parte de la actividad sobre criptoactivos en España opera con un marco regulatorio limitado. A
        partir del <strong>1 de julio de 2026</strong>, solo podrán prestar servicios sobre criptoactivos
        los proveedores autorizados por la CNMV u otras autoridades competentes de la UE. Antes de
        contratar cualquier servicio de un tercero, verifica su autorización en los registros oficiales
        de CNMV y ESMA.
      </p>

      <h3>1.4 Falta de protecciones del inversor minorista</h3>
      <p>
        En la mayor parte de operaciones con criptoactivos no se aplican las protecciones de la
        normativa MiFID II (test de idoneidad, deber de mejor ejecución, segregación patrimonial, etc.)
        que sí amparan a los inversores en valores e instrumentos financieros tradicionales.
      </p>

      <h3>1.5 Riesgos tecnológicos</h3>
      <p>
        Los criptoactivos dependen de tecnologías como blockchain, contratos inteligentes y exchanges
        digitales que pueden sufrir fallos, vulnerabilidades, hackeos, bifurcaciones (forks),
        congestión de red o errores de oracle. La pérdida o el robo de tus claves privadas, o el
        compromiso de las claves API que conectes a un servicio externo, pueden resultar en pérdidas
        irrecuperables.
      </p>

      <h3>1.6 Riesgos de liquidez</h3>
      <p>
        Determinados criptoactivos pueden experimentar caídas drásticas de liquidez en momentos de
        estrés del mercado, lo que dificulta o impide vender posiciones a precios cercanos a los de
        mercado. Esto puede convertir pérdidas latentes en pérdidas realizadas mucho mayores.
      </p>

      <h3>1.7 Riesgos legales y fiscales</h3>
      <p>
        El marco legal y fiscal de los criptoactivos está en evolución. Los rendimientos generados
        deben declararse a la Agencia Tributaria conforme a la normativa vigente. Es responsabilidad del
        usuario informarse de sus obligaciones declarativas (IRPF, modelo 720, modelo 721, etc.) y, en
        caso necesario, contar con asesoramiento fiscal especializado.
      </p>

      <h3>1.8 Estafas y fraudes</h3>
      <p>
        El sector de los criptoactivos concentra una elevada actividad fraudulenta: phishing, esquemas
        Ponzi, falsos brokers, manipulación de mercado, exchanges que no devuelven los fondos, y
        suplantaciones de identidad. Desconfía de cualquier oferta que prometa rentabilidades garantizadas
        o desproporcionadas.
      </p>

      <h2>2. Riesgos específicos del trading automatizado (bot)</h2>

      <h3>2.1 Sin garantía de rentabilidad</h3>
      <p>
        El bot ejecuta una estrategia basada en indicadores técnicos. <strong>No garantiza, ni de forma
        explícita ni implícita, ningún resultado positivo</strong>. Las simulaciones, backtests o
        rentabilidades pasadas que se muestren en el sitio web son meramente ilustrativas y, en ningún
        caso, son indicativas de resultados futuros. Periodos largos de pérdidas son no solo posibles
        sino habituales en cualquier estrategia automatizada.
      </p>

      <h3>2.2 Riesgos de ejecución</h3>
      <p>
        El bot opera mediante claves API en tu cuenta de Binance. La ejecución puede verse afectada por:
        latencia de red, indisponibilidad temporal del exchange, slippage (diferencia entre el precio
        objetivo y el ejecutado), límites de operaciones por unidad de tiempo, errores de software o
        modificaciones unilaterales en la API del exchange. Cualquiera de estos factores puede provocar
        pérdidas adicionales o impedir el cierre oportuno de una posición.
      </p>

      <h3>2.3 Tú mantienes el control de los fondos, y la responsabilidad</h3>
      <p>
        Stako <strong>no custodia tus fondos en ningún momento</strong>. Las claves API que configures
        están en tu cuenta de Binance y deberías limitarlas a operaciones de spot, sin permisos de
        retirada. Aun así, el riesgo financiero de las operaciones ejecutadas por el bot es{" "}
        <strong>íntegramente tuyo</strong>. Stako no compensará ninguna pérdida derivada de las
        operaciones del bot.
      </p>

      <h3>2.4 Riesgo de plataforma (Binance)</h3>
      <p>
        El servicio depende de la disponibilidad y solvencia del exchange Binance. Cualquier incidencia
        que afecte a Binance (suspensión de operaciones, problemas regulatorios, ciberataques, quiebra)
        puede afectar a tu capacidad de operar y, en escenarios extremos, a la disponibilidad de tus
        fondos depositados allí.
      </p>

      <h2>3. Aclaraciones sobre el rol de Stako</h2>
      <ul>
        <li>Stako <strong>no es asesor financiero</strong> registrado en la CNMV.</li>
        <li>Stako <strong>no es un proveedor de servicios sobre criptoactivos</strong> en el sentido del Reglamento MiCA.</li>
        <li>Stako <strong>no custodia, no compra ni vende criptoactivos por cuenta del cliente</strong>.</li>
        <li>Stako <strong>no garantiza rentabilidades</strong> de ninguna estrategia ni producto.</li>
        <li>Los contenidos editoriales del blog tienen finalidad <strong>exclusivamente educativa e informativa</strong>, nunca de recomendación de inversión personalizada.</li>
      </ul>

      <h2>4. Recomendaciones antes de invertir</h2>
      <ul>
        <li>Invierte únicamente capital cuya pérdida total puedas asumir sin afectar a tu situación financiera.</li>
        <li>Diversifica. No concentres tu patrimonio en criptoactivos.</li>
        <li>Verifica que cualquier proveedor con el que operes esté autorizado en el registro de la CNMV o de ESMA.</li>
        <li>Aprende de fuentes oficiales: CNMV, Banco de España, ESMA, AEPD.</li>
        <li>Consulta a un asesor financiero o fiscal autorizado antes de tomar decisiones importantes.</li>
      </ul>

      <h2>5. Información oficial de referencia</h2>
      <ul>
        <li><a href="https://www.cnmv.es/portal/Inversor/Avisos-Riesgos.aspx" target="_blank" rel="noreferrer">CNMV — Avisos al inversor sobre criptoactivos</a></li>
        <li><a href="https://www.cnmv.es/portal/mica/regulacion-criptoactivos" target="_blank" rel="noreferrer">CNMV — Reglamento MiCA</a></li>
        <li><a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2022-666" target="_blank" rel="noreferrer">BOE — Circular 1/2022 CNMV sobre publicidad de criptoactivos</a></li>
        <li><a href="https://www.finanzasparatodos.es" target="_blank" rel="noreferrer">Finanzas para todos (CNMV + Banco de España)</a></li>
      </ul>
    </LegalLayout>
  );
}

/* === Router que decide qué página montar === */
function LegalApp() {
  const page = window.STAKO_LEGAL_PAGE || "aviso-legal";
  if (page === "privacidad")  return <Privacidad />;
  if (page === "cookies")     return <Cookies />;
  if (page === "riesgo")      return <AvisoRiesgo />;
  return <AvisoLegal />;
}

Object.assign(window, { LegalApp });
