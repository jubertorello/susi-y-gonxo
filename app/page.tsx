'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import EnvelopeIntro from '@/components/EnvelopeIntro';
import RSVPForm from '@/components/RSVPForm';
import type { RSVPState } from '@/components/RSVPForm';
import { supabase } from '@/lib/supabase';
import { wedding, backgrounds, whatsappUrl } from '@/config/wedding';
import Image from 'next/image';
import {
  Clock,
  Music,
  Heart,
  Plane,
  Gift,
  Check,
  Copy,
  ChevronRight,
  X,
  PhoneCall,
  Info,
  Volume2,
  VolumeX,
  Bus,
  BedDouble,
  Camera,
  Menu,
} from 'lucide-react';

interface SuggestedSong {
  id: string;
  title: string;
  artist: string;
  votes: number;
}

const photos = wedding.photos;
/**
 * El carrete repite la lista dos veces seguidas: al desplazarse medio ancho,
 * el bucle encaja y no se ve el salto. Mientras no haya fotos se dibujan
 * marcos vacíos, para que el hueco se vea durante el montaje.
 */
const carrete = photos.length > 0 ? [...photos, ...photos] : [];
const huecos = photos.length === 0 ? wedding.gallery.placeholders : 0;
/**
 * Relojito de la cuenta atrás. La aguja fina va de verdad: gira con los
 * segundos que faltan, así que se mueve sola mientras se mira.
 */
function Reloj({ segundos, minutos }: { segundos: number; minutos: number }) {
  return (
    <svg
      width={46}
      height={46}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mx-auto"
    >
      <circle cx="24" cy="24" r="19" />
      <circle cx="24" cy="24" r="21.5" strokeWidth={0.7} opacity={0.5} />
      {[0, 90, 180, 270].map((g) => (
        <line key={g} x1="24" y1="7" x2="24" y2="10.5" transform={`rotate(${g} 24 24)`} />
      ))}
      <line x1="24" y1="24" x2="24" y2="15" transform="rotate(110 24 24)" />
      <line x1="24" y1="24" x2="24" y2="12" transform={`rotate(${minutos * 6} 24 24)`} strokeWidth={1.1} />
      <line
        x1="24"
        y1="26.5"
        x2="24"
        y2="11"
        transform={`rotate(${segundos * 6} 24 24)`}
        strokeWidth={0.8}
        opacity={0.75}
      />
      <circle cx="24" cy="24" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Lucide no trae ningún lazo, así que va dibujado aquí con el mismo trazo que
 * los suyos: rejilla de 24, sin relleno y grosor 1.5.
 */
type PropsIcono = { size?: number; className?: string; strokeWidth?: number };

const base = (p: PropsIcono) => ({
  width: p.size ?? 24,
  height: p.size ?? 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: p.strokeWidth ?? 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: p.className,
  'aria-hidden': true,
});

function Lazo(p: PropsIcono) {
  return (
    <svg {...base(p)}>
      <path d="M11.2 12C8.5 9.2 4 9.4 4 12s4.5 2.8 7.2 0" />
      <path d="M12.8 12c2.7-2.8 7.2-2.6 7.2 0s-4.5 2.8-7.2 0" />
      <circle cx="12" cy="12" r="1.4" />
      <path d="M10.9 13.3 9 20" />
      <path d="M13.1 13.3 15 20" />
    </svg>
  );
}

/**
 * Iconos que puede pedir la configuración, por nombre. Los de lucide son
 * componentes con ref y los de aquí funciones sueltas, así que el tipo tiene
 * que ser el común a ambos.
 */
const ICONOS_INFO: Record<string, React.ComponentType<PropsIcono> | undefined> = {
  bus: Bus,
  cama: BedDouble,
  lazo: Lazo,
};

/** Todos los párrafos de la luna de miel comparten cuerpo, color y ancho. */
const PARRAFO_REGALO = 'text-[18px] text-white/90 leading-relaxed max-w-xl mx-auto';

/** Sin pista de fondo no se monta el reproductor ni los botones de sonido. */
const hasAudio = Boolean(wedding.music.backgroundAudio);

/** Solo se enseñan en la barra los enlaces de las secciones encendidas. */
const sectionEnabled: Record<string, boolean> = {
  musica: wedding.music.enabled,
  viaje: wedding.gift.enabled,
};
const navLinks = wedding.nav.links.filter((l) => sectionEnabled[l.id] !== false);

/** Fondo de una sección: `mobileTop` abajo, `desktop` a partir de 768px. */
function SectionBackground({ bg }: { bg: { mobileTop: string; mobileBottom: string; desktop: string } }) {
  return (
    <>
      {bg.mobileTop && (
        <div
          aria-hidden
          className={`absolute inset-0 z-0 ${bg.desktop ? 'md:hidden' : ''}`}
          style={{
            backgroundImage: `url("${bg.mobileTop}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            clipPath: bg.mobileBottom ? 'inset(0 0 50% 0)' : undefined,
          }}
        />
      )}
      {bg.mobileBottom && (
        <div
          aria-hidden
          className="absolute inset-0 md:hidden z-0"
          style={{
            backgroundImage: `url("${bg.mobileBottom}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
            clipPath: 'inset(50% 0 0 0)',
          }}
        />
      )}
      {bg.desktop && (
        <div
          aria-hidden
          className="absolute inset-0 hidden md:block z-0"
          style={{
            backgroundImage: `url("${bg.desktop}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </>
  );
}

/**
 * Cenefas de eucalipto a los lados de una sección. Entran y salen en
 * degradado para que no se corten en seco, y se repiten en vertical: por eso
 * las láminas tienen que ser tiras altas y estrechas con fondo transparente.
 * Sin láminas en la configuración, no se dibuja nada.
 */
const desvanecido =
  'linear-gradient(to bottom, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%)';

function Eucalipto() {
  const e = backgrounds.eucalyptus;
  if (!e.left && !e.right) return null;
  return (
    <>
      {(['left', 'right'] as const).map((lado) =>
        e[lado] ? (
          <span
            key={lado}
            aria-hidden
            className={`absolute inset-y-0 ${lado === 'left' ? 'left-0' : 'right-0'} z-0 pointer-events-none`}
            style={{
              width: e.width,
              maxWidth: e.maxWidth,
              opacity: e.opacity,
              backgroundImage: `url("${e[lado]}")`,
              backgroundSize: '100% auto',
              backgroundRepeat: 'repeat-y',
              backgroundPosition: `${lado} top`,
              maskImage: desvanecido,
              WebkitMaskImage: desvanecido,
            }}
          />
        ) : null
      )}
    </>
  );
}

/**
 * Separador entre bloques: la ramita de eucalipto si la hay, y si no el
 * filete de 1px de siempre.
 */
function Filete({ className = '', claro = false }: { className?: string; claro?: boolean }) {
  if (!backgrounds.divider) {
    return <div className={`h-px w-10 mx-auto ${claro ? 'bg-white/40' : 'bg-primary/20'} ${className}`} />;
  }
  return (
    <div className={`relative h-6 w-28 mx-auto ${className}`}>
      <Image src={backgrounds.divider} alt="" fill className="object-contain" />
    </div>
  );
}

/** Cabecera de sección: rótulo pequeño, título en cursiva grande y filete. */
function SectionHeading({
  eyebrow,
  title,
  subtitle,
  light = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <>
      {eyebrow && (
        <span
          className={`font-sans text-[14px] uppercase tracking-[0.3em] mb-2 block font-medium ${
            light ? 'text-white/85' : 'text-ink'
          }`}
        >
          {eyebrow}
        </span>
      )}
      {/* text-3xl = 30px y md:text-4xl = 36px: la cursiva se queda por encima
          del mínimo de 28px en las dos anchuras. */}
      <h2
        className={`font-display italic text-3xl md:text-4xl ${light ? 'text-white' : 'text-ink'}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-2 text-[16px] ${light ? 'text-white/90' : 'text-ink'}`}>{subtitle}</p>
      )}
      <Filete className="mt-4" claro={light} />
    </>
  );
}

export default function Home() {
  const [showMain, setShowMain] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  // Arranca el audio en la primera interacción, solo si hay pista y autoplay.
  useEffect(() => {
    if (!hasAudio || !wedding.music.autoplay || audioStarted) return;
    const tryPlay = () => {
      audioRef.current
        ?.play()
        .then(() => {
          setIsPlaying(true);
          setAudioStarted(true);
        })
        .catch(() => {});
    };
    document.addEventListener('click', tryPlay);
    document.addEventListener('touchstart', tryPlay);
    return () => {
      document.removeEventListener('click', tryPlay);
      document.removeEventListener('touchstart', tryPlay);
    };
  }, [audioStarted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSwift, setCopiedSwift] = useState(false);
  const [showIbanModal, setShowIbanModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showAllSongsModal, setShowAllSongsModal] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [musicList, setMusicList] = useState<SuggestedSong[]>([]);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [showAddSongSuccess, setShowAddSongSuccess] = useState(false);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [rsvpData, setRsvpData] = useState<RSVPState | null>(null);
  const [formKey, setFormKey] = useState(0);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    completed: false,
  });

  useEffect(() => {
    const loadSavedData = async () => {
      const storedRsvp = localStorage.getItem('wedding_rsvp_status');
      if (storedRsvp) {
        try {
          const parsed = JSON.parse(storedRsvp);
          const normalized: RSVPState = {
            attending: parsed.attending !== undefined ? parsed.attending : true,
            guestName: parsed.guestName || '',
            hasIntolerance: parsed.hasIntolerance || !!parsed.dietaryRestrictions,
            dietaryRestrictions: parsed.dietaryRestrictions || '',
            busIda: parsed.busIda === true,
            busVuelta: parsed.busVuelta === true,
            companions: Array.isArray(parsed.companions) ? parsed.companions : [],
            message: parsed.message || '',
            submittedAt: parsed.submittedAt,
          };
          setRsvpData(normalized);
          setFormSubmitted(true);
        } catch (e) {
          console.error(e);
        }
      }

      setMounted(true);

      if (!wedding.music.enabled) return;
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .eq('client_id', wedding.clientId)
        .order('votes', { ascending: false });

      if (songsData && !songsError) setMusicList(songsData);
    };

    const timer = setTimeout(loadSavedData, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const weddingDate = new Date(wedding.date.iso).getTime();
    const updateTimer = () => {
      const difference = weddingDate - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, completed: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / 86400000),
        hours: Math.floor((difference % 86400000) / 3600000),
        minutes: Math.floor((difference % 3600000) / 60000),
        seconds: Math.floor((difference % 60000) / 1000),
        completed: false,
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (value: string, mark: (v: boolean) => void) => {
    navigator.clipboard.writeText(value);
    mark(true);
    setTimeout(() => mark(false), 2000);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setShowMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongTitle.trim() || !newSongArtist.trim()) return;

    const { data, error } = await supabase
      .from('songs')
      .insert([
        {
          client_id: wedding.clientId,
          title: newSongTitle.trim(),
          artist: newSongArtist.trim(),
          votes: 1,
        },
      ])
      .select()
      .single();

    if (data && !error) {
      setMusicList([data, ...musicList].sort((a, b) => b.votes - a.votes));
      setShowAddSongSuccess(true);
      setTimeout(() => setShowAddSongSuccess(false), 3000);
    }

    setNewSongTitle('');
    setNewSongArtist('');
  };

  const handleVoteSong = async (id: string) => {
    const song = musicList.find((s) => s.id === id);
    if (!song) return;
    const newVotes = song.votes + 1;
    setMusicList(
      musicList.map((s) => (s.id === id ? { ...s, votes: newVotes } : s)).sort((a, b) => b.votes - a.votes)
    );
    await supabase.from('songs').update({ votes: newVotes }).eq('id', id);
  };

  const handleRsvpSubmitted = (data: RSVPState) => {
    setRsvpData(data);
    setFormSubmitted(true);
  };

  const handleEditRsvp = () => {
    setFormSubmitted(false);
    setRsvpData(null);
    setFormKey((k) => k + 1);
    localStorage.removeItem('wedding_rsvp_status');
  };

  if (!mounted) return null;

  const featuredPhoto = photos[1] ?? photos[0];
  const polaroids = photos.filter((p) => p !== featuredPhoto);

  return (
    <main
      className={`min-h-screen relative overflow-x-hidden selection:bg-primary/20 select-none md:select-text ${
        !showMain ? 'h-screen overflow-hidden' : ''
      }`}
    >
      {hasAudio && (
        <audio ref={audioRef} loop preload="auto">
          <source src={wedding.music.backgroundAudio} type="audio/mpeg" />
        </audio>
      )}

      {hasAudio && audioStarted && !showMain && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Silenciar música' : 'Activar música'}
          className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm text-white/80 hover:bg-black/30 hover:text-white transition-all duration-200"
        >
          {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showMain ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="relative text-ink"
      >
        {/* ================= BARRA DE NAVEGACIÓN ================= */}
        <nav className="fixed top-0 inset-x-0 bg-primary text-cream border-b border-white/10 z-40 shadow-md">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
            <a
              href="#inicio"
              onClick={(e) => handleNavClick(e, 'inicio')}
              className="font-display text-xl sm:text-2xl md:text-3xl tracking-[0.2em] uppercase text-cream hover:opacity-80 transition-opacity shrink-0"
            >
              {wedding.couple.initials.split('&').join(' & ')}
            </a>

            <div className="hidden md:flex items-center space-x-6 lg:space-x-8 text-[14px] uppercase tracking-[0.25em] font-sans text-soft font-medium">
              {navLinks
                .filter((l) => !l.mobileOnly)
                .map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {hasAudio && (
                <button
                  onClick={togglePlay}
                  className="p-2 text-cream/90 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                  aria-label={isPlaying ? 'Pausar música de fondo' : 'Reproducir música de fondo'}
                >
                  {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} className="opacity-60" />}
                </button>
              )}

              <a
                href="#confirmacion"
                onClick={(e) => handleNavClick(e, 'confirmacion')}
                className="hidden md:inline-block px-4 py-1.5 border border-white/30 text-cream hover:bg-cream hover:text-ink transition-all duration-300 rounded-full text-[14px] uppercase font-sans tracking-[0.2em]"
              >
                {wedding.nav.ctaLabel}
              </a>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden flex items-center gap-1 px-3 py-1.5 border border-white/35 text-cream hover:bg-white/10 transition-all rounded-full text-[14px] uppercase font-sans tracking-[0.15em]"
                aria-label="Menú de secciones"
                aria-expanded={showMobileMenu}
              >
                <span>Menú</span>
                {showMobileMenu ? <X size={12} /> : <Menu size={12} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="md:hidden overflow-hidden bg-primary border-t border-white/10"
              >
                <div className="px-6 py-4 flex flex-col space-y-4 text-center text-[14px] uppercase tracking-[0.2em] font-sans text-soft font-medium">
                  {navLinks.map((link) => (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      onClick={(e) => handleNavClick(e, link.id)}
                      className="py-1 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="pt-2">
                    <a
                      href="#confirmacion"
                      onClick={(e) => handleNavClick(e, 'confirmacion')}
                      className="inline-block w-full py-2.5 bg-cream text-ink hover:bg-sand transition-colors rounded-full text-[14px] tracking-[0.2em] font-bold"
                    >
                      {wedding.nav.ctaLabel}
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* ================= 1. CABECERA ================= */}
        <section
          id="inicio"
          className="w-full relative pt-28 pb-16 md:pt-32 md:pb-20 flex flex-col items-center justify-center text-center overflow-hidden"
        >
          <SectionBackground bg={backgrounds.sections.hero} />
          <Eucalipto />

          <motion.div
            initial="hidden"
            animate={showMain ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
            }}
            className="max-w-4xl mx-auto px-6 w-full flex flex-col items-center relative z-10"
          >
            {wedding.hero.intro.map((parrafo, i) => (
              <motion.p
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } },
                }}
                className="text-ink text-[18px] md:text-[20px] leading-relaxed max-w-sm mx-auto mb-5 text-center"
              >
                {parrafo}
              </motion.p>
            ))}

            <motion.h2
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } },
              }}
              className="font-display tracking-[0.12em] sm:tracking-[0.2em] uppercase text-[30px] leading-tight text-ink mt-5 mb-8 text-center"
            >
              {wedding.hero.announcement}
            </motion.h2>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } },
              }}
              className="text-ink text-[18px] md:text-[20px] leading-relaxed max-w-sm mx-auto mb-10 text-center"
            >
              {wedding.hero.subtitle}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={showMain ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
            }}
            className="max-w-4xl mx-auto px-6 w-full flex flex-col items-center relative z-10"
          >
            {/* Nombres de la pareja */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 1.4, ease: 'easeOut' } },
              }}
              className="my-10 md:my-14 mb-12 flex flex-col items-center select-text"
            >
              {(['partnerA', 'partnerB'] as const).map((quien, i) => (
                <React.Fragment key={quien}>
                  {i === 1 && <div className="font-display text-2xl md:text-3xl my-4 text-ink">&</div>}
                  <div className="flex flex-col items-center">
                    <h1 className="font-display tracking-[0.06em] sm:tracking-[0.1em] text-[30px] leading-tight text-ink uppercase">
                      {wedding.couple[quien].firstName}
                    </h1>
                    <span className="font-display tracking-[0.05em] text-[26px] text-ink uppercase mt-1">
                      {wedding.couple[quien].lastName}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </motion.div>

            {wedding.hero.namesCaption && (
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } },
                }}
                className="text-ink text-[18px] md:text-[20px] leading-relaxed max-w-sm mx-auto mb-5 text-center"
              >
                {wedding.hero.namesCaption}
              </motion.p>
            )}

            {/* Fecha */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 25 },
                visible: { opacity: 1, y: 0, transition: { duration: 1.4, ease: 'easeOut' } },
              }}
              className="flex flex-col items-center mt-4 select-none w-full"
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-6 md:gap-8">
                <div className="border-y border-ink/40 py-2 text-center px-2 sm:px-6 shrink-0">
                  <span className="font-display tracking-[0.04em] sm:tracking-[0.14em] uppercase text-ink block text-[26px] leading-none">
                    {wedding.date.month}
                  </span>
                </div>

                <div className="font-display text-[40px] sm:text-6xl md:text-7xl text-ink leading-none px-0.5 sm:px-1 shrink-0">
                  {wedding.date.day}
                </div>

                <div className="border-y border-ink/40 py-2 text-center px-2 sm:px-6 shrink-0">
                  <span className="font-display tracking-[0.04em] sm:tracking-[0.14em] text-ink block text-[26px] leading-none">
                    {wedding.date.year}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <span className="font-display tracking-[0.25em] text-ink uppercase text-[16px] sm:text-[16px] leading-none">
                  {wedding.date.weekdayTime}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ================= 2. LUGAR ================= */}
        <section id="lugar" className="w-full py-16 md:py-20 relative">
          <SectionBackground bg={backgrounds.sections.locations} />
          <Eucalipto />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
            className="max-w-5xl mx-auto px-6 relative z-10"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
              className="text-center mb-16"
            >
              <SectionHeading eyebrow={wedding.locations.eyebrow} title={wedding.locations.title} />
            </motion.div>

            <div
              className={`grid gap-12 lg:gap-16 items-stretch ${
                wedding.locations.places.length > 1 ? 'md:grid-cols-2' : 'max-w-lg mx-auto'
              }`}
            >
              {wedding.locations.places.map((place) => (
                <motion.div
                  key={place.name}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } },
                  }}
                  whileHover={{ y: -4 }}
                  className="flex flex-col justify-between relative px-2 md:px-6"
                >
                  <div>
                    <div className="mb-6 text-center">
                      <span className="font-sans text-[14px] uppercase tracking-[0.3em] text-ink font-medium">
                        {place.title}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl text-ink mb-4 tracking-wide text-center">
                      {place.name}
                    </h3>

                    <p className="text-ink text-[16px] mb-6 leading-relaxed text-center">
                      {place.address}
                    </p>

                    {place.image && (
                      <div className="relative h-64 md:h-72 w-full">
                        <Image
                          src={place.image}
                          alt={place.title}
                          fill
                          className="object-contain object-center"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-1.5 mb-8 text-ink">
                      <Clock size={13} className="opacity-85" />
                      <span className="font-sans text-[14px] uppercase tracking-[0.12em]">{place.time}</span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <a
                      href={place.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-[220px] max-w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-sans text-[14px] uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]"
                    >
                      <span>{wedding.locations.ctaLabel}</span>
                      <ChevronRight size={12} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {wedding.locations.note && (
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
                }}
                className="text-center text-ink text-[16px] mt-12 max-w-md mx-auto leading-relaxed"
              >
                {wedding.locations.note}
              </motion.p>
            )}
          </motion.div>
        </section>

        {/* ================= 3. CUENTA ATRÁS ================= */}
        <section id="cuenta-atras" className="py-16 md:py-20 relative overflow-hidden">
          {/* La misma tela del pie, sin velo: el texto va oscuro encima. */}
          <SectionBackground bg={backgrounds.sections.countdown} />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            className="max-w-3xl mx-auto px-6 relative z-10 flex flex-col items-center"
          >
            {wedding.countdown.clock && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.85 },
                  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
                }}
                className="text-ink/70 mb-4"
              >
                <Reloj segundos={timeLeft.seconds} minutos={timeLeft.minutes} />
              </motion.div>
            )}

            {wedding.countdown.lead && (
              <motion.h2
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
                className="font-display italic text-3xl md:text-4xl text-ink text-center"
              >
                {timeLeft.completed ? wedding.countdown.today : wedding.countdown.lead}
              </motion.h2>
            )}

            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
              }}
              className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-[19rem] sm:max-w-md"
            >
              {(
                [
                  [timeLeft.days, wedding.countdown.labels.days],
                  [timeLeft.hours, wedding.countdown.labels.hours],
                  [timeLeft.minutes, wedding.countdown.labels.minutes],
                  [timeLeft.seconds, wedding.countdown.labels.seconds],
                ] as const
              ).map(([valor, etiqueta], i) => (
                <motion.div
                  key={etiqueta}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 15 } },
                  }}
                  className="bg-cream/92 border border-ink/10 rounded-sm shadow-sm py-4 px-1 text-center"
                >
                  {/*
                    La clave cambia con el número, así que React lo vuelve a
                    montar y entra animado: los segundos laten solos.
                  */}
                  <motion.span
                    key={valor}
                    initial={{ opacity: 0, y: i === 3 ? -8 : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="font-display text-[30px] sm:text-[38px] text-ink leading-none block tabular-nums"
                  >
                    {valor}
                  </motion.span>
                  <span className="font-sans text-[14px] uppercase tracking-[0.06em] sm:tracking-[0.12em] text-ink/80 mt-2 block">
                    {etiqueta}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {wedding.countdown.tagline && (
              <motion.p
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
                className="mt-8 text-[18px] text-ink text-center"
              >
                {wedding.countdown.tagline}
              </motion.p>
            )}
          </motion.div>
        </section>

        {/* ================= 4. CARRETE DE FOTOS ================= */}
        {wedding.gallery.enabled && (
          <section id="fotos" className="py-12 relative overflow-hidden">
            <SectionBackground bg={backgrounds.sections.photos} />

            <div className="relative z-10">
              {wedding.gallery.image && (
                <div className="relative w-24 h-24 md:w-28 md:h-28 mx-auto mb-2">
                  <Image src={wedding.gallery.image} alt="" fill className="object-contain" />
                </div>
              )}

              {wedding.gallery.title && (
                <h2 className="font-display italic text-3xl md:text-4xl text-ink text-center mb-8">
                  {wedding.gallery.title}
                </h2>
              )}

              {/*
                El carrete va fuera del contenedor centrado para ocupar todo el
                ancho. `overflow-hidden` lo mantiene dentro de la pantalla: nunca
                desplaza la página en horizontal.
              */}
              <div className="relative w-full overflow-hidden group">
                <div
                  className="flex gap-3 md:gap-5 w-max motion-safe:animate-[carrete_var(--carrete)_linear_infinite] group-hover:[animation-play-state:paused]"
                  style={{ '--carrete': `${wedding.gallery.speed}s` } as React.CSSProperties}
                >
                  {carrete.map((foto, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActivePhoto(foto)}
                      aria-label="Ampliar foto"
                      className="relative shrink-0 h-[220px] w-[160px] md:h-[300px] md:w-[220px] bg-cream p-2 shadow-[0_6px_20px_rgba(0,0,0,0.14)] transition-transform duration-300 hover:-translate-y-1"
                    >
                      <span className="relative block w-full h-full overflow-hidden">
                        <Image
                          src={foto}
                          alt={wedding.couple.joinedNames}
                          fill
                          sizes="(max-width: 768px) 160px, 220px"
                          className="object-cover"
                        />
                      </span>
                    </button>
                  ))}

                  {/* Marcos vacíos mientras no haya fotos */}
                  {Array.from({ length: huecos }).map((_, i) => (
                    <div
                      key={`hueco-${i}`}
                      aria-hidden
                      className="shrink-0 h-[220px] w-[160px] md:h-[300px] md:w-[220px] bg-cream/70 p-2 shadow-[0_6px_20px_rgba(0,0,0,0.10)]"
                    >
                      <span className="flex w-full h-full items-center justify-center border border-dashed border-primary/25">
                        <Camera size={26} className="text-ink/25" strokeWidth={1.5} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= 5. ITINERARIO ================= */}
        <section id="itinerario" className="py-16 md:py-20 text-ink relative">
          <SectionBackground bg={backgrounds.sections.itinerary} />
          <Eucalipto />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            className="max-w-4xl mx-auto px-6 relative z-10"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
              className="text-center mb-8"
            >
              <SectionHeading
                eyebrow={wedding.itinerary.eyebrow}
                title={wedding.itinerary.title}
                subtitle={wedding.itinerary.subtitle}
              />
            </motion.div>

            <div className="relative">
              {/* Raíl central: el zigzag es el mismo en móvil y en escritorio */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20 -translate-x-1/2" />

              <div className="space-y-6 md:space-y-8">
                {wedding.itinerary.events.map((evento, i) => {
                  const izquierda = i % 2 === 0;
                  return (
                    <motion.div
                      key={evento.title}
                      initial={{ opacity: 0, y: 24, scale: 0.96 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ type: 'spring', stiffness: 90, damping: 14 }}
                      className={`relative flex items-center ${izquierda ? '' : 'flex-row-reverse'}`}
                    >
                      {/* Punto sobre el raíl */}
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-primary/50"
                      />

                      {/*
                        Cada mitad para una cosa: la ilustración a un lado del
                        raíl y la hora con el nombre al otro. Así la lámina se
                        lleva media página y el bloque no crece a lo alto.
                      */}
                      <div className={`w-1/2 ${izquierda ? 'pr-5 sm:pr-10' : 'pl-5 sm:pl-10'}`}>
                        {evento.image && (
                          <div
                            className={`relative w-full max-w-[9rem] sm:max-w-[13rem] md:max-w-[16rem] aspect-[10/9] ${
                              izquierda ? 'ml-auto' : ''
                            }`}
                          >
                            <Image src={evento.image} alt={evento.title} fill className="object-contain" />
                          </div>
                        )}
                      </div>

                      <div className={`w-1/2 ${izquierda ? 'pl-5 sm:pl-10 text-left' : 'pr-5 sm:pr-10 text-right'}`}>
                        <div className="inline-block whitespace-nowrap px-2.5 py-0.5 bg-primary/5 border border-primary/15 rounded-full text-primary font-sans font-medium text-[14px] mb-1">
                          {evento.time}
                        </div>
                        <h4 className="font-display text-[20px] sm:text-[24px] text-ink leading-tight">
                          {evento.title}
                        </h4>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ================= 6. LUNA DE MIEL / REGALO ================= */}
        {wedding.gift.enabled && (
          <section id="viaje" className="py-16 md:py-20 bg-moss relative text-white">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } }}
              className="max-w-3xl mx-auto px-6 text-center"
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
                className="mb-6"
              >
                <SectionHeading eyebrow={wedding.gift.eyebrow} title={wedding.gift.title} light />
              </motion.div>

              {/* Los tres párrafos van con el mismo cuerpo, color y ancho. */}
              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                className={PARRAFO_REGALO + ' mb-5'}
              >
                {wedding.gift.description}
              </motion.p>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                className={PARRAFO_REGALO + ' mb-8'}
              >
                {wedding.gift.invitation}
              </motion.p>

              {wedding.gift.image && (
                <div className="flex justify-center">
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.92, rotate: -2 },
                      visible: {
                        opacity: 1,
                        scale: 1,
                        rotate: 0,
                        transition: { type: 'spring', stiffness: 60, damping: 15 },
                      },
                    }}
                    className="relative w-full max-w-[20rem] md:max-w-[30rem] aspect-[7/3] mb-6"
                  >
                    <Image
                      src={wedding.gift.image}
                      alt={wedding.gift.title}
                      fill
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                </div>
              )}

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 14 } },
                }}
                className="flex flex-col items-center gap-3"
              >
                {wedding.gift.ctaHint && (
                  <p className={PARRAFO_REGALO}>{wedding.gift.ctaHint}</p>
                )}
                <button
                  onClick={() => setShowIbanModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-ink hover:bg-white/90 font-sans text-[14px] uppercase tracking-[0.22em] rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-semibold"
                >
                  <Gift size={13} />
                  <span>{wedding.gift.ctaLabel}</span>
                </button>
              </motion.div>

              {wedding.gift.closing && (
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                  className={PARRAFO_REGALO + ' mt-8'}
                >
                  {wedding.gift.closing}
                </motion.p>
              )}
            </motion.div>
          </section>
        )}

        {/* ================= 7. CONFIRMACIÓN ================= */}
        <section id="confirmacion" className="w-full py-16 md:py-20 relative">
          <SectionBackground bg={backgrounds.sections.rsvp} />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
            className="max-w-4xl mx-auto px-6 relative z-10"
          >
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 70, damping: 15 } },
                  }}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10"
                >
                  <Check size={32} className="text-ink" />
                </motion.div>
              </div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
              >
                <SectionHeading title={wedding.rsvp.title} />
              </motion.div>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                className="text-[16px] text-ink leading-relaxed max-w-md mx-auto mt-6"
              >
                Para poder organizar con cariño y detalle este día, agradeceríamos que rellenarais este
                formulario{' '}
                {wedding.rsvp.deadline ? (
                  <>
                    antes del <strong className="text-ink font-semibold">{wedding.rsvp.deadline}</strong>
                  </>
                ) : (
                  <strong className="text-ink font-semibold">lo antes posible</strong>
                )}
                , gracias.
              </motion.p>
            </div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 35 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
              className="bg-cream border border-primary/10 rounded-sm p-6 sm:p-8 md:p-12 shadow-sm max-w-2xl mx-auto"
            >
              <RSVPForm
                key={formKey}
                onSubmitted={handleRsvpSubmitted}
                onEdit={handleEditRsvp}
                rsvpData={rsvpData}
                formSubmitted={formSubmitted}
              />
            </motion.div>
          </motion.div>
        </section>

        {/* ================= 8. MÚSICA ================= */}
        {wedding.music.enabled && (
          /*
           * Una cinta, no una sección: ilustración, título y botón en una
           * fila. Todo lo demás ya está en la ventana que abre el botón.
           */
          <section id="musica" className="w-full bg-cream border-y border-primary/10 text-ink py-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center sm:text-left"
            >
              {wedding.music.image && (
                <div className="relative w-32 h-[3.3rem] sm:w-40 sm:h-[4.1rem] shrink-0">
                  <Image src={wedding.music.image} alt="" fill className="object-contain" />
                </div>
              )}

              <h2 className="font-display text-[24px] md:text-[28px] text-ink leading-tight">
                {wedding.music.title}
              </h2>

              <button
                onClick={() => setShowMusicModal(true)}
                className="shrink-0 inline-flex items-center gap-2 px-7 py-2.5 bg-primary hover:bg-primary/90 text-white font-sans text-[14px] uppercase tracking-[0.2em] rounded-full transition-all duration-300 shadow hover:scale-105 active:scale-95"
              >
                <Music size={14} />
                <span>{wedding.music.ctaLabel}</span>
              </button>
            </motion.div>
          </section>
        )}

        {/* ================= 9. DATOS DE INTERÉS ================= */}
        <section id="informacion" className="py-16 md:py-20 relative">
          <SectionBackground bg={backgrounds.sections.info} />
          <Eucalipto />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } }}
            className="max-w-2xl mx-auto px-6 relative z-10"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
              className="text-center mb-12"
            >
              <SectionHeading eyebrow={wedding.info.eyebrow} title={wedding.info.title} />
            </motion.div>

            {/* Una tarjeta por tema, anchas y en columna: así cabe dentro la
                lista con sus filetes sin quedar apretada. */}
            <div className="space-y-8">
              {wedding.info.blocks.map((bloque) => {
                const Icono = ICONOS_INFO[bloque.icon];
                return (
                  <motion.div
                    key={bloque.title}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } },
                    }}
                    whileHover={{ y: -4 }}
                    id={bloque.id}
                    className="bg-moss text-white border border-white/10 rounded shadow-sm px-6 py-10 sm:px-10 text-center scroll-mt-24"
                  >
                    {Icono && <Icono size={28} className="mx-auto mb-4 text-white/80" strokeWidth={1.4} />}

                    <h3 className="font-display text-[24px] md:text-[28px] text-white leading-tight">
                      {bloque.title}
                    </h3>

                    <p className="mt-4 text-[18px] text-white/90 leading-relaxed">{bloque.body}</p>

                    {bloque.items.length > 0 &&
                      (bloque.layout === 'parejas' ? (
                        <ul className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16">
                          {bloque.items.map((item) => (
                            <li key={item.label} className="flex flex-col items-center">
                              <span className="font-sans text-[14px] uppercase tracking-[0.25em] text-white">
                                {item.label}
                              </span>
                              <span className="font-display text-[20px] text-white mt-1 leading-tight">
                                {item.detail}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="mt-8 space-y-4 text-left">
                          {bloque.items.map((item) => (
                            <li key={item.label} className="border-t border-white/20 pt-4">
                              <span className="font-sans text-[14px] uppercase tracking-[0.2em] text-white block">
                                {item.label}
                              </span>
                              {/* Una línea con `detail`, o varias con `lines`. */}
                              {(item.lines ?? (item.detail ? [item.detail] : [])).map((linea) => (
                                <span
                                  key={linea}
                                  className="text-[18px] text-white/90 leading-relaxed block mt-1"
                                >
                                  {linea}
                                </span>
                              ))}
                            </li>
                          ))}
                        </ul>
                      ))}

                    {bloque.note && (
                      <p className="mt-8 text-[18px] text-white/85 leading-relaxed">{bloque.note}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ================= 10. DUDAS ================= */}
        <section className="py-16 md:py-20 relative">
          <SectionBackground bg={backgrounds.sections.contact} />
          <Eucalipto />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            className="max-w-4xl mx-auto px-6 text-center relative z-10"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
              className="mb-6"
            >
              <SectionHeading title={wedding.contact.title} />
            </motion.div>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
              className="text-[16px] text-ink leading-relaxed mb-10 max-w-md mx-auto"
            >
              {wedding.contact.description}
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto"
            >
              {(['partnerA', 'partnerB'] as const).map((quien) => (
                <a
                  key={quien}
                  href={whatsappUrl(quien)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-sans text-[14px] uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
                >
                  <PhoneCall size={12} />
                  <span>{wedding.couple[quien].whatsappLabel}</span>
                </a>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ================= 11. PIE ================= */}
        <footer className="pt-24 pb-16 md:pt-28 md:pb-20 text-center relative overflow-hidden bg-moss">
          {/* La tela de rayas del forro del sobre, repetida. Se escala al alto
              del pie para que la raya conserve su grosor. */}
          {backgrounds.sections.footer.mobileTop && (
            <div
              aria-hidden
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url("${backgrounds.sections.footer.mobileTop}")`,
                backgroundSize: 'auto 100%',
                backgroundRepeat: 'repeat',
                backgroundPosition: 'center',
              }}
            />
          )}
          <div className="max-w-2xl mx-auto px-6 relative z-10">
            {/* La tela va sin velo, así que el texto es oscuro: `ink` sobre la
                raya da 5.36:1, y 6.34:1 sobre sus rayas blancas. */}
            <span className="font-script text-4xl md:text-5xl block mb-6 text-ink leading-[1.3]">
              {wedding.footer.headline}
            </span>
            <p className="font-sans font-bold text-[14px] uppercase tracking-[0.3em] text-ink mb-2">
              {wedding.footer.signature}
            </p>
            <p className="font-sans font-bold text-[14px] text-ink tracking-widest uppercase">
              {wedding.footer.dateLine}
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 py-3 bg-cream/55 border-t border-ink/10 z-10">
            <p className="font-sans font-bold text-[14px] text-ink/80 tracking-widest">
              By{' '}
              <a
                href="https://wa.me/34660104026"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-ink transition-colors"
              >
                Jules
              </a>
              . Todos los derechos reservados.
            </p>
          </div>
        </footer>

        {/* ========================= MODALES ========================= */}

        {/* IBAN / REGALO */}
        <AnimatePresence>
          {showIbanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-text">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowIbanModal(false)}
                className="absolute inset-0 bg-primary/45 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-cream border border-primary/20 rounded-md shadow-2xl p-6 sm:p-8 relative z-50 max-w-md w-full text-center max-h-[85vh] overflow-y-auto"
              >
                <button
                  onClick={() => setShowIbanModal(false)}
                  aria-label="Cerrar"
                  className="absolute top-4 right-4 p-1.5 text-ink/60 hover:text-ink hover:bg-primary/5 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="flex justify-center mb-4 text-ink">
                  <Plane size={32} />
                </div>

                <h3 className="font-display text-2xl text-ink mb-3">{wedding.gift.modal.title}</h3>

                <p className="font-sans text-[14px] text-ink leading-relaxed mb-6">
                  {wedding.gift.modal.description}
                </p>

                <div className="bg-sand/60 p-4 rounded-md border border-primary/10 mb-6 text-left">
                  <span className="block text-[14px] font-sans uppercase tracking-[0.2em] text-ink mb-2 font-bold">
                    {wedding.gift.modal.ibanLabel}
                  </span>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="font-sans text-[14px] sm:text-[14px] text-ink select-all font-bold tracking-wider break-all">
                      {wedding.gift.modal.iban}
                    </span>
                    <button
                      onClick={() => copyToClipboard(wedding.gift.modal.iban, setCopied)}
                      className="p-2 bg-primary/5 hover:bg-primary/10 text-ink rounded transition-all active:scale-95 shrink-0"
                      title="Copiar IBAN"
                    >
                      {copied ? (
                        <span className="text-[14px] font-sans uppercase tracking-wider font-semibold">
                          {wedding.gift.modal.copiedLabel}
                        </span>
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  <span className="block text-[14px] font-sans uppercase tracking-[0.2em] text-ink mb-2 font-bold">
                    {wedding.gift.modal.swiftLabel}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-[14px] sm:text-[14px] text-ink select-all font-bold tracking-wider break-all">
                      {wedding.gift.modal.swift}
                    </span>
                    <button
                      onClick={() => copyToClipboard(wedding.gift.modal.swift, setCopiedSwift)}
                      className="p-2 bg-primary/5 hover:bg-primary/10 text-ink rounded transition-all active:scale-95 shrink-0"
                      title="Copiar Swift/BIC"
                    >
                      {copiedSwift ? (
                        <span className="text-[14px] font-sans uppercase tracking-wider font-semibold">
                          {wedding.gift.modal.copiedLabel}
                        </span>
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-start gap-1.5 mt-3 font-sans text-[14px] text-ink leading-snug">
                    <Info size={11} className="mt-0.5 shrink-0" />
                    <span>{wedding.gift.modal.swiftHint}</span>
                  </div>

                  <span className="block font-sans text-[14px] text-ink mt-3 pt-2 border-t border-primary/5">
                    Titulares: {wedding.gift.modal.holders}
                  </span>
                </div>

                <p className="font-sans text-[14px] text-ink">{wedding.gift.modal.thanks}</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SUGERIR CANCIONES */}
        <AnimatePresence>
          {showMusicModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-text">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMusicModal(false)}
                className="absolute inset-0 bg-primary/45 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-cream border border-primary/20 rounded-md shadow-2xl p-6 sm:p-8 relative z-50 max-w-sm w-full max-h-[85vh] overflow-y-auto"
              >
                <button
                  onClick={() => setShowMusicModal(false)}
                  aria-label="Cerrar"
                  className="absolute top-4 right-4 p-1.5 text-ink/60 hover:text-ink hover:bg-primary/5 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="text-center mb-6">
                  <Music size={24} className="text-ink mx-auto mb-2" />
                  <h3 className="font-display text-xl text-ink">{wedding.music.modal.title}</h3>
                  <p className="font-sans text-[14px] text-ink mt-1">{wedding.music.modal.subtitle}</p>
                </div>

                <AnimatePresence>
                  {showAddSongSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-primary/10 border border-primary/25 rounded text-ink p-3 text-center mb-4 font-sans text-[14px] font-semibold flex items-center justify-center gap-1.5 overflow-hidden"
                    >
                      <Check size={14} />
                      <span>{wedding.music.modal.successLabel}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleAddSong} className="space-y-4">
                  <div>
                    <label className="block font-sans text-[14px] uppercase tracking-wider text-ink mb-1 font-semibold">
                      {wedding.music.modal.songLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={wedding.music.modal.songPlaceholder}
                      value={newSongTitle}
                      onChange={(e) => setNewSongTitle(e.target.value)}
                      className="w-full bg-sand/30 border border-primary/20 rounded p-2.5 text-ink focus:outline-none focus:border-primary transition-colors font-sans text-[16px]"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[14px] uppercase tracking-wider text-ink mb-1 font-semibold">
                      {wedding.music.modal.artistLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={wedding.music.modal.artistPlaceholder}
                      value={newSongArtist}
                      onChange={(e) => setNewSongArtist(e.target.value)}
                      className="w-full bg-sand/30 border border-primary/20 rounded p-2.5 text-ink focus:outline-none focus:border-primary transition-colors font-sans text-[16px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white tracking-[0.2em] font-sans text-[14px] uppercase rounded-full transition-all duration-300 shadow hover:shadow-md"
                  >
                    {wedding.music.modal.submitLabel}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PLAYLIST COMPLETA */}
        <AnimatePresence>
          {showAllSongsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-text">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAllSongsModal(false)}
                className="absolute inset-0 bg-primary/45 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-cream border border-primary/20 rounded-md shadow-2xl p-6 sm:p-8 relative z-50 max-w-sm w-full"
              >
                <button
                  onClick={() => setShowAllSongsModal(false)}
                  aria-label="Cerrar"
                  className="absolute top-4 right-4 p-1.5 text-ink/60 hover:text-ink hover:bg-primary/5 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="text-center mb-6">
                  <Music size={24} className="text-ink mx-auto mb-2" />
                  <h3 className="font-display text-xl text-ink">{wedding.music.allLabel}</h3>
                  <p className="font-sans text-[14px] text-ink mt-1">
                    {musicList.length} canciones sugeridas
                  </p>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {musicList.map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between bg-sand/30 p-2.5 rounded font-sans text-[14px] border border-primary/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[14px] font-bold text-ink/40 w-4 shrink-0">#{index + 1}</span>
                        <div className="min-w-0 truncate">
                          <span className="font-bold text-ink">{song.title}</span>
                          <span className="text-ink"> — {song.artist}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleVoteSong(song.id)}
                        aria-label={`Votar ${song.title}`}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-primary/5 rounded text-[14px] text-ink border border-primary/10 transition-colors shrink-0 ml-2"
                      >
                        <Heart size={9} className="fill-primary/20 text-ink" />
                        <span>{song.votes}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* LIGHTBOX DE FOTOS */}
        <AnimatePresence>
          {activePhoto && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 select-none"
              onClick={() => setActivePhoto(null)}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-overlay/92 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full h-[70vh] md:h-[80vh] z-50 flex items-center justify-center"
              >
                <div className="relative w-full h-full rounded border border-white/10 overflow-hidden shadow-2xl">
                  <Image
                    src={activePhoto}
                    alt={wedding.couple.joinedNames}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <button
                  onClick={() => setActivePhoto(null)}
                  aria-label="Cerrar"
                  className="absolute -top-12 right-0 md:-top-10 md:-right-10 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {!showMain && (
          <EnvelopeIntro onStartExit={() => setShowMain(true)} onComplete={() => setShowMain(true)} />
        )}
      </AnimatePresence>
    </main>
  );
}
