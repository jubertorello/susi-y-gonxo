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
luna de miel, confirmación, música, autobuses, hoteles, datos de interés,
dudas y pie. El dress code es una tarjeta más dentro de datos de interés.

Las **ilustraciones** se quitan poniendo la cadena vacía en su `image`
(`locations.places[].image`, `itinerary.events[].image`, `gift.image`,
`music.image`). El hueco no se dibuja y el bloque se recoloca solo.
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

### Adornos de eucalipto

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

## Local

```bash
npm install
cp .env.example .env.local   # y rellenar las dos claves
npm run dev
```

Panel de los novios: `/admin`. El acceso lo valida la función
`verify_client_password` de Postgres; no hay usuarios ni contraseñas en el
código.
