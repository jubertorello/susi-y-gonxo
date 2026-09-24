'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { wedding } from '@/config/wedding';
import { Check, ChevronLeft, ChevronRight, Info, Minus, Plus, Heart } from 'lucide-react';

const BUS = wedding.rsvp.bus;
const COMPANIONS = wedding.rsvp.companions;

export interface CompanionData {
  name: string;
  hasIntolerance: boolean;
  intolerance: string;
  busIda: boolean;
  busVuelta: boolean;
}

export interface RSVPState {
  attending: boolean;
  guestName: string;
  hasIntolerance: boolean;
  dietaryRestrictions: string;
  busIda: boolean;
  busVuelta: boolean;
  companions: CompanionData[];
  message: string;
  submittedAt: string;
}

interface RSVPFormProps {
  onSubmitted: (data: RSVPState) => void;
  onEdit?: () => void;
  rsvpData: RSVPState | null;
  formSubmitted: boolean;
}

const nuevoAcompanante = (): CompanionData => ({
  name: '',
  hasIntolerance: false,
  intolerance: '',
  busIda: false,
  busVuelta: false,
});

function YesNoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 rounded font-sans text-xs uppercase tracking-[0.15em] transition-all duration-200 border ${
            value === v
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-secondary border-primary/20 hover:border-primary/50'
          }`}
        >
          {v ? 'Sí' : 'No'}
        </button>
      ))}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-sans text-[11px] uppercase tracking-wider text-secondary font-semibold mb-2">
      {children}
    </span>
  );
}

const inputClass =
  'w-full bg-sand/30 border border-primary/20 rounded p-3 text-primary focus:outline-none focus:border-primary focus:bg-sand/50 transition-colors text-[16px] font-sans';

function GuestFields({
  nameLabel,
  name,
  onName,
  hasIntolerance,
  onHasIntolerance,
  intolerance,
  onIntolerance,
  busIda,
  onBusIda,
  busVuelta,
  onBusVuelta,
}: {
  nameLabel: string;
  name: string;
  onName: (v: string) => void;
  hasIntolerance: boolean;
  onHasIntolerance: (v: boolean) => void;
  intolerance: string;
  onIntolerance: (v: string) => void;
  busIda: boolean;
  onBusIda: (v: boolean) => void;
  busVuelta: boolean;
  onBusVuelta: (v: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <label className="block">
        <FieldLabel>{nameLabel} *</FieldLabel>
        <input
          type="text"
          placeholder="Nombre y apellidos"
          value={name}
          onChange={(e) => onName(e.target.value)}
          className={inputClass}
        />
      </label>

      <div>
        <FieldLabel>¿Tienes intolerancia o alergia alimentaria?</FieldLabel>
        <YesNoToggle value={hasIntolerance} onChange={onHasIntolerance} />
        <AnimatePresence>
          {hasIntolerance && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                placeholder="Ej. celíaco, alergia a frutos secos..."
                value={intolerance}
                onChange={(e) => onIntolerance(e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {BUS.enabled && (
        <>
          <div>
            <FieldLabel>¿Necesitas autobús de ida?</FieldLabel>
            <p className="font-sans text-[11px] text-secondary mb-2 leading-snug">{BUS.idaHint}</p>
            <YesNoToggle value={busIda} onChange={onBusIda} />
          </div>

          <div>
            <FieldLabel>¿Necesitas autobús de vuelta?</FieldLabel>
            <p className="font-sans text-[11px] text-secondary mb-2 leading-snug">{BUS.vueltaHint}</p>
            <YesNoToggle value={busVuelta} onChange={onBusVuelta} />
          </div>
        </>
      )}
    </div>
  );
}

/** Resumen de autobús de una persona, para las pantallas de repaso. */
const resumenBus = (g: { busIda: boolean; busVuelta: boolean }) => {
  if (!BUS.enabled) return '';
  if (!g.busIda && !g.busVuelta) return 'No necesita autobús';
  return `Ida: ${g.busIda ? 'Sí' : 'No'} · Vuelta: ${g.busVuelta ? 'Sí' : 'No'}`;
};

export default function RSVPForm({ onSubmitted, onEdit, rsvpData, formSubmitted }: RSVPFormProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [attending, setAttending] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [hasIntolerance, setHasIntolerance] = useState(false);
  const [intolerance, setIntolerance] = useState('');
  const [busIda, setBusIda] = useState(false);
  const [busVuelta, setBusVuelta] = useState(false);

  const [companionCount, setCompanionCount] = useState(0);
  const [companions, setCompanions] = useState<CompanionData[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (step === 1 || !topRef.current) return;
    const rect = topRef.current.getBoundingClientRect();
    if (rect.top < 72) {
      window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: 'smooth' });
    }
  }, [step]);

  const handleAttendance = (value: boolean) => {
    setAttending(value);
    setStep(2);
  };

  const goBack = () => {
    if (step === 2) {
      setAttending(null);
      setStep(1);
    } else {
      setStep((s) => s - 1);
    }
  };

  const updateCompanionCount = (delta: number) => {
    const next = Math.max(0, Math.min(COMPANIONS.max, companionCount + delta));
    setCompanionCount(next);
    setCompanions((prev) =>
      next > prev.length
        ? [...prev, ...Array.from({ length: next - prev.length }, nuevoAcompanante)]
        : prev.slice(0, next)
    );
  };

  const updateCompanion = (index: number, field: keyof CompanionData, value: string | boolean) => {
    setCompanions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .insert([
          {
            client_id: wedding.clientId,
            attending: attending ?? true,
            guest_name: guestName.trim() || null,
            dietary_restrictions: attending && hasIntolerance ? intolerance.trim() : '',
            bus_ida: attending ? busIda : false,
            bus_vuelta: attending ? busVuelta : false,
            message: message.trim(),
          },
        ])
        .select()
        .single();

      if (!error && data) {
        if (attending && companions.length > 0) {
          await supabase.from('rsvps').insert(
            companions.map((c) => ({
              client_id: wedding.clientId,
              parent_rsvp_id: data.id,
              attending: true,
              guest_name: c.name.trim(),
              dietary_restrictions: c.hasIntolerance ? c.intolerance.trim() : '',
              bus_ida: c.busIda,
              bus_vuelta: c.busVuelta,
              message: '',
            }))
          );
        }

        const savedState: RSVPState = {
          attending: data.attending ?? true,
          guestName: data.guest_name || '',
          hasIntolerance,
          dietaryRestrictions: data.dietary_restrictions || '',
          busIda: data.bus_ida === true,
          busVuelta: data.bus_vuelta === true,
          companions,
          message: data.message || '',
          submittedAt: data.created_at,
        };
        localStorage.setItem('wedding_rsvp_status', JSON.stringify(savedState));
        onSubmitted(savedState);
      } else {
        alert('Hubo un error al enviar tu confirmación. Por favor, inténtalo de nuevo.');
        console.error(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------- resumen
  if (formSubmitted && rsvpData) {
    return (
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center p-3.5 bg-primary/10 text-primary rounded-full mb-6">
          <Heart size={28} className="fill-primary/20" />
        </div>

        {rsvpData.attending ? (
          <>
            <h4 className="font-display text-xl text-primary mb-3">¡Confirmado con éxito!</h4>
            <p className="font-sans text-sm text-secondary mb-6 leading-relaxed">
              ¡Tenemos muchísima ilusión por vivir este día tan bonito a tu lado!
            </p>
            <div className="bg-sand/40 p-4 rounded text-left font-sans text-xs text-primary mb-8 space-y-2 border border-primary/5">
              <div>
                <span className="font-semibold uppercase tracking-wider text-[10px] text-secondary">Invitado</span>
                <br />
                {rsvpData.guestName}
              </div>
              <div>
                <span className="font-semibold uppercase tracking-wider text-[10px] text-secondary">
                  Intolerancia
                </span>
                <br />
                {rsvpData.dietaryRestrictions || 'Ninguna'}
              </div>
              {BUS.enabled && (
                <div>
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-secondary">Autobús</span>
                  <br />
                  {resumenBus(rsvpData)}
                </div>
              )}
              {rsvpData.companions.length > 0 && (
                <div>
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-secondary">
                    Acompañantes
                  </span>
                  <ul className="mt-1 space-y-1 pl-2">
                    {rsvpData.companions.map((c, i) => (
                      <li key={i} className="text-secondary">
                        {c.name}
                        {c.hasIntolerance && c.intolerance ? ` · ${c.intolerance}` : ''}
                        {BUS.enabled ? ` · ${resumenBus(c)}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rsvpData.message && (
                <div>
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-secondary">Mensaje</span>
                  <br />
                  {rsvpData.message}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h4 className="font-display text-xl text-primary mb-3">Gracias por avisarnos</h4>
            <p className="font-sans text-sm text-secondary mb-6 leading-relaxed">
              Lamentamos que no puedas acompañarnos, ¡te echaremos de menos!
            </p>
            {rsvpData.message && (
              <div className="bg-sand/40 p-4 rounded text-left font-sans text-xs text-primary mb-8 border border-primary/5">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-secondary">Tu mensaje</span>
                <br />
                {rsvpData.message}
              </div>
            )}
          </>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-4 w-full py-3 border border-primary/25 text-primary hover:bg-sand/50 font-sans text-[10px] uppercase tracking-[0.2em] rounded-full transition-all duration-300"
          >
            Rellenar otro formulario
          </button>
        )}
      </div>
    );
  }

  const totalSteps = attending === false ? 2 : 4;
  const botonPrimario =
    'w-full py-3.5 bg-primary hover:bg-primary/90 text-white tracking-[0.2em] font-sans text-[10px] uppercase rounded-full transition-all duration-300 shadow hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="space-y-5" ref={topRef}>
      {step > 1 && (
        <div className="relative flex items-center justify-center h-6">
          <button
            type="button"
            onClick={goBack}
            className="absolute left-0 flex items-center gap-1 font-sans text-[10px] uppercase tracking-[0.15em] text-secondary hover:text-primary transition-colors"
          >
            <ChevronLeft size={13} />
            Volver
          </button>
          {attending !== null && (
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`block rounded-full transition-all duration-300 ${
                    i + 1 === step
                      ? 'w-4 h-1.5 bg-primary'
                      : i + 1 < step
                        ? 'w-1.5 h-1.5 bg-primary/40'
                        : 'w-1.5 h-1.5 bg-primary/15'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* PASO 1 */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="text-center">
              <p className="font-display text-[20px] text-primary mb-1">¿Podrás acompañarnos?</p>
              <p className="font-sans text-xs text-secondary">
                {wedding.rsvp.deadline
                  ? `Por favor, confirma tu asistencia antes del ${wedding.rsvp.deadline}`
                  : 'Por favor, confirma tu asistencia lo antes posible'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleAttendance(true)}
                className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-sans text-xs uppercase tracking-[0.2em] rounded-full transition-all duration-300 shadow hover:shadow-md"
              >
                Sí, asistiré 🎉
              </button>
              <button
                type="button"
                onClick={() => handleAttendance(false)}
                className="flex-1 py-4 bg-white hover:bg-sand text-primary border border-primary/20 font-sans text-xs uppercase tracking-[0.2em] rounded-full transition-all duration-300"
              >
                No podré asistir
              </button>
            </div>
          </motion.div>
        )}

        {/* PASO 2 — NO */}
        {step === 2 && attending === false && (
          <motion.div
            key="step2-no"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="text-center mb-2">
              <p className="font-display text-[18px] text-primary">Gracias por avisarnos</p>
              <p className="font-sans text-xs text-secondary mt-1">
                Lamentamos que no puedas estar con nosotros
              </p>
            </div>
            <label className="block">
              <FieldLabel>Nombre y Apellidos *</FieldLabel>
              <input
                type="text"
                placeholder="Nombre y apellidos"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <FieldLabel>¿Quieres dejar un mensaje a los novios? (opcional)</FieldLabel>
              <textarea
                rows={3}
                placeholder="Alguna dedicatoria o comentario..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={inputClass}
              />
            </label>
            <button type="button" disabled={submitting || !guestName.trim()} onClick={handleSubmit} className={botonPrimario}>
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          </motion.div>
        )}

        {/* PASO 2 — SÍ */}
        {step === 2 && attending === true && (
          <motion.div
            key="step2-yes"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <p className="font-sans text-[11px] uppercase tracking-wider text-secondary font-semibold text-center">
              Tus datos
            </p>
            <GuestFields
              nameLabel="Nombre y Apellidos"
              name={guestName}
              onName={setGuestName}
              hasIntolerance={hasIntolerance}
              onHasIntolerance={setHasIntolerance}
              intolerance={intolerance}
              onIntolerance={setIntolerance}
              busIda={busIda}
              onBusIda={setBusIda}
              busVuelta={busVuelta}
              onBusVuelta={setBusVuelta}
            />
            <button
              type="button"
              disabled={!guestName.trim()}
              onClick={() => setStep(3)}
              className={`${botonPrimario} flex items-center justify-center gap-2`}
            >
              Siguiente <ChevronRight size={13} />
            </button>
          </motion.div>
        )}

        {/* PASO 3 — Acompañantes */}
        {step === 3 && attending === true && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div>
              <p className="font-sans text-[11px] uppercase tracking-wider text-secondary font-semibold text-center mb-1">
                ¿Vendrás con acompañante?
              </p>
              <p className="font-sans text-[10px] text-secondary/70 text-center mb-4">(si procede)</p>

              {(COMPANIONS.note || COMPANIONS.childrenNote) && (
                <div className="flex items-start gap-2 bg-sand/60 border border-primary/10 rounded px-3 py-2.5 mb-5">
                  <Info size={13} className="text-secondary mt-0.5 shrink-0" />
                  <div className="font-sans text-[11.5px] text-secondary leading-relaxed">
                    {COMPANIONS.note && <p>{COMPANIONS.note}</p>}
                    {COMPANIONS.childrenNote && (
                      <p className={COMPANIONS.note ? 'mt-1.5' : ''}>
                        <span className="text-primary font-semibold">*</span> {COMPANIONS.childrenNote}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() => updateCompanionCount(-1)}
                  disabled={companionCount === 0}
                  aria-label="Quitar acompañante"
                  className="w-9 h-9 rounded-full border border-primary/25 flex items-center justify-center text-primary hover:bg-sand transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus size={14} />
                </button>
                <span className="font-display text-2xl text-primary w-8 text-center">{companionCount}</span>
                <button
                  type="button"
                  onClick={() => updateCompanionCount(1)}
                  disabled={companionCount === COMPANIONS.max}
                  aria-label="Añadir acompañante"
                  className="w-9 h-9 rounded-full border border-primary/25 flex items-center justify-center text-primary hover:bg-sand transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="text-center font-sans text-[10px] text-secondary mt-2">
                {companionCount === 0
                  ? 'Sin acompañantes'
                  : companionCount === 1
                    ? '1 acompañante'
                    : `${companionCount} acompañantes`}
              </p>
            </div>

            <AnimatePresence>
              {companions.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="border border-primary/10 rounded p-4 bg-white/60 space-y-4"
                >
                  <p className="font-sans text-[10px] uppercase tracking-wider text-secondary font-semibold">
                    Acompañante {i + 1}
                  </p>
                  <GuestFields
                    nameLabel="Nombre y Apellidos"
                    name={c.name}
                    onName={(v) => updateCompanion(i, 'name', v)}
                    hasIntolerance={c.hasIntolerance}
                    onHasIntolerance={(v) => updateCompanion(i, 'hasIntolerance', v)}
                    intolerance={c.intolerance}
                    onIntolerance={(v) => updateCompanion(i, 'intolerance', v)}
                    busIda={c.busIda}
                    onBusIda={(v) => updateCompanion(i, 'busIda', v)}
                    busVuelta={c.busVuelta}
                    onBusVuelta={(v) => updateCompanion(i, 'busVuelta', v)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              disabled={companions.some((c) => !c.name.trim())}
              onClick={() => setStep(4)}
              className={`${botonPrimario} flex items-center justify-center gap-2`}
            >
              Siguiente <ChevronRight size={13} />
            </button>
          </motion.div>
        )}

        {/* PASO 4 — Resumen */}
        {step === 4 && attending === true && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="bg-sand/40 border border-primary/10 rounded p-4 font-sans space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-secondary">
                Resumen de tu confirmación
              </p>
              <div className="space-y-2 text-xs text-primary">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-secondary">Invitado</span>
                  <p className="mt-0.5">{guestName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-secondary">Intolerancia</span>
                  <p className="mt-0.5">{hasIntolerance ? intolerance || '—' : 'Ninguna'}</p>
                </div>
                {BUS.enabled && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-secondary">Autobús</span>
                    <p className="mt-0.5">{resumenBus({ busIda, busVuelta })}</p>
                  </div>
                )}
                {companions.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-secondary">
                      Acompañantes ({companions.length})
                    </span>
                    <ul className="mt-1 space-y-1 pl-2">
                      {companions.map((c, i) => (
                        <li key={i} className="text-secondary">
                          {c.name}
                          {c.hasIntolerance && c.intolerance ? ` · ${c.intolerance}` : ''}
                          {BUS.enabled ? ` · ${resumenBus(c)}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <label className="block">
              <FieldLabel>¿Quieres dejar un mensaje a los novios? (opcional)</FieldLabel>
              <textarea
                rows={3}
                placeholder="Alguna dedicatoria, comentario adicional..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={inputClass}
              />
            </label>

            <button type="button" disabled={submitting} onClick={handleSubmit} className={botonPrimario}>
              {submitting ? 'Enviando...' : 'Enviar Confirmación'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
