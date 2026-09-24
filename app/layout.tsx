import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Instrument_Serif, Pinyon_Script } from 'next/font/google';
import './globals.css';
import { wedding, backgrounds } from '@/config/wedding';

/**
 * DOS VERSIONES TIPOGRÁFICAS
 * Se elige con `wedding.fontVersion` en `config/wedding.ts`.
 *
 *   1 · Cormorant Garamond en todo: títulos en semibold y texto corrido.
 *   2 · Instrument Serif para los títulos, Pinyon Script para los dos
 *       momentos grandes (el sobre y la firma del pie) y Cormorant para el
 *       texto corrido.
 *
 * En las dos, los rótulos pequeños en mayúsculas van en Inter: un serif a
 * 10px con mucho tracking no hay quien lo lea.
 *
 * Cada familia se carga con su propia variable y luego se reparten los
 * papeles (`--font-display`, `--font-script`) según la versión. Así cambiar
 * de una a otra es cambiar un número, sin tocar ningún componente.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

/** Solo tiene un grosor (400), así que en la versión 2 la display no va semibold. */
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument',
});

const pinyon = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-pinyon',
});

export const metadata: Metadata = {
  title: wedding.seo.title,
  description: wedding.seo.description,
  openGraph: {
    title: wedding.seo.title,
    description: wedding.seo.description,
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: wedding.seo.title,
    description: wedding.seo.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const v2 = wedding.fontVersion === 2;

  const papeles = {
    '--font-display': v2 ? 'var(--font-instrument)' : 'var(--font-serif)',
    /* Instrument Serif no tiene semibold: forzarlo saldría en negrita falsa. */
    '--peso-display': v2 ? '400' : '600',
    '--font-script': v2 ? 'var(--font-pinyon)' : 'var(--font-serif)',
    '--peso-script': v2 ? '400' : '600',
    /* Pinyon ya es caligráfica; en la versión 1 la cursiva la pone Cormorant. */
    '--estilo-script': v2 ? 'normal' : 'italic',
  } as React.CSSProperties;

  return (
    <html
      lang="es"
      data-fuentes={v2 ? '2' : '1'}
      className={`scroll-smooth ${cormorant.variable} ${inter.variable} ${instrument.variable} ${pinyon.variable}`}
      style={papeles}
    >
      <body suppressHydrationWarning className="text-primary">
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
