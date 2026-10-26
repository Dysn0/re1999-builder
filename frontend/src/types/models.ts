// File ini berisi kontrak tipe data TypeScript (Interface) yang persis mencerminkan
// struct Go di backend/internal/models/models.go.
// Dengan TypeScript, jika kita salah mengetik nama property (misal "c.afflatuss"),
// editor akan langsung memberi peringatan sebelum kode dijalankan.

export interface Character {
  id: string;
  name: string;
  rarity: number;
  afflatus: "Beast" | "Plant" | "Star" | "Mineral" | "Spirit" | "Intellect" | string;
  damage_type: "Reality" | "Mental" | "Genesis" | string;
  role: "Damage Dealer" | "Sub Carry" | "Support" | "Survival" | string;
  archetype: string;
  tier: string;
  has_euphoria: boolean;
  best_psychube_id: string;
  resonance_focus: string;
  best_pattern: string;
  image_url: string;
  description: string;
  base_atk: number;
  base_hp: number;
  base_reality_def: number;
  base_mental_def: number;
  base_technique: number;
}

export interface Psychube {
  id: string;
  name: string;
  rarity: number;
  engraving_stat: string;
  passive_summary: string;
  archetype_fit: string;
  image_url: string;
  base_atk: number;
  base_hp: number;
  base_def: number;
}

export interface UserRoster {
  id?: number;
  character_id: string;
  insight: number;
  level: number;
  portray: number;
  resonance_level: number;
  resonance_pattern: string;
  euphoria_unlocked: boolean;
  equipped_psychube_id: string;
  psychube_level: number;
  psychube_amp: number;
  notes: string;
  // Data hasil INNER JOIN dari tabel characters
  character_name?: string;
  afflatus?: string;
  role?: string;
  archetype?: string;
  image_url?: string;
}

export interface TeamMember {
  id?: number;
  team_id?: number;
  slot_number: number;
  character_id: string;
  psychube_id: string;
}

export interface Team {
  id?: number;
  name: string;
  archetype: string;
  target_boss: string;
  tuning_skill: string;
  notes: string;
  members: TeamMember[];
}

export interface RecommendedSlot {
  slot_number: number;
  slot_label: string;
  character: Character;
  recommended_psychube_id: string;
  afflatus_advantage: boolean;
  reason: string;
}

export interface RecommendationResponse {
  archetype: string;
  enemy_afflatus: string;
  only_owned: boolean;
  total_pool: number;
  recommended: RecommendedSlot[];
}

export interface GridPiece {
  id: string;
  name: string;
  row: number;
  col: number;
  shape?: number[][]; // Matriks 2D bentuk kepingan (opsional untuk kanvas)
  color: string;
  stats: {
    atk_pct?: number;
    hp_pct?: number;
    def_pct?: number;
    crit_rate?: number;
    crit_dmg?: number;
  };
}

export interface ResonancePreset {
  id?: number;
  character_id: string;
  preset_name: string;
  resonance_level: number;
  pattern: string;
  stat_focus: string;
  grid_json: string;
}
