# Susi & Gonxo · 27.03.2027

Invitación de boda. Next.js 15 + Tailwind 4 + Supabase.

## Dónde se toca qué

| Quiero cambiar…                          | Archivo |
| ---------------------------------------- | ------- |
| Textos, fechas, horarios, enlaces, flags | `config/wedding.ts` |
| Colores                                  | `app/globals.css` (bloque `@theme`) |
| Láminas del sobre y fondos               | `config/wedding.ts` → `backgrounds` |

Los componentes no llevan contenido: todo sale de `config/wedding.ts`.

### Encender y apagar secciones

```ts
wedding.music.enabled    // sugerencias de canciones
wedding.gift.enabled     // luna de miel / regalo
wedding.buses.enabled    // sección de autobuses
wedding.hotels.enabled   // sección de hoteles
wedding.rsvp.bus.enabled // campos de autobús del formulario
```

El orden de la página es: portada, lugar, cuenta atrás, carrete, itinerario,
luna de miel, confirmación, música, datos de interés, dudas y pie.

**Datos de Interés** se arma desde `info.blocks`: dress code, hoteles y
autobuses, en ese orden. Cada bloque tiene título, texto, una lista de
`items` y una línea de cierre, y elige cómo se dibuja la lista:

| `layout` | Cómo queda |
| --- | --- |
| `lista` | Cada entrada con un filete encima, su rótulo corto y el detalle |
| `parejas` | Dos columnas compactas, sin filetes, con icono propio |

Los iconos se piden por nombre — `bus`, `cama`, `traje`, `vestido` — en el
bloque o en cada entrada. El traje y el vestido están dibujados a mano en
`app/page.tsx` porque lucide no los trae. Con `items` vacío solo se enseña
el texto, que es como está hoy hoteles.

Las **ilustraciones** se quitan poniendo la cadena vacía en su `image`
(`locations.places[].image`, `itinerary.events[].image`, `gift.image`,
`music.image`, `contact.image`). El hueco no se dibuja y el bloque se recoloca solo.
`wedding.photos: []` deja la sección con solo la cuenta atrás.

### El sobre

Las proporciones son obligatorias o la animación se descuadra:

| Capa                            | Tamaño   |
| ------------------------------- | -------- |
| `front`, `back`, `pocket`       | 840 × 600 |
| `flapClosed`, `flapOpen`, `flapShadow` | 840 × 549 |

`pocket` lleva el escote recortado en **transparente**: va por delante de la
tarjeta, así que el papel se ve por ahí mientras sale. Si se cambian las
láminas hay que ajustar también `backgrounds.envelopeLayers`.

### El papel del fondo

El papel NO se pone por sección. Lo pinta una sola capa fija en
`app/layout.tsx`, del tamaño de la pantalla, y las secciones van
transparentes por encima.

Es a propósito: con una capa por sección, `cover` escalaba la textura al alto
de cada una, así que en las cortas salía al 53% (trama fina) y en las largas
al 111% (trama gruesa y sucia). Con la capa fija va siempre al 56%.

Si una sección necesita OTRA lámina, se pone en `backgrounds.sections`; con
las cadenas vacías se ve el papel global.

### Adornos de eucalipto

`backgrounds.corners` enmarca la sección de confirmar asistencia con dos
esquinas: `topLeft` arriba a la izquierda y `bottomRight` abajo a la derecha.
Van detrás del contenido y no se pueden pulsar. `width` y `widthDesktop`
controlan cuánto ocupan; en móvil van más pequeñas para no rozar el título.


`backgrounds.envelopeSprigs` son las cuatro ramas de la pantalla del sobre,
dos por lado. Cada una asoma medio cortada por el borde, y la gracia está en
que **el tallo nazca del costado** y las hojas miren hacia dentro: por eso la
lámina se elige por dónde tiene la raíz (`guirnalda` y `racimo` a la
izquierda, `hojas` a la derecha) y `flip` la refleja cuando hay que llevar esa
raíz al otro lado. `aspect` lleva la proporción nativa de la lámina para que
`contain` no la achate.

`backgrounds.eucalyptus.left` y `.right` dibujan cenefas verticales a los
lados de la portada, el lugar, el itinerario y las dudas. `backgrounds.divider`
sustituye el filete de 1px por una ramita. Con las cadenas vacías no se dibuja
nada, que es como está ahora.

Las cenefas se repiten en vertical, así que las láminas tienen que ser **tiras
altas y estrechas con fondo transparente** (PNG o WebP), no una composición
cuadrada. Van en `public/eucalipto/`. El ancho y la opacidad se ajustan desde
la propia configuración, sin tocar código.

### Tipografía

Hay **dos versiones**, y se cambia de una a otra con un número:

```ts
wedding.fontVersion = 1   // o 2
```

| | Títulos y rótulos | Texto corrido |
| --- | --- | --- |
| **1** | Cormorant Garamond semibold · rótulos en Inter | Cormorant Garamond |
| **2** | Instrument Serif en todo | Cormorant Garamond |

El reparto de papeles está en `app/layout.tsx`: `--font-display`,
`--font-script`, `--font-ui` y `--font-body`. Los componentes no saben qué
versión está activa.

Tres reglas, comprobables en el DOM con estilos calculados:

- **Ningún texto baja de 14px**, en ninguna versión ni en ninguna anchura.
- **Todos los cuerpos son pares**: 14, 16, 18, 20, 24, 28, 30, 32, 36, 44, 48
  y 72px.

- La **cursiva** y la **script** nunca bajan de 28px. El texto corrido va
  redondo.
- `.font-display` nunca baja de 14px, y va en semibold **salvo en la versión
  2**: Instrument Serif solo tiene un grosor y forzarlo saldría en negrita
  falsa, así que ahí el peso esperado es 400. Por lo mismo, en la versión 2
  una regla de `globals.css` anula el `font-medium` de los rótulos.

Casi todo el texto sobre fondo claro va en `ink` (#39402f): 10.24:1 sobre el
papel. El oliva `primary` se reserva para fondos, botones y bordes.

### El menú de secciones

El desplegable de móvil se abre con CSS (`grid-rows-[0fr]` a `grid-rows-[1fr]`
con el hijo en `overflow-hidden`), no con Framer Motion, y no es capricho: para
animar `height: 'auto'` Motion tiene que MEDIR el elemento, y mientras mide
guarda y restaura la posición de la página con `window.scrollTo(0, 0)`. Esa
restauración caía encima del salto suave del enlace recién pulsado y lo
cancelaba — el menú se cerraba y la página no se movía. En escritorio nunca
falló porque ese bloque no se dibuja.

Si algún día se vuelve a animar con Motion cualquier alto automático dentro de
la barra, los enlaces del menú volverán a parecer muertos.

## Local

```bash
npm install
cp .env.example .env.local   # y rellenar las dos claves
npm run dev
```

Panel de los novios: `/admin`. El acceso lo valida la función
`verify_client_password` de Postgres; no hay usuarios ni contraseñas en el
código.
