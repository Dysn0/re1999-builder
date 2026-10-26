import React, { useEffect, useState } from "react";
import {
  BookmarkPlus,
  CheckCircle2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  Character,
  Psychube,
  RecommendedSlot,
  Team,
  TeamMember,
  UserRoster,
} from "../types/models";
import {
  createTeam,
  deleteTeam,
  fetchTeamRecommendation,
  fetchTeams,
} from "../services/api";

interface SmartTeamBuilderProps {
  characters: Character[];
  psychubes: Psychube[];
  roster: UserRoster[];
}

interface EnemyAfflatusOption {
  id: string;
  label: string;
  weaknessText: string;
  bgClass: string;
  activeClass: string;
  strokeColor: string;
}

const ENEMY_AFFLATUS_OPTIONS: EnemyAfflatusOption[] = [
  {
    id: "",
    label: "Bebas / Umum",
    weaknessText: "Semua Lawan",
    bgClass: "bg-stone-800/80 border-stone-700",
    activeClass: "bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50",
    strokeColor: "#f59e0b",
  },
  {
    id: "Beast",
    label: "Lawan Beast",
    weaknessText: "Lemah vs Mineral",
    bgClass: "bg-rose-950/40 border-rose-800/50",
    activeClass: "bg-rose-500/20 border-rose-400 ring-1 ring-rose-400/50",
    strokeColor: "#fb7185",
  },
  {
    id: "Plant",
    label: "Lawan Plant",
    weaknessText: "Lemah vs Beast",
    bgClass: "bg-emerald-950/40 border-emerald-800/50",
    activeClass: "bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400/50",
    strokeColor: "#34d399",
  },
  {
    id: "Star",
    label: "Lawan Star",
    weaknessText: "Lemah vs Plant",
    bgClass: "bg-sky-950/40 border-sky-800/50",
    activeClass: "bg-sky-500/20 border-sky-400 ring-1 ring-sky-400/50",
    strokeColor: "#38bdf8",
  },
  {
    id: "Mineral",
    label: "Lawan Mineral",
    weaknessText: "Lemah vs Star",
    bgClass: "bg-amber-950/40 border-amber-800/50",
    activeClass: "bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50",
    strokeColor: "#fbbf24",
  },
  {
    id: "Spirit",
    label: "Lawan Spirit",
    weaknessText: "Lemah vs Intellect",
    bgClass: "bg-purple-950/40 border-purple-800/50",
    activeClass: "bg-purple-500/20 border-purple-400 ring-1 ring-purple-400/50",
    strokeColor: "#c084fc",
  },
  {
    id: "Intellect",
    label: "Lawan Intellect",
    weaknessText: "Lemah vs Spirit",
    bgClass: "bg-yellow-950/40 border-yellow-700/50",
    activeClass: "bg-yellow-500/20 border-yellow-300 ring-1 ring-yellow-300/50",
    strokeColor: "#fde047",
  },
];

/**
 * Komponen Gambar/Ikon Lambang Elemen (Afflatus) Lawan
 */
function AfflatusIcon({ id, color }: { id: string; color: string }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-stone-950/90 border border-stone-800 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" className="w-6 h-6" fill="none">
        {id === "" && (
          <>
            <circle cx="18" cy="18" r="12" stroke={color} strokeWidth="1.8" strokeDasharray="3 3" />
            <circle cx="18" cy="18" r="4" fill={color} />
          </>
        )}
        {id === "Beast" && (
          <>
            {/* Lambang Cakar / Tanduk Beast */}
            <path
              d="M9 26 C11 16, 15 10, 18 6 C21 10, 25 16, 27 26 L22 22 L18 28 L14 22 Z"
              stroke={color}
              strokeWidth="1.8"
              fill="rgba(251,113,133,0.2)"
            />
          </>
        )}
        {id === "Plant" && (
          <>
            {/* Lambang Daun / Tunas Plant */}
            <path
              d="M18 6 C26 10, 28 20, 18 30 C8 20, 10 10, 18 6 Z"
              stroke={color}
              strokeWidth="1.8"
              fill="rgba(52,211,153,0.2)"
            />
            <path d="M18 10 L18 28" stroke={color} strokeWidth="1.5" />
          </>
        )}
        {id === "Star" && (
          <>
            {/* Lambang Bintang 4 Sudut Kosmik Star */}
            <path
              d="M18 4 L22 14 L32 18 L22 22 L18 32 L14 22 L4 18 L14 14 Z"
              stroke={color}
              strokeWidth="1.8"
              fill="rgba(56,189,248,0.2)"
            />
          </>
        )}
        {id === "Mineral" && (
          <>
            {/* Lambang Kristal Permata Mineral */}
            <polygon
              points="18,4 29,13 25,29 11,29 7,13"
              stroke={color}
              strokeWidth="1.8"
              fill="rgba(251,191,36,0.2)"
            />
            <polygon points="18,9 24,15 18,25 12,15" stroke={color} strokeWidth="1.2" />
          </>
        )}
        {id === "Spirit" && (
          <>
            {/* Lambang Api Roh / Bulan Sabit Spirit */}
            <path
              d="M21 6 C13 8, 9 16, 13 24 C17 30, 25 29, 28 23 C22 25, 17 20, 18 13 C19 10, 20 8, 21 6 Z"
              stroke={color}
              strokeWidth="1.8"
              fill="rgba(192,132,252,0.22)"
            />
            <circle cx="23" cy="14" r="2.5" fill={color} />
          </>
        )}
        {id === "Intellect" && (
          <>
            {/* Lambang Prisma / Mata Pengetahuan Intellect */}
            <polygon
              points="18,5 31,27 5,27"
              stroke={color}
              strokeWidth="1.8"
              fill="rgba(253,224,71,0.18)"
            />
            <circle cx="18" cy="19" r="3.5" fill={color} />
          </>
        )}
      </svg>
    </div>
  );
}

export default function SmartTeamBuilder({
  characters,
  psychubes,
  roster,
}: SmartTeamBuilderProps) {
  const [targetArchetype, setTargetArchetype] = useState<string>("Dynamo");
  const [enemyAfflatus, setEnemyAfflatus] = useState<string>("");
  const [onlyOwned, setOnlyOwned] = useState<boolean>(true);

  const [recommendations, setRecommendations] = useState<RecommendedSlot[]>([]);
  const [teamName, setTeamName] = useState<string>("Tim Dynamo Utama");
  const [slots, setSlots] = useState<TeamMember[]>([
    { slot_number: 1, character_id: "lucy", psychube_id: "steps-forward" },
    { slot_number: 2, character_id: "ulrich", psychube_id: "a-tingle-of-a-thought" },
    { slot_number: 3, character_id: "ezra-theodore", psychube_id: "that-inquisitive-dear" },
    { slot_number: 4, character_id: "kakania", psychube_id: "balance-please" },
  ]);

  const [savedTeams, setSavedTeams] = useState<Team[]>([]);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    fetchTeamRecommendation({
      archetype: targetArchetype,
      enemy_afflatus: enemyAfflatus,
      only_owned: onlyOwned,
    })
      .then((res) => setRecommendations(res.recommended || []))
      .catch(console.error);
  }, [targetArchetype, enemyAfflatus, onlyOwned, roster.length]);

  const loadTeams = () => {
    fetchTeams().then(setSavedTeams).catch(console.error);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const applyRecommendation = () => {
    if (recommendations.length === 0) return;
    setSlots(
      [1, 2, 3, 4].map((num) => {
        const rec = recommendations.find((r) => r.slot_number === num);
        return {
          slot_number: num,
          character_id: rec?.character.id || "",
          psychube_id: rec?.recommended_psychube_id || "",
        };
      })
    );
    setTeamName(`Tim ${targetArchetype || "Utama"}`);
  };

  const updateSlotChar = (slotNum: number, charId: string) => {
    const cObj = characters.find((c) => c.id === charId);
    const rObj = roster.find((r) => r.character_id === charId);
    const autoCube = rObj?.equipped_psychube_id || cObj?.best_psychube_id || "";
    setSlots((prev) =>
      prev.map((s) =>
        s.slot_number === slotNum
          ? { ...s, character_id: charId, psychube_id: autoCube }
          : s
      )
    );
  };

  const updateSlotCube = (slotNum: number, cubeId: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.slot_number === slotNum ? { ...s, psychube_id: cubeId } : s))
    );
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTeam({
      name: teamName || "Tim Baru",
      archetype: targetArchetype || "General",
      target_boss: enemyAfflatus ? `Vs ${enemyAfflatus}` : "Umum",
      tuning_skill: "First Melody",
      notes: "",
      members: slots,
    });
    setSavedNotice(true);
    loadTeams();
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const slotLabels = [
    "1. DPS Utama",
    "2. Pendukung / Sub-DPS",
    "3. Healer / Shield",
    "4. Cadangan / Support",
  ];

  return (
    <div className="space-y-6">
      {/* KOTAK 1: SARAN TIM OTOMATIS (RINGKAS & VISUAL) */}
      <section className="rounded-2xl bg-[#161311] border border-amber-500/30 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-amber-100">
              Rekomendasi Tim Otomatis
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={targetArchetype}
              onChange={(e) => setTargetArchetype(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-semibold"
            >
              <option value="Dynamo">Gaya Tim: ⚡ Dynamo</option>
              <option value="Bloodtithe">Gaya Tim: 🩸 Bloodtithe</option>
              <option value="Follow-Up">Gaya Tim: 🗡️ Follow-Up</option>
              <option value="Lingering Glow">Gaya Tim: 🔥 Lingering Glow</option>
              <option value="Ultimate">Gaya Tim: 🌟 Ultimate</option>
              <option value="Conduit">Gaya Tim: 🔮 Conduit</option>
              <option value="">Semua Karakter Terbaik</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-stone-300 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyOwned}
                onChange={(e) => setOnlyOwned(e.target.checked)}
                className="accent-amber-500"
              />
              Hanya Milik Saya
            </label>

            <button
              type="button"
              onClick={applyRecommendation}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Pakai Tim Ini
            </button>
          </div>
        </div>

        {/* PILIHAN ELEMEN LAWAN DENGAN GAMBAR LAMBANG + TEKS */}
        <div>
          <div className="text-xs font-medium text-stone-300 mb-2">
            Pilih Elemen Lawan (Otomatis Memilih Karakter yang Unggul Elemen):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {ENEMY_AFFLATUS_OPTIONS.map((opt) => {
              const isSelected = enemyAfflatus === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id || "any"}
                  onClick={() => setEnemyAfflatus(opt.id)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? opt.activeClass
                      : `${opt.bgClass} hover:border-stone-600`
                  }`}
                >
                  <AfflatusIcon id={opt.id} color={opt.strokeColor} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-100 truncate">
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-stone-400 truncate mt-0.5">
                      {opt.weaknessText}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* HASIL 4 KARAKTER YANG DIREKOMENDASIKAN */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {recommendations.map((rec) => (
            <div
              key={rec.slot_number}
              className="rounded-xl bg-stone-900/90 border border-stone-800 p-3 flex items-center gap-3"
            >
              <img
                src={rec.character.image_url}
                alt={rec.character.name}
                width={52}
                height={52}
                className="w-13 h-13 rounded-xl object-cover border border-amber-500/40 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[11px] text-amber-400 font-semibold">
                  {slotLabels[rec.slot_number - 1]}
                </div>
                <div className="font-bold text-sm text-stone-100 truncate">
                  {rec.character.name}
                </div>
                <div className="text-[11px] text-stone-400 truncate">
                  {psychubes.find((p) => p.id === rec.recommended_psychube_id)?.name}
                </div>
                {rec.afflatus_advantage && (
                  <span className="inline-block mt-0.5 text-[10px] px-1.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                    Unggul Elemen 1.3×
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KOTAK 2: SUSUN 4 ANGGOTA TIM */}
      <section className="rounded-2xl bg-[#161311] border border-stone-800 p-5">
        <form onSubmit={handleSaveTeam} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-base text-amber-100">
              Formasi Tim Aktif (4 Slot)
            </h2>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nama Tim..."
                className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4" />
                Simpan Tim
              </button>
            </div>
          </div>

          {savedNotice && (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Tim berhasil disimpan!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {slots.map((slot, idx) => {
              const charObj = characters.find((c) => c.id === slot.character_id);
              return (
                <div
                  key={slot.slot_number}
                  className="rounded-xl bg-stone-900/90 border border-stone-800 p-3.5 space-y-2.5"
                >
                  <div className="text-xs font-bold text-amber-300">
                    {slotLabels[idx]}
                  </div>

                  {charObj && (
                    <div className="flex items-center gap-2.5">
                      <img
                        src={charObj.image_url}
                        alt={charObj.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover border border-amber-500/40"
                      />
                      <div className="text-xs min-w-0">
                        <div className="font-bold text-stone-100 truncate">
                          {charObj.name}
                        </div>
                        <div className="text-stone-400">
                          {charObj.afflatus} · {charObj.archetype}
                        </div>
                      </div>
                    </div>
                  )}

                  <select
                    value={slot.character_id}
                    onChange={(e) => updateSlotChar(slot.slot_number, e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-100"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {roster.some((r) => r.character_id === c.id) ? "✓ " : ""}
                        {c.name} ({c.archetype})
                      </option>
                    ))}
                  </select>

                  <select
                    value={slot.psychube_id}
                    onChange={(e) => updateSlotCube(slot.slot_number, e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300"
                  >
                    {psychubes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {charObj?.best_psychube_id === p.id ? " ★ BiS" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </form>
      </section>

      {/* KOTAK 3: TIM YANG SUDAH DISIMPAN */}
      {savedTeams.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-stone-300">
            Tim Tersimpan ({savedTeams.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {savedTeams.map((t) => (
              <div
                key={t.id}
                className="rounded-xl bg-[#161311] border border-stone-800 p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-amber-200 truncate">
                    {t.name}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {t.members.map((m) => {
                      const c = characters.find((x) => x.id === m.character_id);
                      return c ? (
                        <img
                          key={m.slot_number}
                          src={c.image_url}
                          alt={c.name}
                          title={c.name}
                          width={38}
                          height={38}
                          className="w-9.5 h-9.5 rounded-lg object-cover border border-amber-500/40"
                        />
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTeamName(t.name);
                      setSlots(t.members);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-medium cursor-pointer"
                  >
                    Pakai
                  </button>
                  <button
                    type="button"
                    onClick={() => t.id && deleteTeam(t.id).then(loadTeams)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 cursor-pointer"
                    aria-label="Hapus Tim"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
