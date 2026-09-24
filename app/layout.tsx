import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { wedding, backgrounds } from '@/config/wedding';

/**
 * DOS VERSIONES TIPOGRÁFICAS
 * Se elige con `wedding.fontVersion` en `config/wedding.ts`.
 *
 *   1 · Cormorant Garamond para los títulos e Inter para los rótulos
 *       pequeños en mayúsculas.
 *   2 · Instrument Serif para TODO lo que no sea texto corrido: títulos,
 *       rótulos, botones y formulario. El texto corrido sigue en Cormorant.
 *
 * Cada familia se carga con su variable y aquí se reparten los papeles
 * (`--font-display`, `--font-script`, `--font-ui`, `--font-body`). Cambiar de
 * versión es cambiar un número: ningún componente sabe cuál está activa.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/**
 * Solo tiene un grosor (400). Por eso en la versión 2 la display no va
 * semibold y los rótulos pierden su `font-medium`: forzarlo saldría en
 * negrita falsa. Lo neutraliza una regla en `globals.css`.
 */
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument',
});

/**
 * Las redes piden la imagen con la dirección entera, no con `/compartir.webp`.
 * `metadataBase` es quien la completa. En Vercel el dominio sale del entorno;
 * en local y como respaldo, del `seo.url` de la configuración.
 */
const dominio = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : wedding.seo.url;

const tarjeta = [
  { url: wedding.seo.image, width: 1200, height: 630, alt: wedding.seo.imageAlt },
];

export const metadata: Metadata = {
  metadataBase: new URL(dominio),
  title: wedding.seo.title,
  description: wedding.seo.description,
  openGraph: {
    title: wedding.seo.title,
    description: wedding.seo.description,
    type: 'website',
    locale: 'es_ES',
    siteName: wedding.couple.shortNames,
    url: '/',
    images: tarjeta,
  },
  twitter: {
    card: 'summary_large_image',
    title: wedding.seo.title,
    description: wedding.seo.description,
    images: tarjeta,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const v2 = wedding.fontVersion === 2;

  const papeles = {
    /* El texto corrido no cambia entre versiones. */
    '--font-body': 'var(--font-cormorant)',
    /* Rótulos en mayúsculas, botones y formulario. */
    '--font-ui': v2 ? 'var(--font-instrument)' : 'var(--font-inter)',
    /* Títulos. */
    '--font-display': v2 ? 'var(--font-instrument)' : 'var(--font-cormorant)',
    '--peso-display': v2 ? '400' : '600',
    /* Los dos momentos grandes: el sobre y la firma del pie. */
    '--font-script': v2 ? 'var(--font-instrument)' : 'var(--font-cormorant)',
    '--peso-script': v2 ? '400' : '600',
  } as React.CSSProperties;

  return (
    <html
      lang="es"
      data-fuentes={v2 ? '2' : '1'}
      className={`scroll-smooth ${cormorant.variable} ${inter.variable} ${instrument.variable}`}
      style={papeles}
    >
      <body suppressHydrationWarning className="text-ink">
        {/* Fondo global: el mismo papel de la tarjeta del sobre */}
        <div
          className="fixed inset-0 pointer-events-none z-[-1] bg-cream"
          style={{
            backgroundImage: `url("${backgrounds.envelope.cardBg}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {children}
      </body>
    </html>
  );
}
