import React, { useMemo, useState } from "react";
import { Check, Sparkles, Star, Trash2, X } from "lucide-react";
import { Character, Psychube, UserRoster } from "../types/models";
import { deleteRosterItem, saveRosterItem } from "../services/api";

interface RosterEditorModalProps {
  character: Character;
  existingRoster?: UserRoster;
  psychubes: Psychube[];
  onClose: () => void;
  onSaved: () => void;
}

const PATTERNS: { id: string; label: string }[] = [
  { id: "Elucidation", label: "Elucidation (Fokus Crit Rate & DMG)" },
  { id: "Placidity", label: "Placidity (Fokus Heal & Bertahan)" },
  { id: "Stupefaction", label: "Stupefaction (Fokus HP Tebal & Tahan Banting)" },
  { id: "Hyperphrenia", label: "Hyperphrenia (Fokus ATK & True DMG)" },
  { id: "Genuinity", label: "Genuinity (Pertahanan Seimbang)" },
  { id: "Aspirational", label: "Aspirational (Tembus Armor & Crit)" },
];

const INSIGHT_OPTIONS = [
  { level: 0, title: "Insight 0", subtitle: "Maks Lv.30", numeral: "0" },
  { level: 1, title: "Insight I", subtitle: "Maks Lv.40", numeral: "I" },
  { level: 2, title: "Insight II", subtitle: "Maks Lv.50", numeral: "II" },
  { level: 3, title: "Insight III", subtitle: "Maks Lv.60", numeral: "III" },
];

/**
 * Komponen Ikon/Gambar Lambang Insight khas Reverse: 1999 (I0 - I3)
 */
function InsightEmblem({ level, active }: { level: number; active: boolean }) {
  const strokeColor = active ? "#1c1917" : level === 3 ? "#fbbf24" : level === 2 ? "#38bdf8" : level === 1 ? "#d97706" : "#78716c";
  const fillBg = active
    ? "bg-amber-950/25 border-stone-900/30"
    : level === 3
    ? "bg-amber-500/15 border-amber-500/40"
    : level === 2
    ? "bg-sky-500/15 border-sky-500/30"
    : level === 1
    ? "bg-orange-500/15 border-orange-500/30"
    : "bg-stone-800 border-stone-700";

  return (
    <div
      className={`w-10 h-10 rounded-xl border flex items-center justify-center relative shrink-0 ${fillBg}`}
    >
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        {/* Lingkaran / Bingkai Arcane */}
        <circle
          cx="20"
          cy="20"
          r="15"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeDasharray={level === 0 ? "3 3" : undefined}
          opacity={level === 0 ? 0.6 : 0.9}
        />
        {/* Ornamen Bintang sesuai Tingkat Insight */}
        {level >= 1 && (
          <path
            d="M20 3 L23 14 L34 14 L25 21 L28 32 L20 25 L12 32 L15 21 L6 14 L17 14 Z"
            stroke={strokeColor}
            strokeWidth="1.5"
            fill={active ? "rgba(28,25,23,0.18)" : "rgba(251,191,36,0.15)"}
          />
        )}
        {level >= 2 && (
          <rect
            x="11"
            y="11"
            width="18"
            height="18"
            transform="rotate(45 20 20)"
            stroke={strokeColor}
            strokeWidth="1.4"
          />
        )}
        {level === 3 && (
          <circle cx="20" cy="20" r="4.5" fill={strokeColor} />
        )}
      </svg>
      <span
        className={`absolute -bottom-1 -right-1 text-[10px] font-extrabold px-1 rounded ${
          active
            ? "bg-stone-950 text-amber-300"
            : "bg-stone-900 text-stone-300 border border-stone-700"
        }`}
      >
        I{level}
      </span>
    </div>
  );
}

export default function RosterEditorModal({
  character,
  existingRoster,
  psychubes,
  onClose,
  onSaved,
}: RosterEditorModalProps) {
  const [insight, setInsight] = useState<number>(existingRoster?.insight ?? 3);
  const [level, setLevel] = useState<number>(existingRoster?.level ?? 60);
  const [portray, setPortray] = useState<number>(existingRoster?.portray ?? 0);
  const [resonanceLevel, setResonanceLevel] = useState<number>(
    existingRoster?.resonance_level ?? 10
  );
  const [resonancePattern, setResonancePattern] = useState<string>(
    existingRoster?.resonance_pattern || character.best_pattern || "Elucidation"
  );
  const [equippedPsychubeId, setEquippedPsychubeId] = useState<string>(
    existingRoster?.equipped_psychube_id || character.best_psychube_id
  );
  const [saving, setSaving] = useState<boolean>(false);

  const maxLevel = insight === 0 ? 30 : insight === 1 ? 40 : insight === 2 ? 50 : 60;

  // Urutkan agar senjata rekomendasi (Best in Slot) selalu tampil paling atas
  const sortedPsychubes = useMemo(() => {
    return [...psychubes].sort((a, b) => {
      if (a.id === character.best_psychube_id) return -1;
      if (b.id === character.best_psychube_id) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [psychubes, character.best_psychube_id]);

  const handleInsightChange = (val: number) => {
    setInsight(val);
    const newMax = val === 0 ? 30 : val === 1 ? 40 : val === 2 ? 50 : 60;
    if (level > newMax) setLevel(newMax);
  };

  const applyBestBuild = () => {
    setInsight(3);
    setLevel(60);
    setResonanceLevel(10);
    setResonancePattern(character.best_pattern || "Elucidation");
    setEquippedPsychubeId(character.best_psychube_id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saveRosterItem({
        character_id: character.id,
        insight,
        level: Math.min(level, maxLevel),
        portray,
        resonance_level: resonanceLevel,
        resonance_pattern: resonancePattern,
        euphoria_unlocked: character.has_euphoria && insight === 3,
        equipped_psychube_id: equippedPsychubeId,
        psychube_level: 60,
        psychube_amp: 1,
        notes: existingRoster?.notes ?? "",
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await deleteRosterItem(character.id);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-char-title"
    >
      <div className="bg-[#181512] border border-stone-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl text-[#f3ede2] max-h-[92vh] overflow-y-auto">
        {/* HEADER POPUP */}
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <img
              src={character.image_url}
              alt={character.name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-xl object-cover border border-amber-500/40 bg-stone-900"
            />
            <div>
              <h2 id="modal-char-title" className="text-lg font-bold text-amber-100">
                {existingRoster
                  ? `Build ${character.name} Saya`
                  : `Masukkan Build ${character.name}`}
              </h2>
              <p className="text-xs text-stone-400">
                {character.rarity}★ {character.afflatus} · {character.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-900 text-stone-400 hover:text-white cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOMBOL BANTUAN AUTO-ISI REKOMENDASI */}
        <div className="mt-3 flex items-center justify-between gap-2 bg-stone-900/80 border border-stone-800 rounded-xl px-3 py-2">
          <span className="text-xs text-stone-300">
            Rekomendasi Stat:{" "}
            <strong className="text-amber-300">{character.resonance_focus}</strong>
          </span>
          <button
            type="button"
            onClick={applyBestBuild}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Isi Otomatis Terbaik
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* 1. INSIGHT (GAMBAR LAMBANG + TEKS) */}
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-2">
              1. Pilih Tingkat Insight (Promosi Karakter)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INSIGHT_OPTIONS.map((opt) => {
                const isSelected = insight === opt.level;
                return (
                  <button
                    type="button"
                    key={opt.level}
                    onClick={() => handleInsightChange(opt.level)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-stone-950 border-amber-400 shadow-md"
                        : "bg-stone-900/90 text-stone-300 border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    <InsightEmblem level={opt.level} active={isSelected} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">{opt.title}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? "text-stone-900 font-semibold" : "text-stone-400"
                        }`}
                      >
                        {opt.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. LEVEL & PORTRAY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-900/50 border border-stone-800/80 rounded-xl p-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-stone-300 font-medium">Level Karakter</span>
                <span className="text-amber-300 font-bold">
                  Lv. {level} / {maxLevel}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={maxLevel}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full accent-amber-500 mt-1.5 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1.5">
                Portray / Duplikat (P0–P5)
              </label>
              <div className="grid grid-cols-6 gap-1">
                {[0, 1, 2, 3, 4, 5].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPortray(p)}
                    className={`py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      portray === p
                        ? "bg-amber-500 text-stone-950"
                        : "bg-stone-900 text-stone-400 border border-stone-800"
                    }`}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. RESONANCE & POLA STAT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-900/50 border border-stone-800/80 rounded-xl p-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-stone-300 font-medium">Level Resonance</span>
                <span className="text-sky-300 font-bold">Lv. {resonanceLevel}</span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                value={resonanceLevel}
                onChange={(e) => setResonanceLevel(Number(e.target.value))}
                className="w-full accent-sky-400 mt-1.5 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-300 font-medium mb-1.5">
                Pola Stat (Modulasi)
              </label>
              <select
                value={resonancePattern}
                onChange={(e) => setResonancePattern(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-100"
              >
                {PATTERNS.map((pat) => (
                  <option key={pat.id} value={pat.id}>
                    {pat.id === character.best_pattern ? "★ " : ""}
                    {pat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. PILIH SENJATA / PSYCHUBE (GAMBAR + TEKS) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-stone-300">
                2. Pilih Senjata (Psychube) yang Dipakai
              </label>
              <span className="text-[11px] text-stone-400">
                Klik gambar senjata di bawah
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
              {sortedPsychubes.map((cube) => {
                const isSelected = equippedPsychubeId === cube.id;
                const isBest = cube.id === character.best_psychube_id;

                return (
                  <button
                    type="button"
                    key={cube.id}
                    onClick={() => setEquippedPsychubeId(cube.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/50"
                        : "bg-stone-900/90 border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    {/* Gambar Ikon Senjata */}
                    <img
                      src={cube.image_url}
                      alt={cube.name}
                      width={48}
                      height={48}
                      loading="lazy"
                      className="w-12 h-12 rounded-lg object-cover bg-stone-950 border border-stone-700 shrink-0"
                    />

                    {/* Teks Nama, Stat, & Penjelasan Singkat Senjata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-stone-100 truncate">
                          {cube.name}
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            Terbaik
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                        Stat Utama: {cube.engraving_stat}
                      </div>
                      <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                        {cube.passive_summary}
                      </p>
                    </div>

                    {/* Indikator Terpilih */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-amber-500 text-stone-950"
                          : "border border-stone-700 bg-stone-950"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TOMBOL SIMPAN / HAPUS */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-800">
            {existingRoster ? (
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus dari Koleksi
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-stone-900 text-stone-300 text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {existingRoster ? "Simpan Perubahan" : "Simpan ke Koleksi"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
