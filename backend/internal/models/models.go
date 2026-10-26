package models

// Character merepresentasikan data master Arcanist di Reverse: 1999.
// Tag `json:"..."` digunakan oleh package encoding/json bawaan Go untuk
// mengubah nama field saat dikirim/diterima sebagai JSON ke Frontend React.
type Character struct {
	ID             string `json:"id"`               // Contoh: "lucy", "ulrich", "ezra-theodore"
	Name           string `json:"name"`             // Nama karakter, misal: "Lucy"
	Rarity         int    `json:"rarity"`           // Bintang karakter (2 sampai 6)
	Afflatus       string `json:"afflatus"`         // Elemen: Beast, Plant, Star, Mineral, Spirit, Intellect
	DamageType     string `json:"damage_type"`      // Tipe serangan: Reality, Mental, Genesis
	Role           string `json:"role"`             // Peran: Damage Dealer, Sub Carry, Support, Survival
	Archetype      string `json:"archetype"`        // Archetype utama: Dynamo, Bloodtithe, Lingering Glow, FUA, Ultimate, Conduit
	Tier           string `json:"tier"`             // Peringkat meta: S+, S, A, B, C
	HasEuphoria    bool   `json:"has_euphoria"`     // Apakah karakter memiliki upgrade Euphoria
	BestPsychubeID string `json:"best_psychube_id"` // Rekomendasi Psychube terbaik (Best-in-Slot)
	ResonanceFocus string `json:"resonance_focus"`  // Fokus stat Resonance, misal: "Crit Rate & Crit DMG"
	BestPattern    string `json:"best_pattern"`     // Frequency Modulation Pattern terbaik (Lv.10+), misal: "Elucidation"
	ImageURL       string `json:"image_url"`        // URL potret karakter (CDN)
	Description    string `json:"description"`      // Ringkasan mekanik dan cara pakai karakter
	BaseATK        int    `json:"base_atk"`         // Stat dasar ATK pada Insight III Lv. 60
	BaseHP         int    `json:"base_hp"`          // Stat dasar HP pada Insight III Lv. 60
	BaseRealityDEF int    `json:"base_reality_def"` // Stat dasar Reality DEF pada Insight III Lv. 60
	BaseMentalDEF  int    `json:"base_mental_def"`  // Stat dasar Mental DEF pada Insight III Lv. 60
	BaseTechnique  int    `json:"base_technique"`   // Stat Critical Technique (30 = 1% Crit Rate, 20 = 1% Crit DMG)
}

// Psychube merepresentasikan data master senjata/equipment di Reverse: 1999.
type Psychube struct {
	ID             string `json:"id"`              // Contoh: "a-tingle-of-a-thought"
	Name           string `json:"name"`            // Nama Psychube
	Rarity         int    `json:"rarity"`          // Bintang (5 atau 6)
	EngravingStat  string `json:"engraving_stat"`  // Stat sekunder Lv.60, misal: "Incantation Might +18%"
	PassiveSummary string `json:"passive_summary"` // Penjelasan efek pasif Amplification
	ArchetypeFit   string `json:"archetype_fit"`   // Cocok untuk archetype apa (misal: "Dynamo / Intellect")
	ImageURL       string `json:"image_url"`       // URL ikon Psychube
	BaseATK        int    `json:"base_atk"`        // Tambahan ATK pada Lv. 60
	BaseHP         int    `json:"base_hp"`         // Tambahan HP pada Lv. 60
	BaseDEF        int    `json:"base_def"`        // Tambahan DEF pada Lv. 60
}

// UserRoster merepresentasikan karakter yang dimiliki oleh pemain beserta progres build-nya.
type UserRoster struct {
	ID                 int    `json:"id"`                   // Primary Key (Auto Increment)
	CharacterID        string `json:"character_id"`         // Foreign Key ke tabel characters
	Insight            int    `json:"insight"`              // Insight 0, 1, 2, atau 3
	Level              int    `json:"level"`                // Level karakter (1 - 60)
	Portray            int    `json:"portray"`              // Duplikat karakter (P0 - P5)
	ResonanceLevel     int    `json:"resonance_level"`      // Level Resonance (1 - 15)
	ResonancePattern   string `json:"resonance_pattern"`    // Pattern aktif: Placidity, Elucidation, dll.
	EuphoriaUnlocked   bool   `json:"euphoria_unlocked"`    // Status apakah Euphoria sudah dibuka (I3 Lv.30+)
	EquippedPsychubeID string `json:"equipped_psychube_id"` // ID Psychube yang sedang dipasang (opsional)
	PsychubeLevel      int    `json:"psychube_level"`       // Level Psychube (1 - 60)
	PsychubeAmp        int    `json:"psychube_amp"`         // Amplification level (1 - 5)
	Notes              string `json:"notes"`                // Catatan pribadi pemain

	// Field hasil JOIN (opsional saat mengambil detail lengkap dari database)
	CharacterName string `json:"character_name,omitempty"`
	Afflatus      string `json:"afflatus,omitempty"`
	Role          string `json:"role,omitempty"`
	Archetype     string `json:"archetype,omitempty"`
	ImageURL      string `json:"image_url,omitempty"`
}

// Team merepresentasikan susunan tim (3 karakter utama + 1 karakter cadangan).
type Team struct {
	ID          int          `json:"id"`           // Primary Key
	Name        string       `json:"name"`         // Nama tim, misal: "Dynamo Core Team"
	Archetype   string       `json:"archetype"`    // Archetype tim, misal: "Dynamo"
	TargetBoss  string       `json:"target_boss"`  // Target mode/elemen, misal: "Limbo / Reveries"
	TuningSkill string       `json:"tuning_skill"` // Timekeeper Tuning: "First Melody" atau "Grand Orchestra"
	Notes       string       `json:"notes"`        // Catatan rotasi kartu
	Members     []TeamMember `json:"members"`      // Daftar 4 anggota tim
}

// TeamMember merepresentasikan 1 slot anggota di dalam sebuah Team.
type TeamMember struct {
	ID          int    `json:"id"`           // Primary Key
	TeamID      int    `json:"team_id"`      // Foreign Key ke tabel teams
	SlotNumber  int    `json:"slot_number"`  // Posisi: 1, 2, 3 (Field) atau 4 (Substitute/Assist)
	CharacterID string `json:"character_id"` // Foreign Key ke tabel characters
	PsychubeID  string `json:"psychube_id"`  // Psychube yang dipakai di tim ini
}

// ResonancePreset menyimpan template susunan puzzle Resonance (Mode Preset maupun Custom).
type ResonancePreset struct {
	ID             int    `json:"id"`              // Primary Key
	CharacterID    string `json:"character_id"`    // Foreign Key ke tabel characters
	PresetName     string `json:"preset_name"`     // Nama preset, misal: "Burst Crit Dynamo (Lv.10)"
	ResonanceLevel int    `json:"resonance_level"` // Level Resonance (1 - 15)
	Pattern        string `json:"pattern"`         // Pattern Frequency Modulation
	StatFocus      string `json:"stat_focus"`      // Ringkasan stat utama yang diincar
	GridJSON       string `json:"grid_json"`       // Data posisi kepingan Idea pada papan 7x7 dalam format JSON
}
