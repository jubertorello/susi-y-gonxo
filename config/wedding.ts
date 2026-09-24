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
  clientId: 'novia-y-novio',

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
        image: '',
        mapUrl: 'https://maps.app.goo.gl/NnuWki1xnYZcXoDs8',
      },
    ],
    /** Se muestra bajo las tarjetas. Cadena vacía para no poner ninguna. */
    note: 'Todo sucede en el mismo sitio: la ceremonia, el cóctel, la comida y la fiesta.',
  },

  // ---------------------------------------------------------------------------
  // CUENTA ATRÁS
  // ---------------------------------------------------------------------------
  countdown: {
    /** Texto sobre los números. Cadena vacía para no poner ninguno. */
    lead: '¡Empieza la cuenta atrás!',
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
   * Collage de la portada. Con la lista vacía la sección solo muestra la
   * cuenta atrás. Se dibuja con las que haya (1, 3, 6…).
   */
  photos: [] as string[],

  // ---------------------------------------------------------------------------
  // ITINERARIO
  // ---------------------------------------------------------------------------
  itinerary: {
    eyebrow: 'Plan del Día',
    title: 'Itinerario',
    subtitle: 'Hemos preparado todo para un día inolvidable',
    events: [
      { time: '12:15 H', title: 'La Ceremonia', image: '' },
      { time: '13:45 H', title: 'El Cóctel', image: '' },
      { time: '16:00 H', title: 'El Banquete', image: '' },
      { time: '18:00 H', title: 'El Baile & Fiesta', image: '' },
    ],
  },

  // ---------------------------------------------------------------------------
  // DRESS CODE
  // ---------------------------------------------------------------------------
  dressCode: {
    /** Pon `false` para ocultar la banda del dress code. */
    enabled: true,
    eyebrow: 'Dress Code',
    title: 'Elegantes para celebrar',
    items: [
      { who: 'Ellos', what: 'Traje' },
      { who: 'Ellas', what: 'Vestido o conjunto elegante' },
    ],
    closing: 'Poneos guapos, que nosotros ponemos la fiesta.',
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
    description: '¿Qué canciones no pueden faltar en la fiesta? Añádelas a la playlist.',
    ctaLabel: 'Sugerir Canciones',
    topLabel: 'Top canciones sugeridas:',
    allLabel: 'Playlist de los invitados',
    image: '',
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
    image: '',
    ctaHint: '¿Quieres hacernos un regalo? Haz click aquí:',
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
     * Cadena vacía mientras esté sin decidir: entonces se pide confirmar
     * «lo antes posible» y no se enseña ninguna fecha.
     */
    // TODO: poner el plazo cuando esté decidido, p. ej. '31 de enero'.
    deadline: '',
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
    cards: [
      {
        title: 'Servicio de Autobuses',
        body: 'Habrá autobuses de ida y de vuelta desde Santander y Torrelavega:',
        bullets: [
          '• Ida: horarios por confirmar, os avisaremos.',
          '• Vuelta: 21:30 para los veteranos.',
          '• Vuelta: 00:30 para los atrevidos, fin de fiesta.',
        ],
      },
      {
        title: 'Todo en el mismo sitio',
        body: 'La ceremonia es civil y se celebra en la propia finca, así que no hay que moverse en todo el día: ceremonia, cóctel, comida y fiesta suceden en el mismo lugar.',
        bullets: [] as string[],
      },
      {
        title: 'Acompañantes y niños',
        body: 'Cada invitación incluye un acompañante, que podéis indicar en el formulario. Si venís con niños, decídnoslo al confirmar para que podamos organizarlo todo con cariño.',
        bullets: [] as string[],
      },
    ],
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
      { id: 'musica', label: 'Música', mobileOnly: true },
      { id: 'viaje', label: 'Viaje · Regalo' },
      { id: 'informacion', label: 'Información' },
    ] as { id: string; label: string; mobileOnly?: boolean }[],
  },
};

/* =============================================================================
 *  IMÁGENES DEL SOBRE Y DE LOS FONDOS
 * =============================================================================
 *  Separadas del contenido porque cambian con el diseño, no con la boda.
 *  Viven en `public/`, así que se sirven desde el propio dominio.
 * ---------------------------------------------------------------------------*/
export const backgrounds = {
  /** Fondo del telón mientras se abre el sobre. */
  intro: '/papel.webp',

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
    cardBg: '/papel.webp',
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
   * Fondos por sección. `mobileTop` y `mobileBottom` se reparten la pantalla
   * en móvil; `desktop` sustituye a los dos a partir de 768px. Cadena vacía:
   * la sección se queda con su color de fondo.
   */
  sections: {
    hero: { mobileTop: '/papel.webp', mobileBottom: '', desktop: '/papel.webp' },
    locations: { mobileTop: '', mobileBottom: '', desktop: '' },
    photos: { mobileTop: '/papel.webp', mobileBottom: '', desktop: '/papel.webp' },
    itinerary: { mobileTop: '/papel.webp', mobileBottom: '', desktop: '/papel.webp' },
    music: { mobileTop: '', mobileBottom: '', desktop: '' },
    rsvp: { mobileTop: '/papel.webp', mobileBottom: '', desktop: '/papel.webp' },
    info: { mobileTop: '/papel.webp', mobileBottom: '', desktop: '/papel.webp' },
    contact: { mobileTop: '/papel.webp', mobileBottom: '', desktop: '/papel.webp' },
    footer: { mobileTop: '', mobileBottom: '', desktop: '' },
  },

  /** Franja de tela de rayas, para los separadores. Vacío: no se dibuja. */
  stripe: '/raya.webp',
};

/** Enlace de WhatsApp de cada miembro de la pareja, ya codificado. */
export const whatsappUrl = (quien: 'partnerA' | 'partnerB') => {
  const p = wedding.couple[quien];
  return `https://wa.me/${p.phone}?text=${encodeURIComponent(p.whatsappMessage)}`;
};
