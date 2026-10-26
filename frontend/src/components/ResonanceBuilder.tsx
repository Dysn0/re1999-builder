import { useEffect, useMemo, useState } from "react";
import {
  BookmarkCheck,
  CheckCircle2,
  Grid,
  RotateCcw,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import {
  Character,
  GridPiece,
  ResonancePreset,
  UserRoster,
} from "../types/models";
import {
  fetchResonancePresets,
  saveResonancePreset,
  saveRosterItem,
} from "../services/api";

interface ResonanceBuilderProps {
  characters: Character[];
  roster: UserRoster[];
  onRosterUpdated: () => void;
}

interface PatternOption {
  id: string;
  name: string;
  shortDesc: string;
  color: string;
  bonus: {
    atk_pct: number;
    hp_pct: number;
    def_pct: number;
    crit_rate: number;
    crit_dmg: number;
  };
}

const PATTERN_OPTIONS: PatternOption[] = [
  {
    id: "Elucidation",
    name: "Elucidation",
    shortDesc: "Fokus Serangan Kritis (Crit Rate & Crit DMG)",
    color: "#f59e0b",
    bonus: { atk_pct: 6, hp_pct: 0, def_pct: 0, crit_rate: 12, crit_dmg: 18 },
  },
  {
    id: "Placidity",
    name: "Placidity",
    shortDesc: "Fokus Healer & Pemulihan (HP & Pertahanan)",
    color: "#34d399",
    bonus: { atk_pct: 4, hp_pct: 14, def_pct: 10, crit_rate: 0, crit_dmg: 0 },
  },
  {
    id: "Stupefaction",
    name: "Stupefaction",
    shortDesc: "Fokus Darah Tebal & Tahan Banting (Max HP%)",
    color: "#38bdf8",
    bonus: { atk_pct: 0, hp_pct: 18, def_pct: 12, crit_rate: 0, crit_dmg: 0 },
  },
  {
    id: "Hyperphrenia",
    name: "Hyperphrenia",
    shortDesc: "Fokus Serangan Murni & True DMG (ATK Tinggi)",
    color: "#f43f5e",
    bonus: { atk_pct: 14, hp_pct: 6, def_pct: 0, crit_rate: 6, crit_dmg: 10 },
  },
  {
    id: "Genuinity",
    name: "Genuinity",
    shortDesc: "Seimbang antara Serangan & Pertahanan",
    color: "#a855f7",
    bonus: { atk_pct: 8, hp_pct: 8, def_pct: 8, crit_rate: 5, crit_dmg: 5 },
  },
  {
    id: "Aspirational",
    name: "Aspirational",
    shortDesc: "Fokus Tembus Pertahanan Lawan & Crit DMG",
    color: "#eab308",
    bonus: { atk_pct: 10, hp_pct: 0, def_pct: 0, crit_rate: 8, crit_dmg: 16 },
  },
];

interface BlockTemplate {
  typeId: string;
  name: string;
  statLabel: string;
  color: string;
  shape: number[][];
  stats: {
    atk_pct?: number;
    hp_pct?: number;
    def_pct?: number;
    crit_rate?: number;
    crit_dmg?: number;
  };
}

// Katalog Kepingan Balok Puzzle khas Reverse: 1999
const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    typeId: "core-cross",
    name: "Balok Inti (+)",
    statLabel: "+8% ATK · +8% Crit Rate",
    color: "#f59e0b",
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    stats: { atk_pct: 8, hp_pct: 5, crit_rate: 8, crit_dmg: 10 },
  },
  {
    typeId: "crit-t",
    name: "Balok T (Kritis)",
    statLabel: "+7% Crit Rate · +10% Crit DMG",
    color: "#fb7185",
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    stats: { crit_rate: 7, crit_dmg: 10 },
  },
  {
    typeId: "atk-l",
    name: "Balok L (Serangan)",
    statLabel: "+7% ATK · +4% Crit Rate",
    color: "#f97316",
    shape: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    stats: { atk_pct: 7, crit_rate: 4 },
  },
  {
    typeId: "cdmg-z",
    name: "Balok Z (Ledakan)",
    statLabel: "+12% Crit DMG · +4% ATK",
    color: "#c084fc",
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    stats: { atk_pct: 4, crit_dmg: 12 },
  },
  {
    typeId: "hp-i",
    name: "Balok I (Darah/HP)",
    statLabel: "+9% Max HP · +5% DEF",
    color: "#34d399",
    shape: [[1], [1], [1]],
    stats: { hp_pct: 9, def_pct: 5 },
  },
  {
    typeId: "def-box",
    name: "Balok Kotak (Perisai)",
    statLabel: "+6% HP · +8% DEF",
    color: "#38bdf8",
    shape: [
      [1, 1],
      [1, 1],
    ],
    stats: { hp_pct: 6, def_pct: 8 },
  },
];

function PatternEmblem({ id, color }: { id: string; color: string }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" className="w-6 h-6" fill="none">
        <circle cx="18" cy="18" r="13" stroke={color} strokeWidth="1.5" opacity="0.5" />
        {id === "Elucidation" && (
          <path
            d="M18 4 L22 14 L32 18 L22 22 L18 32 L14 22 L4 18 L14 14 Z"
            stroke={color}
            strokeWidth="1.8"
            fill={`${color}33`}
          />
        )}
        {id === "Placidity" && (
          <path
            d="M18 7 C25 11, 27 20, 18 29 C9 20, 11 11, 18 7 Z"
            stroke={color}
            strokeWidth="1.8"
            fill={`${color}33`}
          />
        )}
        {id === "Stupefaction" && (
          <polygon
            points="18,5 29,11 27,25 18,31 9,25 7,11"
            stroke={color}
            strokeWidth="1.8"
            fill={`${color}33`}
          />
        )}
        {id === "Hyperphrenia" && (
          <polygon
            points="18,4 29,27 18,22 7,27"
            stroke={color}
            strokeWidth="1.8"
            fill={`${color}33`}
          />
        )}
        {id === "Genuinity" && (
          <rect
            x="9"
            y="9"
            width="18"
            height="18"
            transform="rotate(45 18 18)"
            stroke={color}
            strokeWidth="1.8"
            fill={`${color}33`}
          />
        )}
        {id === "Aspirational" && (
          <>
            <polygon
              points="18,5 30,27 6,27"
              stroke={color}
              strokeWidth="1.8"
              fill={`${color}33`}
            />
            <circle cx="18" cy="20" r="3" fill={color} />
          </>
        )}
      </svg>
    </div>
  );
}

function MiniShapePreview({ shape, color }: { shape: number[][]; color: string }) {
  return (
    <div
      className="inline-grid gap-0.5 p-1.5 rounded-lg bg-stone-950 border border-stone-800 shrink-0"
      style={{
        gridTemplateColumns: `repeat(${shape[0].length}, minmax(0, 1fr))`,
      }}
    >
      {shape.map((row, rIdx) =>
        row.map((cell, cIdx) => (
          <div
            key={`${rIdx}-${cIdx}`}
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{
              backgroundColor: cell ? color : "transparent",
              opacity: cell ? 0.9 : 0.1,
            }}
          />
        ))
      )}
    </div>
  );
}

// Helper pembuat susunan balok otomatis berdasarkan peran (Role) karakter
function generateRecommendedPieces(role: string): GridPiece[] {
  if (role === "Survival" || role === "Support") {
    return [
      {
        id: "auto-1",
        name: "Balok Inti (+)",
        row: 2,
        col: 2,
        shape: BLOCK_TEMPLATES[0].shape,
        color: BLOCK_TEMPLATES[0].color,
        stats: BLOCK_TEMPLATES[0].stats,
      },
      {
        id: "auto-2",
        name: "Balok I (Darah/HP)",
        row: 0,
        col: 0,
        shape: BLOCK_TEMPLATES[4].shape,
        color: BLOCK_TEMPLATES[4].color,
        stats: BLOCK_TEMPLATES[4].stats,
      },
      {
        id: "auto-3",
        name: "Balok I (Darah/HP)",
        row: 0,
        col: 6,
        shape: BLOCK_TEMPLATES[4].shape,
        color: BLOCK_TEMPLATES[4].color,
        stats: BLOCK_TEMPLATES[4].stats,
      },
      {
        id: "auto-4",
        name: "Balok Kotak (Perisai)",
        row: 5,
        col: 0,
        shape: BLOCK_TEMPLATES[5].shape,
        color: BLOCK_TEMPLATES[5].color,
        stats: BLOCK_TEMPLATES[5].stats,
      },
      {
        id: "auto-5",
        name: "Balok Kotak (Perisai)",
        row: 5,
        col: 5,
        shape: BLOCK_TEMPLATES[5].shape,
        color: BLOCK_TEMPLATES[5].color,
        stats: BLOCK_TEMPLATES[5].stats,
      },
    ];
  }

  // Default untuk Damage Dealer / Sub Carry (Fokus Crit & ATK)
  return [
    {
      id: "auto-1",
      name: "Balok Inti (+)",
      row: 2,
      col: 2,
      shape: BLOCK_TEMPLATES[0].shape,
      color: BLOCK_TEMPLATES[0].color,
      stats: BLOCK_TEMPLATES[0].stats,
    },
    {
      id: "auto-2",
      name: "Balok T (Kritis)",
      row: 0,
      col: 0,
      shape: BLOCK_TEMPLATES[1].shape,
      color: BLOCK_TEMPLATES[1].color,
      stats: BLOCK_TEMPLATES[1].stats,
    },
    {
      id: "auto-3",
      name: "Balok T (Kritis)",
      row: 0,
      col: 4,
      shape: BLOCK_TEMPLATES[1].shape,
      color: BLOCK_TEMPLATES[1].color,
      stats: BLOCK_TEMPLATES[1].stats,
    },
    {
      id: "auto-4",
      name: "Balok L (Serangan)",
      row: 4,
      col: 0,
      shape: BLOCK_TEMPLATES[2].shape,
      color: BLOCK_TEMPLATES[2].color,
      stats: BLOCK_TEMPLATES[2].stats,
    },
    {
      id: "auto-5",
      name: "Balok Z (Ledakan)",
      row: 5,
      col: 4,
      shape: BLOCK_TEMPLATES[3].shape,
      color: BLOCK_TEMPLATES[3].color,
      stats: BLOCK_TEMPLATES[3].stats,
    },
  ];
}

export default function ResonanceBuilder({
  characters,
  roster,
  onRosterUpdated,
}: ResonanceBuilderProps) {
  // Urutkan agar karakter yang dimiliki tampil lebih dulu
  const sortedChars = useMemo(() => {
    return [...characters].sort((a, b) => {
      const aOwned = roster.some((r) => r.character_id === a.id);
      const bOwned = roster.some((r) => r.character_id === b.id);
      if (aOwned && !bOwned) return -1;
      if (!aOwned && bOwned) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [characters, roster]);

  const [selectedCharId, setSelectedCharId] = useState<string>("lucy");
  const [mode, setMode] = useState<"quick" | "grid">("quick");

  const selectedChar =
    characters.find((c) => c.id === selectedCharId) || characters[0];
  const ownedEntry = roster.find((r) => r.character_id === selectedChar?.id);

  const [resonanceLevel, setResonanceLevel] = useState<number>(10);
  const [selectedPattern, setSelectedPattern] = useState<string>("Elucidation");
  const [pieces, setPieces] = useState<GridPiece[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BlockTemplate>(
    BLOCK_TEMPLATES[0]
  );
  const [presets, setPresets] = useState<ResonancePreset[]>([]);
  const [savedNotice, setSavedNotice] = useState<string>("");

  // Sinkronkan saat ganti karakter
  useEffect(() => {
    if (!selectedChar) return;
    const r = roster.find((x) => x.character_id === selectedChar.id);
    setResonanceLevel(r?.resonance_level ?? 10);
    setSelectedPattern(
      r?.resonance_pattern || selectedChar.best_pattern || "Elucidation"
    );
    setPieces(generateRecommendedPieces(selectedChar.role));

    fetchResonancePresets(selectedChar.id)
      .then((list) => {
        setPresets(list || []);
        if (list && list.length > 0 && list[0].grid_json) {
          try {
            const parsed = JSON.parse(list[0].grid_json);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPieces(parsed);
            }
          } catch {
            // Gunakan default jika gagal parse
          }
        }
      })
      .catch(console.error);
  }, [selectedCharId, characters.length]);

  if (!selectedChar) return null;

  // Ukuran papan berdasarkan Level Resonance
  const gridSize =
    resonanceLevel >= 10
      ? 7
      : resonanceLevel === 9
      ? 6
      : resonanceLevel >= 5
      ? 5
      : 4;

  // Hitung petak mana saja di papan 7x7 yang sedang ditempati balok
  const occupiedMap = useMemo(() => {
    const map = new Map<string, GridPiece>();
    for (const p of pieces) {
      const shape = p.shape || [[1]];
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] === 1) {
            map.set(`${p.row + r},${p.col + c}`, p);
          }
        }
      }
    }
    return map;
  }, [pieces]);

  // Hitung total bonus stat dari Pola Stat + Balok di papan
  const totalBonus = useMemo(() => {
    const patObj =
      PATTERN_OPTIONS.find((p) => p.id === selectedPattern) ||
      PATTERN_OPTIONS[0];
    const totals = { ...patObj.bonus };

    for (const p of pieces) {
      totals.atk_pct += p.stats.atk_pct || 0;
      totals.hp_pct += p.stats.hp_pct || 0;
      totals.def_pct += p.stats.def_pct || 0;
      totals.crit_rate += p.stats.crit_rate || 0;
      totals.crit_dmg += p.stats.crit_dmg || 0;
    }
    return totals;
  }, [selectedPattern, pieces]);

  // Klik kotak pada papan 7x7: jika sudah ada balok -> copot; jika kosong -> pasang balok terpilih
  const handleCellClick = (r: number, c: number) => {
    const existing = occupiedMap.get(`${r},${c}`);
    if (existing) {
      setPieces((prev) => prev.filter((p) => p.id !== existing.id));
      return;
    }

    const shape = selectedTemplate.shape;
    // Pastikan tidak keluar batas papan dan tidak menabrak balok lain
    for (let sr = 0; sr < shape.length; sr++) {
      for (let sc = 0; sc < shape[sr].length; sc++) {
        if (shape[sr][sc] === 1) {
          const targetR = r + sr;
          const targetC = c + sc;
          if (targetR >= gridSize || targetC >= gridSize) return;
          if (occupiedMap.has(`${targetR},${targetC}`)) return;
        }
      }
    }

    const newPiece: GridPiece = {
      id: `piece-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: selectedTemplate.name,
      row: r,
      col: c,
      shape: selectedTemplate.shape,
      color: selectedTemplate.color,
      stats: selectedTemplate.stats,
    };
    setPieces((prev) => [...prev, newPiece]);
  };

  // Simpan Preset ke database SQLite (dan update karakter milik pemain jika sudah dimiliki)
  const handleSaveResonance = async () => {
    await saveResonancePreset({
      character_id: selectedChar.id,
      preset_name: `Build ${selectedChar.name} (${selectedPattern})`,
      resonance_level: resonanceLevel,
      pattern: selectedPattern,
      stat_focus: selectedChar.resonance_focus,
      grid_json: JSON.stringify(pieces),
    });

    if (ownedEntry) {
      await saveRosterItem({
        ...ownedEntry,
        resonance_level: resonanceLevel,
        resonance_pattern: selectedPattern,
      });
      onRosterUpdated();
    }

    const updatedList = await fetchResonancePresets(selectedChar.id);
    setPresets(updatedList || []);
    setSavedNotice("Susunan Resonance berhasil disimpan!");
    setTimeout(() => setSavedNotice(""), 2500);
  };

  return (
    <div className="space-y-6">
      {/* BAGIAN 1: PILIH KARAKTER DENGAN GAMBAR + TEKS */}
      <section className="rounded-2xl bg-[#161311] border border-stone-800 p-4">
        <div className="text-xs font-medium text-stone-300 mb-2.5">
          1. Pilih Karakter yang Ingin Diatur Resonance-nya:
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {sortedChars.map((c) => {
            const isSelected = c.id === selectedChar.id;
            const isOwned = roster.some((r) => r.character_id === c.id);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => setSelectedCharId(c.id)}
                className={`p-2 rounded-xl border flex items-center gap-2.5 shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50"
                    : "bg-stone-900/90 border-stone-800 hover:border-stone-700"
                }`}
              >
                <img
                  src={c.image_url}
                  alt={c.name}
                  width={42}
                  height={42}
                  loading="lazy"
                  className="w-10.5 h-10.5 rounded-lg object-cover border border-amber-500/30"
                />
                <div className="text-left pr-1">
                  <div className="text-xs font-bold text-stone-100 flex items-center gap-1">
                    {c.name}
                    {isOwned && (
                      <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-300">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {c.afflatus} · {c.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* BAGIAN 2: HEADER KARAKTER & TOMBOL PILIH MODE (CEPAT vs PUZZLE) */}
      <section className="rounded-2xl bg-[#161311] border border-amber-500/30 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3.5">
            <img
              src={selectedChar.image_url}
              alt={selectedChar.name}
              width={60}
              height={60}
              className="w-15 h-15 rounded-xl object-cover border border-amber-500/40"
            />
            <div>
              <h2 className="text-lg font-bold text-amber-100">
                Resonance {selectedChar.name}
              </h2>
              <p className="text-xs text-stone-300 mt-0.5">
                Fokus Stat Terbaik:{" "}
                <strong className="text-amber-300">
                  {selectedChar.resonance_focus}
                </strong>
              </p>
            </div>
          </div>

          {/* TOMBOL GANTI MODE: PANDUAN CEPAT vs SUSUN PUZZLE */}
          <div className="flex items-center gap-2 bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setMode("quick")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mode === "quick"
                  ? "bg-amber-500 text-stone-950"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Wand2 className="w-4 h-4" />
              Mode Cepat (Pemula)
            </button>
            <button
              type="button"
              onClick={() => setMode("grid")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mode === "grid"
                  ? "bg-amber-500 text-stone-950"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Grid className="w-4 h-4" />
              Papan Puzzle {gridSize}×{gridSize}
            </button>
          </div>
        </div>

        {/* PENGATUR LEVEL RESONANCE (1 - 15) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-900/70 border border-stone-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-[220px]">
            <span className="text-xs font-medium text-stone-300 shrink-0">
              Level Resonance:{" "}
              <strong className="text-sky-300">Lv. {resonanceLevel}</strong> (Papan{" "}
              {gridSize}×{gridSize})
            </span>
            <input
              type="range"
              min={1}
              max={15}
              value={resonanceLevel}
              onChange={(e) => setResonanceLevel(Number(e.target.value))}
              className="w-full max-w-xs accent-sky-400 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setResonanceLevel(10);
              setSelectedPattern(selectedChar.best_pattern || "Elucidation");
              setPieces(generateRecommendedPieces(selectedChar.role));
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Atur ke Rekomendasi Terbaik
          </button>
        </div>

        {/* ================================================================= */}
        {/* MODE 1: PANDUAN CEPAT (PILIH POLA STAT DENGAN GAMBAR + TEKS)      */}
        {/* ================================================================= */}
        {mode === "quick" ? (
          <div className="space-y-4">
            <div className="text-xs font-medium text-stone-300">
              2. Pilih Pola Stat (*Modulasi*) — Kartu dengan tanda{" "}
              <span className="text-amber-300 font-bold">★ Terbaik</span> adalah
              yang paling pas untuk {selectedChar.name}:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PATTERN_OPTIONS.map((pat) => {
                const isSelected = selectedPattern === pat.id;
                const isBest = pat.id === selectedChar.best_pattern;

                return (
                  <button
                    type="button"
                    key={pat.id}
                    onClick={() => setSelectedPattern(pat.id)}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/50"
                        : "bg-stone-900/90 border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    <PatternEmblem id={pat.id} color={pat.color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-stone-100">
                          {pat.name}
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            Terbaik
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-300 mt-1 leading-snug">
                        {pat.shortDesc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* MODE 2: PAPAN PUZZLE INTERAKTIF (7x7 GRID + KEPINGAN BALOK)        */
          /* ================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* DAFTAR BALOK YANG BISA DIPILIH (KIRI) */}
            <div className="lg:col-span-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-300">
                  Pilih Balok Lalu Klik Kotak di Papan:
                </span>
                <button
                  type="button"
                  onClick={() => setPieces([])}
                  className="text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Kosongkan Papan
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {BLOCK_TEMPLATES.map((tpl) => {
                  const isActive = selectedTemplate.typeId === tpl.typeId;
                  return (
                    <button
                      type="button"
                      key={tpl.typeId}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        isActive
                          ? "bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/50"
                          : "bg-stone-900/90 border-stone-800 hover:border-stone-700"
                      }`}
                    >
                      <MiniShapePreview shape={tpl.shape} color={tpl.color} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-100">
                          {tpl.name}
                        </div>
                        <div className="text-[11px] text-amber-300 font-medium mt-0.5">
                          {tpl.statLabel}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PAPAN GRID PUZZLE (KANAN) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-stone-950/80 border border-stone-800 rounded-2xl p-4">
              <div className="text-xs text-stone-400 mb-3 text-center">
                Klik kotak kosong untuk menaruh{" "}
                <strong className="text-amber-300">
                  {selectedTemplate.name}
                </strong>
                , atau klik balok berwarna untuk mencopotnya.
              </div>

              <div
                className="grid gap-1.5 bg-[#12100e] p-3 rounded-2xl border border-stone-800 shadow-inner"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: gridSize }).map((_, r) =>
                  Array.from({ length: gridSize }).map((__, c) => {
                    const piece = occupiedMap.get(`${r},${c}`);
                    return (
                      <button
                        type="button"
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        title={
                          piece
                            ? `${piece.name} (Klik untuk copot)`
                            : `Baris ${r + 1}, Kolom ${c + 1} (Klik untuk pasang)`
                        }
                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg border transition-all flex items-center justify-center text-[10px] font-bold cursor-pointer"
                        style={{
                          backgroundColor: piece
                            ? `${piece.color}38`
                            : "rgba(28, 25, 23, 0.85)",
                          borderColor: piece
                            ? piece.color
                            : "rgba(68, 64, 60, 0.6)",
                          color: piece ? "#fef3c7" : "#57534e",
                        }}
                      >
                        {piece ? "◆" : "·"}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* RINGKASAN TOTAL BONUS STAT & TOMBOL SIMPAN */}
        <div className="pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-400 mr-1">Total Bonus Stat:</span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs font-bold text-amber-300">
              ATK +{totalBonus.atk_pct}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs font-bold text-rose-300">
              Crit Rate +{totalBonus.crit_rate}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs font-bold text-purple-300">
              Crit DMG +{totalBonus.crit_dmg}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs font-bold text-emerald-300">
              HP +{totalBonus.hp_pct}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs font-bold text-sky-300">
              DEF +{totalBonus.def_pct}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {savedNotice}
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveResonance}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4" />
              Simpan Susunan Resonance
            </button>
          </div>
        </div>

        {presets.length > 0 && (
          <div className="text-[11px] text-stone-400">
            Tersimpan di Database: <strong>{presets[0].preset_name}</strong> (Lv.
            {presets[0].resonance_level} · Pola {presets[0].pattern})
          </div>
        )}
      </section>
    </div>
  );
}
