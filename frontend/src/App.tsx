import { useEffect, useState } from "react";
import { Check, Layers, Plus, Search, Sparkles, Users } from "lucide-react";
import { Character, Psychube, UserRoster } from "./types/models";
import {
  fetchCharacters,
  fetchPsychubes,
  fetchRoster,
} from "./services/api";
import RosterEditorModal from "./components/RosterEditorModal";
import SmartTeamBuilder from "./components/SmartTeamBuilder";
import ResonanceBuilder from "./components/ResonanceBuilder";

type ActiveTab = "roster" | "teambuilder" | "resonance";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("roster");

  const [characters, setCharacters] = useState<Character[]>([]);
  const [psychubes, setPsychubes] = useState<Psychube[]>([]);
  const [roster, setRoster] = useState<UserRoster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedArchetype, setSelectedArchetype] = useState<string>("");
  const [selectedAfflatus, setSelectedAfflatus] = useState<string>("");
  const [onlyOwnedFilter, setOnlyOwnedFilter] = useState<boolean>(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);

  const loadAllData = async () => {
    try {
      setError(null);
      const [charsData, cubesData, rosterData] = await Promise.all([
        fetchCharacters(),
        fetchPsychubes(),
        fetchRoster(),
      ]);
      setCharacters(charsData);
      setPsychubes(cubesData);
      setRoster(rosterData);
    } catch {
      setError(
        "Pastikan server Backend Go sedang berjalan di terminal (go run ./cmd/server)."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const getOwnedData = (charId: string): UserRoster | undefined =>
    roster.find((r) => r.character_id === charId);

  const filteredCharacters = characters.filter((c) => {
    if (
      searchQuery.trim() &&
      !c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    if (selectedArchetype && c.archetype !== selectedArchetype) return false;
    if (selectedAfflatus && c.afflatus !== selectedAfflatus) return false;
    if (onlyOwnedFilter && !getOwnedData(c.id)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0d0b0a] text-[#f3ede2]">
      {/* HEADER BERSIH & RINGKAS */}
      <header className="border-b border-stone-800 bg-[#14110f]/95 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-amber-100">
                Reverse: 1999 Builder
              </h1>
              <p className="text-[11px] text-stone-400">
                Koleksi Saya:{" "}
                <strong className="text-emerald-400">{roster.length}</strong> /{" "}
                {characters.length} Karakter
              </p>
            </div>
          </div>

          <nav
            role="tablist"
            aria-label="Menu Utama"
            className="flex items-center gap-1.5"
          >
            <button
              role="tab"
              aria-selected={activeTab === "roster"}
              onClick={() => setActiveTab("roster")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "roster"
                  ? "bg-amber-500 text-stone-950"
                  : "bg-stone-900 text-stone-300 hover:bg-stone-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Karakter ({roster.length}/{characters.length})
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "teambuilder"}
              onClick={() => setActiveTab("teambuilder")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "teambuilder"
                  ? "bg-amber-500 text-stone-950"
                  : "bg-stone-900 text-stone-300 hover:bg-stone-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Susun Tim
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "resonance"}
              onClick={() => setActiveTab("resonance")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "resonance"
                  ? "bg-amber-500 text-stone-950"
                  : "bg-stone-900 text-stone-300 hover:bg-stone-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Resonance
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-stone-400">
            Memuat data...
          </div>
        ) : activeTab === "roster" ? (
          <>
            {/* BAR PENCARIAN & FILTER RINGKAS */}
            <div className="mb-5 space-y-3 bg-[#14110f] border border-stone-800/90 rounded-2xl p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* KOTAK CARI NAMA KARAKTER */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama karakter (contoh: Lucy, 6, Tooth Fairy)..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder:text-stone-500"
                  />
                </div>

                {/* FILTER ELEMEN (AFFLATUS) */}
                <select
                  value={selectedAfflatus}
                  onChange={(e) => setSelectedAfflatus(e.target.value)}
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 cursor-pointer"
                >
                  <option value="">Semua Elemen</option>
                  <option value="Intellect">Intellect</option>
                  <option value="Spirit">Spirit</option>
                  <option value="Star">Star</option>
                  <option value="Plant">Plant</option>
                  <option value="Mineral">Mineral</option>
                  <option value="Beast">Beast</option>
                </select>

                {/* TOMBOL HANYA MILIK SAYA */}
                <button
                  type="button"
                  onClick={() => setOnlyOwnedFilter(!onlyOwnedFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    onlyOwnedFilter
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-stone-900 border-stone-700 text-stone-300"
                  }`}
                >
                  {onlyOwnedFilter
                    ? "✓ Menampilkan Milik Saya"
                    : "Tampilkan Milik Saya Saja"}
                </button>
              </div>

              {/* FILTER GAYA BERTARUNG (ARCHETYPE) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: "Semua Gaya", val: "" },
                  { label: "⚡ Dynamo", val: "Dynamo" },
                  { label: "🩸 Bloodtithe", val: "Bloodtithe" },
                  { label: "🗡️ Follow-Up", val: "Follow-Up" },
                  { label: "🔥 Lingering Glow", val: "Lingering Glow" },
                  { label: "🌟 Ultimate", val: "Ultimate" },
                  { label: "🔮 Conduit", val: "Conduit" },
                  { label: "🛡️ General", val: "General" },
                ].map((item) => (
                  <button
                    key={item.val || "all"}
                    onClick={() => setSelectedArchetype(item.val)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedArchetype === item.val
                        ? "bg-amber-500 text-stone-950 font-bold"
                        : "bg-stone-900/90 text-stone-300 border border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GRID KARTU: HANYA GAMBAR + PENJELASAN SINGKAT + TOMBOL MILIKI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredCharacters.map((char) => {
                const owned = getOwnedData(char.id);

                return (
                  <div
                    key={char.id}
                    className={`rounded-xl p-4 border transition flex flex-col justify-between ${
                      owned
                        ? "bg-[#1c1713] border-amber-500/60 shadow-md"
                        : "bg-[#13110f] border-stone-800/80 hover:border-stone-700"
                    }`}
                  >
                    {/* GAMBAR & PENJELASAN SINGKAT */}
                    <div>
                      <div className="flex items-center gap-3.5">
                        <img
                          src={char.image_url}
                          alt={char.name}
                          loading="lazy"
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-xl object-cover bg-stone-900 border border-amber-500/30 shrink-0"
                        />

                        <div className="min-w-0">
                          <h2 className="font-bold text-base text-amber-100 truncate">
                            {char.name}
                          </h2>
                          <div className="text-xs text-stone-400 mt-0.5">
                            {char.rarity}★ {char.afflatus} · {char.role}
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-stone-800/90 text-[11px] text-amber-300 font-medium">
                            {char.archetype}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-stone-300 leading-relaxed line-clamp-3">
                        {char.description}
                      </p>
                    </div>

                    {/* KLIK TOMBOL INI -> MEMBUKA POP-UP UNTUK MEMASUKKAN BUILD */}
                    <button
                      type="button"
                      onClick={() => setEditingChar(char)}
                      className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        owned
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                          : "bg-amber-500 hover:bg-amber-400 text-stone-950"
                      }`}
                    >
                      {owned ? (
                        <>
                          <Check className="w-4 h-4" />
                          Dimiliki (I{owned.insight} Lv.{owned.level} · R
                          {owned.resonance_level} · P{owned.portray})
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Miliki &amp; Masukkan Build
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : activeTab === "teambuilder" ? (
          <SmartTeamBuilder
            characters={characters}
            psychubes={psychubes}
            roster={roster}
          />
        ) : (
          <ResonanceBuilder
            characters={characters}
            roster={roster}
            onRosterUpdated={loadAllData}
          />
        )}
      </main>

      {/* FOOTER KREDIT SELARAS DENGAN DYSNOPIA.COM */}
      <footer className="border-t border-stone-800/80 mt-10 py-6 text-center text-xs text-stone-400 space-y-1">
        <p className="text-stone-300 font-medium">
          © {new Date().getFullYear()} Affan Abdurrahman · Reverse: 1999 Builder
        </p>
        <p className="text-stone-500">
          Designed and developed with the assistance of AI.
        </p>
      </footer>

      {/* POP-UP INPUT BUILD SAAT TOMBOL MILIKI / DIMILIKI DIKLIK */}
      {editingChar && (
        <RosterEditorModal
          character={editingChar}
          existingRoster={getOwnedData(editingChar.id)}
          psychubes={psychubes}
          onClose={() => setEditingChar(null)}
          onSaved={loadAllData}
        />
      )}
    </div>
  );
}
