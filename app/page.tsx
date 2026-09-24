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
  Shirt,
  Menu,
} from 'lucide-react';

interface SuggestedSong {
  id: string;
  title: string;
  artist: string;
  votes: number;
}

const photos = wedding.photos;
/** La sección de fotos solo existe si hay fotos que enseñar. */
const hasPhotos = photos.length > 0;
/** Los iconos del itinerario son opcionales: sin ellos la línea se estrecha. */
const hasItineraryIcons = wedding.itinerary.events.some((e) => e.image);
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
          className={`font-sans text-[10px] uppercase tracking-[0.3em] mb-2 block font-medium ${
            light ? 'text-white/80' : 'text-secondary'
          }`}
        >
          {eyebrow}
        </span>
      )}
      {/* text-3xl = 30px y md:text-4xl = 36px: la cursiva se queda por encima
          del mínimo de 28px en las dos anchuras. */}
      <h2
        className={`font-display italic text-3xl md:text-4xl ${light ? 'text-white' : 'text-primary'}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-2 text-[15px] ${light ? 'text-white/85' : 'text-secondary'}`}>{subtitle}</p>
      )}
      <div className={`h-px w-10 mx-auto mt-4 ${light ? 'bg-white/40' : 'bg-primary/20'}`} />
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
            busStop: parsed.busStop || '',
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
        className="relative text-primary"
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

            <div className="hidden md:flex items-center space-x-6 lg:space-x-8 text-[11px] uppercase tracking-[0.25em] font-sans text-soft font-medium">
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
                className="hidden md:inline-block px-4 py-1.5 border border-white/30 text-cream hover:bg-cream hover:text-primary transition-all duration-300 rounded-full text-[10px] uppercase font-sans tracking-[0.2em]"
              >
                {wedding.nav.ctaLabel}
              </a>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden flex items-center gap-1 px-3 py-1.5 border border-white/35 text-cream hover:bg-white/10 transition-all rounded-full text-[10px] uppercase font-sans tracking-[0.15em]"
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
                <div className="px-6 py-4 flex flex-col space-y-4 text-center text-xs uppercase tracking-[0.2em] font-sans text-soft font-medium">
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
                      className="inline-block w-full py-2.5 bg-cream text-primary hover:bg-sand transition-colors rounded-full text-[10px] tracking-[0.2em] font-bold"
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
          className="w-full relative pt-28 pb-16 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden bg-cream"
        >
          <SectionBackground bg={backgrounds.sections.hero} />

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
                className="text-secondary text-[17px] md:text-[19px] leading-relaxed max-w-sm mx-auto mb-5 text-center"
              >
                {parrafo}
              </motion.p>
            ))}

            <motion.h2
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } },
              }}
              className="font-display tracking-[0.2em] uppercase text-[22px] sm:text-[24px] leading-tight text-primary mt-5 mb-8 text-center"
            >
              {wedding.hero.announcement}
            </motion.h2>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } },
              }}
              className="text-secondary text-[17px] md:text-[19px] leading-relaxed max-w-sm mx-auto mb-10 text-center"
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
                    <h1 className="font-display tracking-[0.1em] text-[28px] sm:text-[32px] leading-tight text-ink uppercase">
                      {wedding.couple[quien].firstName}
                    </h1>
                    <span className="font-display tracking-[0.05em] text-[17px] sm:text-[20px] text-ink uppercase mt-1">
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
                className="text-secondary text-[17px] md:text-[19px] leading-relaxed max-w-sm mx-auto mb-5 text-center"
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
              <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-8">
                <div className="border-y border-ink/40 py-2 text-center w-[88px] sm:w-[140px] md:w-[150px] shrink-0">
                  <span className="font-display tracking-[0.15em] sm:tracking-[0.2em] uppercase text-ink block text-[14px] leading-none">
                    {wedding.date.month}
                  </span>
                </div>

                <div className="font-display text-[44px] sm:text-6xl md:text-7xl text-ink leading-none px-1 shrink-0">
                  {wedding.date.day}
                </div>

                <div className="border-y border-ink/40 py-2 text-center w-[88px] sm:w-[140px] md:w-[150px] shrink-0">
                  <span className="font-display tracking-[0.15em] sm:tracking-[0.2em] text-ink block text-[16px] sm:text-[18px] leading-none">
                    {wedding.date.year}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <span className="font-display tracking-[0.25em] text-ink uppercase text-[15px] sm:text-[16px] leading-none">
                  {wedding.date.weekdayTime}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ================= 2. LUGAR ================= */}
        <section id="lugar" className="w-full pt-20 pb-20 md:py-32 relative bg-cream">
          <SectionBackground bg={backgrounds.sections.locations} />

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
                      <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary font-medium">
                        {place.title}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl text-primary mb-4 tracking-wide text-center">
                      {place.name}
                    </h3>

                    <p className="text-secondary text-[16px] mb-6 leading-relaxed text-center">
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

                    <div className="flex items-center justify-center gap-1.5 mb-8 text-secondary">
                      <Clock size={13} className="opacity-85" />
                      <span className="font-sans text-[12px] uppercase tracking-[0.12em]">{place.time}</span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <a
                      href={place.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-[220px] max-w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]"
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
                className="text-center text-secondary text-[16px] mt-12 max-w-md mx-auto leading-relaxed"
              >
                {wedding.locations.note}
              </motion.p>
            )}
          </motion.div>
        </section>

        {/* ================= 3. CUENTA ATRÁS (+ FOTOS) ================= */}
        <section id="fotos" className="pt-16 pb-16 relative overflow-hidden bg-cream">
          <SectionBackground bg={backgrounds.sections.photos} />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
            className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center"
          >
            {wedding.countdown.lead && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 35 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
                }}
                className="text-center mb-12"
              >
                <h2 className="font-display italic text-3xl md:text-4xl text-primary">
                  {timeLeft.completed ? wedding.countdown.today : wedding.countdown.lead}
                </h2>
                <div className="h-px w-10 bg-primary/20 mx-auto mt-4" />
              </motion.div>
            )}

            <div className={`text-center w-full ${hasPhotos ? 'mb-16' : ''}`}>
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
                }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 max-w-[240px] sm:max-w-[280px] md:max-w-[540px] mx-auto"
              >
                {(
                  [
                    [timeLeft.days, wedding.countdown.labels.days],
                    [timeLeft.hours, wedding.countdown.labels.hours],
                    [timeLeft.minutes, wedding.countdown.labels.minutes],
                    [timeLeft.seconds, wedding.countdown.labels.seconds],
                  ] as const
                ).map(([valor, etiqueta]) => (
                  <motion.div
                    key={etiqueta}
                    variants={{
                      hidden: { opacity: 0, scale: 0.5, y: 40 },
                      visible: {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        transition: { type: 'spring', stiffness: 100, damping: 14 },
                      },
                    }}
                    className="bg-moss aspect-square rounded-full shadow-md border border-primary/10 flex flex-col items-center justify-center p-2 sm:p-3"
                  >
                    <span className="font-display text-3xl sm:text-4xl md:text-5xl text-white leading-none">
                      {valor}
                    </span>
                    <span className="font-sans text-[10px] sm:text-[11px] md:text-xs uppercase tracking-widest text-white/90 mt-1.5">
                      {etiqueta}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {hasPhotos && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 45 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 60, damping: 14 } },
                }}
                className="relative w-full max-w-[440px] md:max-w-[720px] mx-auto h-[480px] md:h-[580px]"
              >
                <div
                  className="absolute cursor-pointer top-[15px] md:top-0 bottom-[48px] left-[5%] right-[5%]"
                  style={{
                    WebkitMaskImage:
                      'linear-gradient(to right, transparent, black 18%, black 82%, transparent), linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
                    WebkitMaskComposite: 'destination-in',
                    maskImage:
                      'linear-gradient(to right, transparent, black 18%, black 82%, transparent), linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
                    maskComposite: 'intersect',
                  }}
                  onClick={() => setActivePhoto(featuredPhoto)}
                >
                  <Image
                    src={featuredPhoto}
                    alt={wedding.couple.joinedNames}
                    fill
                    className="object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {[
                  { cls: 'w-[42%] md:w-[28%] -rotate-[8deg] hover:-rotate-[5deg]', style: { top: '6px', left: '4px' } },
                  { cls: 'w-[42%] md:w-[28%] rotate-[7deg] hover:rotate-[4deg]', style: { top: '4px', right: '4px' } },
                  { cls: 'w-[32%] md:w-[22%] rotate-[6deg] hover:rotate-[3deg]', style: { bottom: '-36px', left: '2px' } },
                  {
                    cls: 'w-[32%] md:w-[22%] left-[34%] md:left-[39%] -rotate-[2deg] hover:rotate-0',
                    style: { bottom: '-40px' },
                  },
                  { cls: 'w-[32%] md:w-[22%] -rotate-[7deg] hover:-rotate-[4deg]', style: { bottom: '-32px', right: '2px' } },
                ].map((slot, i) =>
                  polaroids[i] ? (
                    <div
                      key={i}
                      className={`absolute z-20 hover:z-40 bg-white p-2 pb-7 shadow-[0_6px_24px_rgba(0,0,0,0.25)] hover:scale-[1.05] transition-all duration-300 origin-center cursor-pointer ${slot.cls}`}
                      style={slot.style}
                      onClick={() => setActivePhoto(polaroids[i])}
                    >
                      <div className="relative w-full aspect-square overflow-hidden">
                        <Image
                          src={polaroids[i]}
                          alt={wedding.couple.joinedNames}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  ) : null
                )}
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* ================= 4. ITINERARIO ================= */}
        <section id="itinerario" className="pt-16 pb-16 text-primary relative bg-cream">
          <SectionBackground bg={backgrounds.sections.itinerary} />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
            className="max-w-4xl mx-auto px-6 relative z-10"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
              className="text-center mb-16"
            >
              <SectionHeading
                eyebrow={wedding.itinerary.eyebrow}
                title={wedding.itinerary.title}
                subtitle={wedding.itinerary.subtitle}
              />
            </motion.div>

            <div className={`relative mt-12 ${hasItineraryIcons ? 'pl-8 md:pl-0' : ''}`}>
              {/* Raíl de la línea de tiempo */}
              <div
                className={`absolute top-0 bottom-0 w-px bg-primary/20 md:left-1/2 md:-translate-x-1/2 ${
                  hasItineraryIcons ? 'left-[60px]' : 'left-[7px]'
                }`}
              />

              <div className={hasItineraryIcons ? 'space-y-16' : 'space-y-10'}>
                {wedding.itinerary.events.map((evento, i) => {
                  const derecha = i % 2 === 1;
                  return (
                    <motion.div
                      key={evento.title}
                      initial={{ opacity: 0, y: 60, scale: 0.92 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ type: 'spring', stiffness: 90, damping: 13 }}
                      className="relative flex flex-col md:flex-row items-start md:items-center min-h-[48px]"
                    >
                      {/* Marca sobre el raíl: la ilustración si la hay, si no un punto */}
                      <div
                        className={`absolute -translate-x-1/2 flex items-center justify-center z-10 md:left-1/2 ${
                          hasItineraryIcons ? 'left-[60px]' : 'left-[7px] top-2'
                        }`}
                      >
                        {evento.image ? (
                          <div className="relative w-28 h-28 md:w-36 md:h-36">
                            <Image
                              src={evento.image}
                              alt={evento.title}
                              fill
                              className="object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <span className="block w-[11px] h-[11px] rounded-full bg-primary/70 ring-4 ring-cream" />
                        )}
                      </div>

                      {derecha && <div className="w-full md:w-1/2 hidden md:block" />}

                      <div
                        className={`w-full md:w-1/2 mt-1 ${
                          hasItineraryIcons
                            ? derecha
                              ? 'md:pl-28 pl-[130px]'
                              : 'md:pr-28 md:text-right pl-[130px] md:pl-0'
                            : derecha
                              ? 'md:pl-14 pl-8'
                              : 'md:pr-14 md:text-right pl-8 md:pl-0'
                        }`}
                      >
                        <div className="inline-block px-3 py-1 bg-primary/5 border border-primary/15 rounded-full text-primary font-sans font-medium text-xs mb-2">
                          {evento.time}
                        </div>
                        <h4 className="font-display text-xl text-primary">{evento.title}</h4>
                      </div>

                      {!derecha && <div className="w-full md:w-1/2 hidden md:block" />}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ================= 5. DRESS CODE ================= */}
        {wedding.dressCode.enabled && (
          <section id="dresscode" className="py-14 md:py-16 bg-moss text-white relative">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } }}
              className="max-w-2xl mx-auto px-6 text-center"
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
              >
                <Shirt size={26} className="mx-auto mb-4 text-white/80" strokeWidth={1.5} />
                <SectionHeading eyebrow={wedding.dressCode.eyebrow} title={wedding.dressCode.title} light />
              </motion.div>

              <motion.ul
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10"
              >
                {wedding.dressCode.items.map((item) => (
                  <li key={item.who} className="flex flex-col items-center">
                    <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/70">
                      {item.who}
                    </span>
                    <span className="font-display text-[19px] text-white mt-1">{item.what}</span>
                  </li>
                ))}
              </motion.ul>

              {wedding.dressCode.closing && (
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
                  className="mt-8 text-[17px] text-white/90 leading-relaxed"
                >
                  {wedding.dressCode.closing}
                </motion.p>
              )}
            </motion.div>
          </section>
        )}

        {/* ================= 6. MÚSICA ================= */}
        {wedding.music.enabled && (
          <section id="musica" className="w-full py-14 md:py-16 relative bg-cream">
            <SectionBackground bg={backgrounds.sections.music} />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } }}
              className={`mx-auto px-6 text-center relative z-10 ${
                wedding.music.compact ? 'max-w-xl' : 'max-w-4xl'
              }`}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
                }}
                className={
                  wedding.music.compact
                    ? 'border-y border-primary/15 py-8'
                    : 'bg-cream border border-primary/10 rounded-sm p-10 md:p-14 shadow-sm'
                }
              >
                {wedding.music.image && (
                  <div className="flex justify-center mb-6">
                    <div className="relative w-28 h-28 md:w-36 md:h-36">
                      <Image
                        src={wedding.music.image}
                        alt="Música"
                        fill
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                <Music size={18} className="mx-auto mb-3 text-secondary" strokeWidth={1.5} />

                {/* En compacto el título baja de 28px, así que va redondo. */}
                <h2
                  className={
                    wedding.music.compact
                      ? 'font-display text-[20px] text-primary'
                      : 'font-display italic text-3xl md:text-4xl text-primary'
                  }
                >
                  {wedding.music.title}
                </h2>

                <p className="text-secondary text-[16px] leading-relaxed max-w-md mx-auto mt-2 mb-6">
                  {wedding.music.description}
                </p>

                <button
                  onClick={() => setShowMusicModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 border border-primary/30 text-primary hover:bg-primary hover:text-white font-sans text-[10px] uppercase tracking-[0.2em] rounded-full transition-all duration-300"
                >
                  <Music size={12} />
                  <span>{wedding.music.ctaLabel}</span>
                </button>

                {musicList.length > 0 && (
                  <button
                    onClick={() => setShowAllSongsModal(true)}
                    className="mt-4 block mx-auto font-sans text-[10px] uppercase tracking-[0.18em] text-secondary hover:text-primary transition-colors underline underline-offset-4"
                  >
                    {wedding.music.allLabel} ({musicList.length})
                  </button>
                )}
              </motion.div>
            </motion.div>
          </section>
        )}

        {/* ================= 7. LUNA DE MIEL / REGALO ================= */}
        {wedding.gift.enabled && (
          <section id="viaje" className="py-16 md:py-24 bg-moss relative text-white">
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

              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                className="text-[17px] text-white/90 leading-relaxed max-w-xl mx-auto mb-5"
              >
                {wedding.gift.description}
              </motion.p>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                className="text-[17px] text-white leading-relaxed max-w-lg mx-auto mb-8"
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
                    className="relative w-72 h-48 md:w-[26rem] md:h-72"
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
                <p className="text-white/75 text-[16px]">{wedding.gift.ctaHint}</p>
                <button
                  onClick={() => setShowIbanModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary hover:bg-white/90 font-sans text-[11px] uppercase tracking-[0.22em] rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-semibold"
                >
                  <Gift size={13} />
                  <span>{wedding.gift.ctaLabel}</span>
                </button>
              </motion.div>

              {wedding.gift.closing && (
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                  className="mt-8 text-[16px] text-white/80 leading-relaxed max-w-lg mx-auto"
                >
                  {wedding.gift.closing}
                </motion.p>
              )}
            </motion.div>
          </section>
        )}

        {/* ================= 8. CONFIRMACIÓN ================= */}
        <section id="confirmacion" className="w-full py-16 relative bg-cream">
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
                  <Check size={32} className="text-primary" />
                </motion.div>
              </div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
              >
                <SectionHeading title={wedding.rsvp.title} />
              </motion.div>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                className="text-[16px] text-secondary leading-relaxed max-w-md mx-auto mt-6"
              >
                Para poder organizar con cariño y detalle este día, agradeceríamos que rellenarais este
                formulario{' '}
                {wedding.rsvp.deadline ? (
                  <>
                    antes del <strong className="text-primary font-semibold">{wedding.rsvp.deadline}</strong>
                  </>
                ) : (
                  <strong className="text-primary font-semibold">lo antes posible</strong>
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

        {/* ================= 9. DATOS DE INTERÉS ================= */}
        <section id="informacion" className="py-16 relative bg-cream">
          <SectionBackground bg={backgrounds.sections.info} />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
            className="max-w-4xl mx-auto px-6 relative z-10"
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

            <div className="grid md:grid-cols-3 gap-6">
              {wedding.info.cards.map((card) => (
                <motion.div
                  key={card.title}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } },
                  }}
                  whileHover={{ y: -4 }}
                  className="bg-moss p-8 border border-white/10 rounded shadow-sm text-left"
                >
                  <h4 className="font-display text-[18px] text-white mb-3">{card.title}</h4>
                  <p className="font-sans text-[13px] text-white/85 leading-relaxed">{card.body}</p>
                  {card.bullets.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {card.bullets.map((linea) => (
                        <li key={linea} className="font-sans text-[13px] text-white font-medium leading-relaxed">
                          {linea}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ================= 10. DUDAS ================= */}
        <section className="py-16 relative bg-cream">
          <SectionBackground bg={backgrounds.sections.contact} />

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
              className="text-[16px] text-secondary leading-relaxed mb-10 max-w-md mx-auto"
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
                  className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
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
          <div className="max-w-2xl mx-auto px-6 relative z-10">
            <span className="font-display text-4xl md:text-5xl block mb-6 text-cream">
              {wedding.footer.headline}
            </span>
            <p className="font-sans text-[11px] md:text-xs uppercase tracking-[0.3em] text-cream mb-2 font-medium">
              {wedding.footer.signature}
            </p>
            <p className="font-sans font-medium text-[10px] text-cream/85 tracking-widest uppercase">
              {wedding.footer.dateLine}
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 py-3 bg-primary/30 border-t border-cream/10 z-10">
            <p className="font-sans text-[10px] text-cream/80 tracking-widest">
              By{' '}
              <a
                href="https://wa.me/34660104026"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-cream transition-colors"
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
                  className="absolute top-4 right-4 p-1.5 text-primary/60 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="flex justify-center mb-4 text-secondary">
                  <Plane size={32} />
                </div>

                <h3 className="font-display text-2xl text-primary mb-3">{wedding.gift.modal.title}</h3>

                <p className="font-sans text-[13px] text-secondary leading-relaxed mb-6">
                  {wedding.gift.modal.description}
                </p>

                <div className="bg-sand/60 p-4 rounded-md border border-primary/10 mb-6 text-left">
                  <span className="block text-[9px] font-sans uppercase tracking-[0.2em] text-secondary mb-2 font-bold">
                    {wedding.gift.modal.ibanLabel}
                  </span>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="font-sans text-[12px] sm:text-sm text-primary select-all font-bold tracking-wider break-all">
                      {wedding.gift.modal.iban}
                    </span>
                    <button
                      onClick={() => copyToClipboard(wedding.gift.modal.iban, setCopied)}
                      className="p-2 bg-primary/5 hover:bg-primary/10 text-primary rounded transition-all active:scale-95 shrink-0"
                      title="Copiar IBAN"
                    >
                      {copied ? (
                        <span className="text-[10px] font-sans uppercase tracking-wider font-semibold">
                          {wedding.gift.modal.copiedLabel}
                        </span>
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  <span className="block text-[9px] font-sans uppercase tracking-[0.2em] text-secondary mb-2 font-bold">
                    {wedding.gift.modal.swiftLabel}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-[12px] sm:text-sm text-primary select-all font-bold tracking-wider break-all">
                      {wedding.gift.modal.swift}
                    </span>
                    <button
                      onClick={() => copyToClipboard(wedding.gift.modal.swift, setCopiedSwift)}
                      className="p-2 bg-primary/5 hover:bg-primary/10 text-primary rounded transition-all active:scale-95 shrink-0"
                      title="Copiar Swift/BIC"
                    >
                      {copiedSwift ? (
                        <span className="text-[10px] font-sans uppercase tracking-wider font-semibold">
                          {wedding.gift.modal.copiedLabel}
                        </span>
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-start gap-1.5 mt-3 font-sans text-[10px] text-secondary leading-snug">
                    <Info size={11} className="mt-0.5 shrink-0" />
                    <span>{wedding.gift.modal.swiftHint}</span>
                  </div>

                  <span className="block font-sans text-[10px] text-secondary mt-3 pt-2 border-t border-primary/5">
                    Titulares: {wedding.gift.modal.holders}
                  </span>
                </div>

                <p className="font-sans text-[11px] text-secondary">{wedding.gift.modal.thanks}</p>
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
                  className="absolute top-4 right-4 p-1.5 text-primary/60 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="text-center mb-6">
                  <Music size={24} className="text-secondary mx-auto mb-2" />
                  <h3 className="font-display text-xl text-primary">{wedding.music.modal.title}</h3>
                  <p className="font-sans text-[12px] text-secondary mt-1">{wedding.music.modal.subtitle}</p>
                </div>

                <AnimatePresence>
                  {showAddSongSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-primary/10 border border-primary/25 rounded text-primary p-3 text-center mb-4 font-sans text-xs font-semibold flex items-center justify-center gap-1.5 overflow-hidden"
                    >
                      <Check size={14} />
                      <span>{wedding.music.modal.successLabel}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleAddSong} className="space-y-4">
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-secondary mb-1 font-semibold">
                      {wedding.music.modal.songLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={wedding.music.modal.songPlaceholder}
                      value={newSongTitle}
                      onChange={(e) => setNewSongTitle(e.target.value)}
                      className="w-full bg-sand/30 border border-primary/20 rounded p-2.5 text-primary focus:outline-none focus:border-primary transition-colors font-sans text-[16px]"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-wider text-secondary mb-1 font-semibold">
                      {wedding.music.modal.artistLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={wedding.music.modal.artistPlaceholder}
                      value={newSongArtist}
                      onChange={(e) => setNewSongArtist(e.target.value)}
                      className="w-full bg-sand/30 border border-primary/20 rounded p-2.5 text-primary focus:outline-none focus:border-primary transition-colors font-sans text-[16px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white tracking-[0.2em] font-sans text-[10px] uppercase rounded-full transition-all duration-300 shadow hover:shadow-md"
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
                  className="absolute top-4 right-4 p-1.5 text-primary/60 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="text-center mb-6">
                  <Music size={24} className="text-secondary mx-auto mb-2" />
                  <h3 className="font-display text-xl text-primary">{wedding.music.allLabel}</h3>
                  <p className="font-sans text-[12px] text-secondary mt-1">
                    {musicList.length} canciones sugeridas
                  </p>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {musicList.map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between bg-sand/30 p-2.5 rounded font-sans text-[12px] border border-primary/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-bold text-primary/40 w-4 shrink-0">#{index + 1}</span>
                        <div className="min-w-0 truncate">
                          <span className="font-bold text-primary">{song.title}</span>
                          <span className="text-secondary"> — {song.artist}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleVoteSong(song.id)}
                        aria-label={`Votar ${song.title}`}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-primary/5 rounded text-[10px] text-secondary border border-primary/10 transition-colors shrink-0 ml-2"
                      >
                        <Heart size={9} className="fill-primary/20 text-primary" />
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
