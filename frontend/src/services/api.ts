import {
  Character,
  Psychube,
  RecommendationResponse,
  ResonancePreset,
  Team,
  UserRoster,
} from "../types/models";

// Karena kita sudah mengatur proxy "/api" -> "http://localhost:8080/api" di vite.config.ts,
// kita cukup memanggil "/api/..." dari kode React.
const BASE_URL = "/api";

// 1. Cek status server Backend Go & SQLite
export async function fetchHealth(): Promise<{
  status: string;
  phase: string;
  characters_count: number;
  psychubes_count: number;
  roster_count: number;
}> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error("Gagal menghubungi server Backend Go");
  return res.json();
}

// 2. Ambil semua karakter (dengan filter opsional)
export async function fetchCharacters(params?: {
  afflatus?: string;
  archetype?: string;
  role?: string;
}): Promise<Character[]> {
  const query = new URLSearchParams();
  if (params?.afflatus) query.set("afflatus", params.afflatus);
  if (params?.archetype) query.set("archetype", params.archetype);
  if (params?.role) query.set("role", params.role);

  const url = query.toString()
    ? `${BASE_URL}/characters?${query.toString()}`
    : `${BASE_URL}/characters`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal mengambil daftar karakter");
  return res.json();
}

// 3. Ambil semua Psychubes
export async function fetchPsychubes(): Promise<Psychube[]> {
  const res = await fetch(`${BASE_URL}/psychubes`);
  if (!res.ok) throw new Error("Gagal mengambil daftar Psychube");
  return res.json();
}

// 4. Ambil koleksi karakter milik pemain (User Roster)
export async function fetchRoster(): Promise<UserRoster[]> {
  const res = await fetch(`${BASE_URL}/roster`);
  if (!res.ok) throw new Error("Gagal mengambil koleksi roster");
  return res.json();
}

// 5. Simpan atau perbarui karakter di koleksi pemain (POST /api/roster)
export async function saveRosterItem(item: UserRoster): Promise<void> {
  const res = await fetch(`${BASE_URL}/roster`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gagal menyimpan karakter ke roster");
  }
}

// 6. Hapus karakter dari koleksi pemain (DELETE /api/roster/{character_id})
export async function deleteRosterItem(characterId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/roster/${characterId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Gagal menghapus karakter dari roster");
}

// 7. Ambil rekomendasi tim pintar dari Backend Go
export async function fetchTeamRecommendation(params: {
  archetype: string;
  enemy_afflatus: string;
  only_owned: boolean;
}): Promise<RecommendationResponse> {
  const query = new URLSearchParams({
    archetype: params.archetype,
    enemy_afflatus: params.enemy_afflatus,
    only_owned: String(params.only_owned),
  });
  const res = await fetch(`${BASE_URL}/recommendations?${query.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil rekomendasi tim");
  return res.json();
}

// 8. Ambil daftar tim yang disimpan
export async function fetchTeams(): Promise<Team[]> {
  const res = await fetch(`${BASE_URL}/teams`);
  if (!res.ok) throw new Error("Gagal mengambil daftar tim");
  return res.json();
}

// 9. Simpan tim baru
export async function createTeam(team: Team): Promise<void> {
  const res = await fetch(`${BASE_URL}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(team),
  });
  if (!res.ok) throw new Error("Gagal menyimpan tim");
}

// 10. Hapus tim
export async function deleteTeam(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/teams/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Gagal menghapus tim");
}

// 11. Ambil preset Resonance
export async function fetchResonancePresets(characterId?: string): Promise<ResonancePreset[]> {
  const url = characterId
    ? `${BASE_URL}/resonance-presets?character_id=${encodeURIComponent(characterId)}`
    : `${BASE_URL}/resonance-presets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal mengambil preset Resonance");
  return res.json();
}

// 12. Simpan preset Resonance baru
export async function saveResonancePreset(preset: ResonancePreset): Promise<void> {
  const res = await fetch(`${BASE_URL}/resonance-presets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preset),
  });
  if (!res.ok) throw new Error("Gagal menyimpan preset Resonance");
}
