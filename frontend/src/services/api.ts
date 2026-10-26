import {
  Character,
  Psychube,
  RecommendationResponse,
  RecommendedSlot,
  ResonancePreset,
  Team,
  UserRoster,
} from "../types/models";
import fallbackCatalog from "./fallbackCatalog.json";

const BASE_URL = "/api";

// Kunci penyimpanan lokal (Browser LocalStorage) saat berjalan di Static Hosting (cPanel)
const LS_ROSTER_KEY = "re1999_user_roster_v1";
const LS_TEAMS_KEY = "re1999_saved_teams_v1";
const LS_PRESETS_KEY = "re1999_resonance_presets_v1";

const catalogCharacters = (fallbackCatalog.characters || []) as Character[];
const catalogPsychubes = (fallbackCatalog.psychubes || []) as Psychube[];

// Data koleksi awal (Tim Dynamo) untuk pengunjung baru di mode demo online
const defaultStarterRoster: UserRoster[] = [
  {
    id: 1,
    character_id: "lucy",
    insight: 3,
    level: 60,
    portray: 0,
    resonance_level: 10,
    resonance_pattern: "Elucidation",
    euphoria_unlocked: true,
    equipped_psychube_id: "steps-forward",
    psychube_level: 60,
    psychube_amp: 1,
    notes: "Main Carry Dynamo",
  },
  {
    id: 2,
    character_id: "ulrich",
    insight: 3,
    level: 60,
    portray: 0,
    resonance_level: 10,
    resonance_pattern: "Elucidation",
    euphoria_unlocked: false,
    equipped_psychube_id: "a-tingle-of-a-thought",
    psychube_level: 60,
    psychube_amp: 1,
    notes: "Sub Carry & Dynamo Battery",
  },
  {
    id: 3,
    character_id: "ezra-theodore",
    insight: 3,
    level: 60,
    portray: 0,
    resonance_level: 10,
    resonance_pattern: "Stupefaction",
    euphoria_unlocked: true,
    equipped_psychube_id: "that-inquisitive-dear",
    psychube_level: 60,
    psychube_amp: 1,
    notes: "Shielder & Dynamo Support",
  },
  {
    id: 4,
    character_id: "kakania",
    insight: 3,
    level: 60,
    portray: 0,
    resonance_level: 10,
    resonance_pattern: "Stupefaction",
    euphoria_unlocked: false,
    equipped_psychube_id: "balance-please",
    psychube_level: 60,
    psychube_amp: 1,
    notes: "Empathy Tank & ATK Buffer",
  },
];

function getLocalRoster(): UserRoster[] {
  try {
    const raw = localStorage.getItem(LS_ROSTER_KEY);
    if (!raw) {
      localStorage.setItem(LS_ROSTER_KEY, JSON.stringify(defaultStarterRoster));
      return defaultStarterRoster;
    }
    return JSON.parse(raw) as UserRoster[];
  } catch {
    return defaultStarterRoster;
  }
}

function setLocalRoster(list: UserRoster[]) {
  try {
    localStorage.setItem(LS_ROSTER_KEY, JSON.stringify(list));
  } catch {
    // Abaikan jika private browsing penuh
  }
}

function getLocalTeams(): Team[] {
  try {
    const raw = localStorage.getItem(LS_TEAMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Team[];
  } catch {
    return [];
  }
}

function getLocalPresets(): ResonancePreset[] {
  try {
    const raw = localStorage.getItem(LS_PRESETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ResonancePreset[];
  } catch {
    return [];
  }
}

// Helper pengecekan keunggulan elemen (Afflatus Advantage 1.3x)
function isStrongAgainst(attacker: string, enemy: string): boolean {
  switch (attacker) {
    case "Beast":
      return enemy === "Plant";
    case "Plant":
      return enemy === "Star";
    case "Star":
      return enemy === "Mineral";
    case "Mineral":
      return enemy === "Beast";
    case "Spirit":
      return enemy === "Intellect";
    case "Intellect":
      return enemy === "Spirit";
    default:
      return false;
  }
}

// Helper untuk memastikan response adalah JSON asli (bukan halaman HTML dari Apache rewrite)
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok || !contentType.includes("application/json")) {
    throw new Error("Backend API tidak aktif, beralih ke mode Hybrid LocalStorage");
  }
  return res.json();
}

// 1. Cek status server
export async function fetchHealth() {
  try {
    return await fetchJSON<{
      status: string;
      phase: string;
      characters_count: number;
      psychubes_count: number;
      roster_count: number;
    }>(`${BASE_URL}/health`);
  } catch {
    return {
      status: "ok",
      phase: "Hybrid Mode (Static Hosting + LocalStorage)",
      characters_count: catalogCharacters.length,
      psychubes_count: catalogPsychubes.length,
      roster_count: getLocalRoster().length,
    };
  }
}

// 2. Ambil semua karakter
export async function fetchCharacters(params?: {
  afflatus?: string;
  archetype?: string;
  role?: string;
}): Promise<Character[]> {
  try {
    const query = new URLSearchParams();
    if (params?.afflatus) query.set("afflatus", params.afflatus);
    if (params?.archetype) query.set("archetype", params.archetype);
    if (params?.role) query.set("role", params.role);
    const url = query.toString()
      ? `${BASE_URL}/characters?${query.toString()}`
      : `${BASE_URL}/characters`;
    return await fetchJSON<Character[]>(url);
  } catch {
    return catalogCharacters.filter((c) => {
      if (params?.afflatus && c.afflatus !== params.afflatus) return false;
      if (params?.archetype && c.archetype !== params.archetype) return false;
      if (params?.role && c.role !== params.role) return false;
      return true;
    });
  }
}

// 3. Ambil semua Psychubes
export async function fetchPsychubes(): Promise<Psychube[]> {
  try {
    return await fetchJSON<Psychube[]>(`${BASE_URL}/psychubes`);
  } catch {
    return catalogPsychubes;
  }
}

// 4. Ambil koleksi karakter milik pemain (User Roster)
export async function fetchRoster(): Promise<UserRoster[]> {
  try {
    return await fetchJSON<UserRoster[]>(`${BASE_URL}/roster`);
  } catch {
    return getLocalRoster();
  }
}

// 5. Simpan atau perbarui karakter di koleksi pemain
export async function saveRosterItem(item: UserRoster): Promise<void> {
  try {
    await fetchJSON(`${BASE_URL}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch {
    const current = getLocalRoster();
    const idx = current.findIndex((r) => r.character_id === item.character_id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...item };
    } else {
      current.push({ ...item, id: Date.now() });
    }
    setLocalRoster(current);
  }
}

// 6. Hapus karakter dari koleksi pemain
export async function deleteRosterItem(characterId: string): Promise<void> {
  try {
    await fetchJSON(`${BASE_URL}/roster/${characterId}`, {
      method: "DELETE",
    });
  } catch {
    const next = getLocalRoster().filter((r) => r.character_id !== characterId);
    setLocalRoster(next);
  }
}

// 7. Ambil rekomendasi tim pintar
export async function fetchTeamRecommendation(params: {
  archetype: string;
  enemy_afflatus: string;
  only_owned: boolean;
}): Promise<RecommendationResponse> {
  try {
    const query = new URLSearchParams({
      archetype: params.archetype,
      enemy_afflatus: params.enemy_afflatus,
      only_owned: String(params.only_owned),
    });
    return await fetchJSON<RecommendationResponse>(
      `${BASE_URL}/recommendations?${query.toString()}`
    );
  } catch {
    const roster = getLocalRoster();
    let pool = params.only_owned
      ? catalogCharacters.filter((c) =>
          roster.some((r) => r.character_id === c.id)
        )
      : [...catalogCharacters];
    if (pool.length < 4) {
      pool = [...catalogCharacters];
    }

    const used = new Set<string>();
    const pickBest = (targetRole: string): Character => {
      let best = pool[0];
      let bestScore = -9999;
      for (const c of pool) {
        if (used.has(c.id)) continue;
        let score = 0;
        if (params.archetype && c.archetype === params.archetype) score += 50;
        if (c.role === targetRole) score += 35;
        if (isStrongAgainst(c.afflatus, params.enemy_afflatus)) score += 25;
        if (c.tier === "S+") score += 15;
        else if (c.tier === "S") score += 10;
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      used.add(best.id);
      return best;
    };

    const roles = [
      { num: 1, role: "Damage Dealer", label: "Main Carry (DPS Utama)" },
      { num: 2, role: "Sub Carry", label: "Sub Carry / Enabler" },
      { num: 3, role: "Survival", label: "Sustain (Healer / Shielder)" },
      { num: 4, role: "Support", label: "Support / Amplifier (Slot 4)" },
    ];

    const recommended: RecommendedSlot[] = roles.map((slot) => {
      const ch = pickBest(slot.role);
      const adv = isStrongAgainst(ch.afflatus, params.enemy_afflatus);
      return {
        slot_number: slot.num,
        slot_label: slot.label,
        character: ch,
        recommended_psychube_id: ch.best_psychube_id,
        afflatus_advantage: adv,
        reason: adv
          ? `Sinergi ${ch.archetype} + Unggul Elemen 1.3x vs ${params.enemy_afflatus}`
          : `Sinergi ${ch.archetype} (${ch.role})`,
      };
    });

    return {
      archetype: params.archetype,
      enemy_afflatus: params.enemy_afflatus,
      only_owned: params.only_owned,
      total_pool: pool.length,
      recommended,
    };
  }
}

// 8. Ambil daftar tim yang disimpan
export async function fetchTeams(): Promise<Team[]> {
  try {
    return await fetchJSON<Team[]>(`${BASE_URL}/teams`);
  } catch {
    return getLocalTeams();
  }
}

// 9. Simpan tim baru
export async function createTeam(team: Team): Promise<void> {
  try {
    await fetchJSON(`${BASE_URL}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(team),
    });
  } catch {
    const list = getLocalTeams();
    list.unshift({ ...team, id: Date.now() });
    localStorage.setItem(LS_TEAMS_KEY, JSON.stringify(list));
  }
}

// 10. Hapus tim
export async function deleteTeam(id: number): Promise<void> {
  try {
    await fetchJSON(`${BASE_URL}/teams/${id}`, {
      method: "DELETE",
    });
  } catch {
    const list = getLocalTeams().filter((t) => t.id !== id);
    localStorage.setItem(LS_TEAMS_KEY, JSON.stringify(list));
  }
}

// 11. Ambil preset Resonance
export async function fetchResonancePresets(
  characterId?: string
): Promise<ResonancePreset[]> {
  try {
    const url = characterId
      ? `${BASE_URL}/resonance-presets?character_id=${encodeURIComponent(
          characterId
        )}`
      : `${BASE_URL}/resonance-presets`;
    return await fetchJSON<ResonancePreset[]>(url);
  } catch {
    const all = getLocalPresets();
    return characterId
      ? all.filter((p) => p.character_id === characterId)
      : all;
  }
}

// 12. Simpan preset Resonance baru
export async function saveResonancePreset(
  preset: ResonancePreset
): Promise<void> {
  try {
    await fetchJSON(`${BASE_URL}/resonance-presets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preset),
    });
  } catch {
    const all = getLocalPresets().filter(
      (p) => p.character_id !== preset.character_id
    );
    all.unshift({ ...preset, id: Date.now() });
    localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(all));
  }
}
