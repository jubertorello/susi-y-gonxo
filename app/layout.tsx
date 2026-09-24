import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { wedding, backgrounds } from '@/config/wedding';

/**
 * Dos familias y nada más:
 *  · Cormorant Garamond hace de display y de texto corrido. Es la que lleva
 *    las cursivas, así que solo se pone en tamaños grandes.
 *  · Inter es la de los rótulos en mayúsculas, los botones y los formularios.
 *
 * La plantilla declaraba "Cormorant Garamond" en CSS pero no la cargaba en
 * ningún sitio, así que el navegador acababa pintando Times. Aquí se carga
 * de verdad con `next/font`.
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
  return (
    <html
      lang="es"
      className={`scroll-smooth ${cormorant.variable} ${inter.variable} [--font-handwritten:var(--font-serif)]`}
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
