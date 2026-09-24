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
wedding.music.enabled     // sugerencias de canciones
wedding.gift.enabled      // luna de miel / regalo
wedding.dressCode.enabled // banda del dress code
wedding.rsvp.bus.enabled  // campos de autobús del formulario
```

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

### Tipografía

Hay **dos versiones**, y se cambia de una a otra con un número:

```ts
wedding.fontVersion = 1   // o 2
```

| | Títulos | Momentos grandes | Texto corrido |
| --- | --- | --- | --- |
| **1** | Cormorant Garamond semibold | Cormorant cursiva | Cormorant Garamond |
| **2** | Instrument Serif | Pinyon Script | Cormorant Garamond |

En las dos, los rótulos pequeños en mayúsculas van en Inter: un serif a 10px
con mucho tracking no se lee. El reparto de papeles está en `app/layout.tsx`.

Dos reglas, comprobables en el DOM con estilos calculados:

- La **cursiva** y la **script** nunca bajan de 28px. El texto corrido va
  redondo.
- `.font-display` nunca baja de 14px, y va en semibold **salvo en la versión
  2**: Instrument Serif solo tiene un grosor y forzarlo saldría en negrita
  falsa, así que ahí el peso esperado es 400.

## Local

```bash
npm install
cp .env.example .env.local   # y rellenar las dos claves
npm run dev
```

Panel de los novios: `/admin`. El acceso lo valida la función
`verify_client_password` de Postgres; no hay usuarios ni contraseñas en el
código.
