/* =============================================================================
 *  CONFIGURACIÓN DE LA BODA
 * =============================================================================
 *  Este es el único archivo que hay que tocar para montar otra boda: textos,
 *  fechas, imágenes y enlaces. Los colores viven en las variables `@theme` de
 *  `app/globals.css`.
 *
 *  `clientId` es la clave que enlaza esta invitación con sus registros de
 *  Supabase (tablas `rsvps` y `songs`). Debe ser único por boda y coincidir
 *  con el `client_id` dado de alta en la base de datos.
 *
 *  ILUSTRACIONES: cualquier campo `image` acepta la cadena vacía. Cuando está
 *  vacío el hueco no se dibuja y el bloque se recoloca solo.
 * ---------------------------------------------------------------------------*/

export const wedding = {
  /** Identificador de la pareja en Supabase (client_id). Único por boda. */
  clientId: 'susi-y-gonxo',

  /**
   * VERSIÓN TIPOGRÁFICA. Se cambia solo este número.
   *   1 · Cormorant Garamond en todo.
   *   2 · Instrument Serif en los títulos, Pinyon Script en el sobre y la
   *       firma del pie, Cormorant en el texto corrido.
   * El reparto vive en `app/layout.tsx`.
   */
  fontVersion: 2 as 1 | 2,

  // ---------------------------------------------------------------------------
  // LA PAREJA
  // ---------------------------------------------------------------------------
  couple: {
    /** Iniciales del logo en la barra de navegación. */
    initials: 'S&G',
    /** Nombre corto, usado en títulos y metadatos. */
    shortNames: 'Susi & Gonxo',
    /** Nombre corto en formato "X y Z" (sobre, footer, alts de fotos). */
    joinedNames: 'Susi y Gonxo',

    partnerA: {
      firstName: 'Susana',
      lastName: 'Abascal Deusto',
      /** Teléfono con prefijo internacional y sin signos (para wa.me). */
      // TODO: sustituir por el teléfono real de Susi.
      phone: '34600000001',
      whatsappLabel: 'WhatsApp Susi',
      whatsappMessage: '¡Hola Susi! Tengo una duda sobre la boda...',
    },
    partnerB: {
      firstName: 'Gonzalo',
      lastName: 'Díaz-Terán Pañeda',
      // TODO: sustituir por el teléfono real de Gonxo.
      phone: '34600000002',
      whatsappLabel: 'WhatsApp Gonxo',
      whatsappMessage: '¡Hola Gonxo! Tengo una duda sobre la boda...',
    },
  },

  // ---------------------------------------------------------------------------
  // FECHA
  // ---------------------------------------------------------------------------
  date: {
    /**
     * Fecha y hora con zona horaria. De aquí sale la cuenta atrás.
     * El 27/03/2027 España sigue en horario de invierno (+01:00): el cambio
     * de hora es el domingo 28.
     */
    iso: '2027-03-27T12:15:00+01:00',
    /** Cómo se escribe en la cabecera, en tres piezas. */
    month: 'Marzo',
    day: '27',
    year: '2027',
    /** Línea bajo la fecha. */
    weekdayTime: 'Sábado • 12:15 H',
  },

  seo: {
    title: 'Susi & Gonxo · 27.03.2027',
    description:
      '¡Nos casamos! El 27 de marzo de 2027 lo celebramos en la Finca de San Juan y nos encantaría que nos acompañes.',
  },

  // ---------------------------------------------------------------------------
  // EL SOBRE (animación de entrada)
  // ---------------------------------------------------------------------------
  envelope: {
    preTitle: 'Tienes una carta',
    preSubtitle: 'de Susi y Gonxo',
    preButton: 'Abrir',
    cardIntro: 'Estás invitado/a a la boda de',
    cardNames: 'Susi y Gonxo',
    cardButton: 'Ver Invitación',
    animation: {
      /** 1 es el ritmo normal; 0.8 la acelera, 1.2 la hace más lenta. */
      timeScale: 1,
      /** En escritorio, la tarjeta se aparta al final para dejar ver el sobre. */
      finalComposition: false,
      /** Lo que se anuncia a los lectores de pantalla en cada paso. */
      announcements: {
        flipping: 'El sobre gira para mostrar el dorso',
        flapOpening: 'Se abre la solapa del sobre',
        cardOut: 'Sale la tarjeta de la invitación',
        done: 'Invitación abierta',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // CABECERA
  // ---------------------------------------------------------------------------
  hero: {
    /** Párrafos introductorios, en orden. Añade o quita los que quieras. */
    intro: [
      'Hace 12 años comenzó nuestra historia, siendo casi dos niños y sin imaginar que algún día llegaríamos hasta aquí.',
      'Desde entonces hemos crecido juntos, compartido sueños, viajes, retos, risas y un sinfín de momentos, construyendo poco a poco un proyecto común lleno de ilusión y alegría.',
      'Después de todo este tiempo, sabemos que lo mejor todavía está por venir y hemos decidido dar un paso más en nuestra historia…',
    ],
    announcement: '¡Nos casamos!',
    subtitle: 'Y nos hace inmensamente felices poder celebrarlo con vosotros.',
    /** Línea bajo los nombres de la pareja. */
    namesCaption:
      'Queremos celebrar este “sí” rodeados de quienes habéis formado parte de nuestra historia.',
  },

  // ---------------------------------------------------------------------------
  // UBICACIONES
  // ---------------------------------------------------------------------------
  locations: {
    eyebrow: 'Ubicación',
    title: 'Dónde y Cuándo',
    ctaLabel: 'Ver ubicación',
    /** Una tarjeta por lugar. Con una sola, la tarjeta se centra. */
    places: [
      {
        title: 'Ceremonia y Celebración',
        name: 'Finca de San Juan',
        address: 'Barrio de San Juan, s/n · 39660 Villabáñez, Cantabria',
        time: 'Ceremonia civil · 12:15 H',
        image: '/finca.webp',
        mapUrl: 'https://maps.app.goo.gl/NnuWki1xnYZcXoDs8',
      },
    ],
    /** Se muestra bajo las tarjetas. Cadena vacía para no poner ninguna. */
    note: '',
  },

  // ---------------------------------------------------------------------------
  // CUENTA ATRÁS
  // ---------------------------------------------------------------------------
  countdown: {
    /** Texto sobre los números. Cadena vacía para no poner ninguno. */
    lead: '¡Empieza la cuenta atrás!',
    /** Línea bajo los números. Cadena vacía para no ponerla. */
    tagline: '',
    /** `true` dibuja el relojito con la aguja en marcha sobre el título. */
    clock: true,
    labels: {
      days: 'Días',
      hours: 'Horas',
      minutes: 'Minutos',
      seconds: 'Segundos',
    },
    today: '¡Hoy nos casamos!',
    past: 'Nos casamos',
  },

  // ---------------------------------------------------------------------------
  // FOTOS
  // ---------------------------------------------------------------------------
  /**
   * Fotos del carrete, en el orden en que pasan. Súbelas a `public/fotos/` y
   * pon aquí sus rutas, p. ej. '/fotos/foto-1.webp'. Se dibuja con las que
   * haya; cuantas más, más largo el bucle.
   */
  photos: [] as string[],

  // ---------------------------------------------------------------------------
  // CARRETE DE FOTOS
  // ---------------------------------------------------------------------------
  gallery: {
    /**
     * Pon `false` para ocultar el carrete entero. Ahora mismo apagado hasta
     * decidir si habrá fotos de los novios.
     */
    enabled: false,
    title: '',
    /** Ilustración sobre el carrete. Cadena vacía para no poner ninguna. */
    image: '',
    /** Segundos que tarda el carrete en dar una vuelta completa. */
    speed: 45,
    /**
     * Marcos vacíos que se dibujan MIENTRAS NO HAYA FOTOS, para dejar el hueco
     * a la vista durante el montaje. En cuanto `photos` tenga alguna, dejan de
     * salir solos.
     *
     * ⚠️ Antes de publicar: o hay fotos, o `enabled: false`. Si no, los
     * invitados verían los marcos vacíos.
     */
    placeholders: 6,
  },

  // ---------------------------------------------------------------------------
  // ITINERARIO
  // ---------------------------------------------------------------------------
  itinerary: {
    eyebrow: 'Plan del Día',
    title: 'Itinerario',
    subtitle: 'Hemos preparado todo para un día inolvidable',
    events: [
      { time: '12:15 H', title: 'La Ceremonia', image: '/itinerario/ceremonia-v2.webp' },
      { time: '13:45 H', title: 'El Cóctel', image: '/itinerario/coctel-v3.webp' },
      { time: '16:00 H', title: 'El Banquete', image: '/itinerario/banquete-v2.webp' },
      { time: '18:00 H', title: 'El Baile & Fiesta', image: '/itinerario/baile-v2.webp' },
    ],
  },

  // ---------------------------------------------------------------------------
  // MÚSICA
  // ---------------------------------------------------------------------------
  music: {
    /** Pon `false` para ocultar toda la sección de sugerencias musicales. */
    enabled: true,
    /** `true` la dibuja discreta, en una franja estrecha en vez de una tarjeta. */
    compact: true,
    title: 'Ayúdanos con la música',
    /** En la cinta no se usa; queda por si vuelve a ser una sección grande. */
    description: '¿Qué canciones no pueden faltar en la fiesta? Añádelas a la playlist.',
    ctaLabel: 'Sugerir',
    topLabel: 'Top canciones sugeridas:',
    allLabel: 'Playlist de los invitados',
    image: '/dj.webp',
    /** `true` arranca la canción de fondo en cuanto el invitado toca la pantalla. */
    autoplay: false,
    /** Cadena vacía: no hay música de fondo y el botón de sonido no aparece. */
    backgroundAudio: '',
    modal: {
      title: 'Sugerir Canción',
      subtitle: 'Queremos que la pista de baile no pare de sonar',
      songPlaceholder: 'Ej. La Camisa Negra',
      artistPlaceholder: 'Ej. Juanes',
      submitLabel: 'Añadir a la lista',
      successLabel: '¡Canción añadida con éxito!',
      songLabel: 'Título de la Canción',
      artistLabel: 'Artista',
    },
  },

  // ---------------------------------------------------------------------------
  // LUNA DE MIEL / REGALO
  // ---------------------------------------------------------------------------
  gift: {
    /** Pon `false` para ocultar la sección del regalo. */
    enabled: true,
    eyebrow: 'Luna de Miel · Regalo',
    title: 'Nuestra próxima aventura',
    description:
      'Nuestra historia comenzó hace 12 años y todavía nos quedan muchos lugares por descubrir juntos. El próximo nos llevará hasta África, donde nos espera una luna de miel entre safaris, naturaleza y playas de ensueño.',
    invitation:
      'Teneros con nosotros en este día ya es el mejor regalo. Pero si queréis ayudarnos a sumar recuerdos a esta nueva aventura, podéis hacerlo aquí.',
    /** Línea de cierre bajo el botón. Cadena vacía para no ponerla. */
    closing:
      'Gracias por acompañarnos, de una forma u otra, en todo lo que está por venir.',
    image: '/safari-jeep.webp',
    /** Línea sobre el botón. Cadena vacía: no se pone ninguna. */
    ctaHint: '',
    ctaLabel: 'Ver datos regalo',
    modal: {
      title: 'Luna de Miel · Regalo',
      description:
        'Teneros con nosotros ya es el mejor regalo. Si además queréis ayudarnos a sumar recuerdos en nuestra luna de miel por África, ponemos a vuestra disposición nuestra cuenta bancaria:',
      ibanLabel: 'Número de cuenta (IBAN):',
      // TODO: sustituir por el IBAN real.
      iban: 'ESXX XXXX XXXX XXXX XXXX XXXX',
      swiftLabel: 'Código Swift/BIC:',
      // TODO: sustituir por el Swift/BIC real.
      swift: 'XXXXXXXX',
      swiftHint: 'Con este código podrás recibir transferencias internacionales',
      holders: 'Susana A. D. y Gonzalo D. T. P.',
      copiedLabel: '¡Copiado!',
      thanks: '¡Muchísimas gracias por formar parte de este sueño! ❤️',
    },
  },

  // ---------------------------------------------------------------------------
  // CONFIRMACIÓN DE ASISTENCIA
  // ---------------------------------------------------------------------------
  rsvp: {
    title: 'Confirma tu asistencia',
    /**
     * Fecha límite mostrada en el formulario y en la introducción.
     * Cadena vacía: se pide confirmar «lo antes posible», sin fecha.
     */
    /** Tres semanas antes de la boda. */
    deadline: '6 de marzo',
    bus: {
      /** Pon `false` si no hay servicio de autobuses (oculta los campos). */
      enabled: true,
      idaHint: 'Santander o Torrelavega → Finca de San Juan · horarios por confirmar',
      vueltaHint: 'Finca de San Juan → Torrelavega y Santander · 21:30 y 00:30',
    },
    companions: {
      /** Máximo de acompañantes que puede indicar cada invitado. */
      max: 1,
      /** Aviso bajo el contador. Cadena vacía para no ponerlo. */
      note: 'Solo se puede indicar un acompañante.',
      /**
       * Nota con asterisco, para los casos especiales. Cadena vacía para
       * no ponerla.
       */
      childrenNote:
        'Si venís con niños, avisadnos en el mensaje para que podamos organizarlo todo.',
    },
  },

  // ---------------------------------------------------------------------------
  // DATOS DE INTERÉS
  // ---------------------------------------------------------------------------
  info: {
    eyebrow: 'Información',
    title: 'Datos de Interés',
    /**
     * Un bloque por tema, en el orden en que aparecen. El `id` es el ancla
     * que usa el menú para saltar a cada uno.
     *
     *  · `layout: 'lista'`    → lista con filetes: cada entrada con su rótulo
     *                           corto arriba y, debajo, su `detail` de una
     *                           línea o varias con `lines`.
     *  · `layout: 'parejas'`  → dos columnas compactas, sin filetes.
     *  · `icon`: 'lazo', 'cama' o 'bus'. Cadena vacía para no poner ninguno.
     */
    blocks: [
      {
        id: 'dress-code',
        layout: 'parejas',
        icon: 'lazo',
        title: 'Dress Code',
        body: 'Elegantes para celebrar.',
        items: [
          { label: 'Ellos', detail: 'Traje' },
          { label: 'Ellas', detail: 'Vestido o conjunto elegante' },
        ],
        note: 'Poneos guapos, que nosotros ponemos la fiesta.',
      },
      {
        id: 'hoteles',
        layout: 'lista',
        icon: 'cama',
        title: 'Recomendación de Hoteles',
        // TODO: sustituir por los hoteles y condiciones cuando estén cerrados.
        body: 'Estamos cerrando acuerdos con varios alojamientos de la zona. En cuanto lo tengamos os pasaremos los nombres, los precios y cómo reservar.',
        items: [] as { label: string; detail?: string; lines?: string[] }[],
        note: '',
      },
      {
        id: 'autobuses',
        layout: 'lista',
        icon: 'bus',
        title: 'Autobuses',
        body: 'Habrá autobuses de ida y de vuelta desde Santander y Torrelavega.',
        items: [
          {
            label: 'Ida',
            // TODO: horario y paradas de ejemplo, a falta de los definitivos.
            lines: [
              'Santander, Jardines de Pereda · 11:00',
              'Torrelavega, Bulevar Demetrio Herrero · 11:20',
            ],
          },
          {
            label: 'Vuelta',
            lines: ['Para los veteranos · 21:30', 'Para los atrevidos · 00:30, fin de fiesta'],
          },
        ],
        note: 'En el formulario de confirmación podréis indicarnos si los necesitáis.',
      },
    ] as {
      id: string;
      layout: string;
      icon: string;
      title: string;
      body: string;
      items: { label: string; detail?: string; lines?: string[] }[];
      note: string;
    }[],
  },

  // ---------------------------------------------------------------------------
  // DUDAS
  // ---------------------------------------------------------------------------
  contact: {
    title: '¿Dudas?',
    description:
      'Si tenéis alguna duda, pregunta o necesitáis consultarnos algo, no dudéis en llamarnos o escribirnos por WhatsApp:',
  },

  // ---------------------------------------------------------------------------
  // PIE
  // ---------------------------------------------------------------------------
  footer: {
    headline: '¡Os esperamos!',
    signature: 'Susi y Gonxo',
    /** Línea bajo la firma. */
    dateLine: '27 de Marzo de 2027 • Villabáñez, Cantabria',
  },

  // ---------------------------------------------------------------------------
  // NAVEGACIÓN
  // ---------------------------------------------------------------------------
  nav: {
    ctaLabel: 'Confirma tu asistencia',
    /** `mobileOnly: true` → el enlace solo aparece en el menú desplegable. */
    links: [
      { id: 'lugar', label: 'Lugar' },
      { id: 'itinerario', label: 'Itinerario' },
      { id: 'viaje', label: 'Luna de Miel · Regalo' },
      { id: 'musica', label: 'Música', mobileOnly: true },
      /* Los tres de dentro de Datos de Interés: no son secciones, pero así
         se sabe que están. Sustituyen al enlace genérico de «Información». */
      { id: 'dress-code', label: 'Dress Code', mobileOnly: true },
      { id: 'hoteles', label: 'Hoteles', mobileOnly: true },
      { id: 'autobuses', label: 'Autobuses', mobileOnly: true },
    ] as { id: string; label: string; mobileOnly?: boolean }[],
  },
};

/* =============================================================================
 *  IMÁGENES DEL SOBRE Y DE LOS FONDOS
 * =============================================================================
 *  Separadas del contenido porque cambian con el diseño, no con la boda.
 *  Viven en `public/`, así que se sirven desde el propio dominio.
 * ---------------------------------------------------------------------------*/
const CLOUD = 'https://res.cloudinary.com/scihumn2';
const img = (nombre: string) => `${CLOUD}/image/upload/${nombre}`;

/**
 * Textura del papel. La misma que usa mariu-y-nacho.
 * En `public/papel.webp` queda la alternativa local, por si se quiere volver
 * a servir desde el propio dominio en vez de desde Cloudinary.
 */
const PAPEL = img('texturapapel-limoncello-scaled_cgfzov.jpg');

/** Tela de rayas del forro del sobre. Se reutiliza de fondo en el pie. */
const RAYA = '/raya.webp';

export const backgrounds = {
  /** Fondo del telón mientras se abre el sobre. */
  intro: PAPEL,

  envelope: {
    /** Frente del sobre, cerrado y visto de cara. 840 × 600. */
    front: '/sobre/frente.webp',
    /** Dorso: el forro de rayas y el bolsillo. 840 × 600. */
    back: '/sobre/dorso.webp',
    /**
     * Bolsillo con el escote recortado en transparente: va por DELANTE de la
     * tarjeta, así que el papel se ve por el escote mientras sale. 840 × 600.
     */
    pocket: '/sobre/bolsillo.webp',
    /** Solapa cerrada, cara exterior con el lacre. Gira de 0° a 90°. 840 × 549. */
    flapClosed: '/sobre/solapa-cerrada.webp',
    /** Solapa abierta, forro de rayas. Aparece a 89° y baja a 0°. 840 × 549. */
    flapOpen: '/sobre/solapa-abierta.webp',
    /** Sombra que proyecta la solapa al abrirse. Vacío: no se dibuja. 840 × 549. */
    flapShadow: '/sobre/solapa-sombra.png',
    /** Textura del papel de la tarjeta que sale del sobre. */
    cardBg: PAPEL,
  },

  /**
   * Proporciones reales de las imágenes, para que las capas encajen. Si se
   * cambian las láminas hay que cambiar también estos números, o la animación
   * se descuadra.
   */
  envelopeLayers: {
    envelope: 840 / 600,
    flapClosed: 549 / 840,
    flapOpen: 549 / 840,
  },

  /**
   * Fondos por sección, para poner una lámina distinta en alguna.
   * `mobileTop` y `mobileBottom` se reparten la pantalla en móvil; `desktop`
   * sustituye a los dos a partir de 768px.
   *
   * Con las tres cadenas vacías la sección es transparente y se ve el papel
   * del fondo global, que va siempre al tamaño de la pantalla. Es lo que
   * queremos casi siempre: poniendo el papel por sección, cada una lo
   * escalaba a su propio alto y en las largas la trama salía gruesa.
   */
  sections: {
    hero: { mobileTop: '', mobileBottom: '', desktop: '' },
    locations: { mobileTop: '', mobileBottom: '', desktop: '' },
    /** La cuenta atrás va sobre la tela de rayas, como el pie. */
    countdown: { mobileTop: RAYA, mobileBottom: '', desktop: RAYA },
    photos: { mobileTop: '', mobileBottom: '', desktop: '' },
    itinerary: { mobileTop: '', mobileBottom: '', desktop: '' },
    music: { mobileTop: '', mobileBottom: '', desktop: '' },
    rsvp: { mobileTop: '', mobileBottom: '', desktop: '' },
    info: { mobileTop: '', mobileBottom: '', desktop: '' },
    contact: { mobileTop: '', mobileBottom: '', desktop: '' },
    footer: { mobileTop: RAYA, mobileBottom: '', desktop: RAYA },
  },

  /** Franja de tela de rayas. Vacío: no se dibuja. */
  stripe: RAYA,

  /**
   * RAMAS DE EUCALIPTO
   * Cenefas verticales a los lados de algunas secciones, como en
   * mariu-y-nacho. Con las dos cadenas vacías no se dibuja nada.
   *
   * Hacen falta PNG con FONDO TRANSPARENTE, altos y estrechos (una tira de
   * ramas), porque se repiten en vertical. Déjalos en `public/eucalipto/`.
   */
  eucalyptus: {
    left: '',
    right: '',
    /** Ancho de cada cenefa y cuánto se transparenta. */
    width: '20vw',
    maxWidth: '190px',
    opacity: 0.5,
  },

  /**
   * Ramita suelta que separa bloques, en vez del filete de 1px.
   * Cadena vacía: se queda el filete.
   */
  divider: '',
};

/** Enlace de WhatsApp de cada miembro de la pareja, ya codificado. */
export const whatsappUrl = (quien: 'partnerA' | 'partnerB') => {
  const p = wedding.couple[quien];
  return `https://wa.me/${p.phone}?text=${encodeURIComponent(p.whatsappMessage)}`;
};
