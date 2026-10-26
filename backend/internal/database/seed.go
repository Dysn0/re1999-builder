package database

import (
	"database/sql"
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"

	"re1999-backend/internal/models"
)

// Menggunakan fitur //go:embed bawaan Go untuk menyematkan file JSON berisi
// seluruh 129 Karakter & daftar Psychube langsung ke dalam file binary program!
//
//go:embed seed_data/characters.json
var embeddedCharactersJSON []byte

//go:embed seed_data/psychubes.json
var embeddedPsychubesJSON []byte

type rawCatalogCharacter struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Tier        string `json:"tier"`
	Rarity      int    `json:"rarity"`
	Afflatus    string `json:"afflatus"`
	RoleTags    string `json:"role_tags"`
	ImageURL    string `json:"image_url"`
	Description string `json:"description"`
}

type rawCatalogPsychube struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Rarity   int    `json:"rarity"`
	Passive  string `json:"passive"`
	ImageURL string `json:"image_url"`
}

// Seed mengisi database SQLite dengan data master Reverse: 1999 (Characters, Psychubes,
// Resonance Presets, serta data awal contoh tim Dynamo) menggunakan Raw SQL.
// Menggunakan "ON CONFLICT DO UPDATE" (bukan INSERT OR REPLACE) agar data master
// diperbarui di tempat tanpa memicu ON DELETE CASCADE pada tabel user_roster/team_members.
func Seed(db *sql.DB) error {
	if err := seedPsychubes(db); err != nil {
		return fmt.Errorf("gagal seed psychubes: %w", err)
	}
	if err := seedCharacters(db); err != nil {
		return fmt.Errorf("gagal seed characters: %w", err)
	}
	if err := seedResonancePresets(db); err != nil {
		return fmt.Errorf("gagal seed resonance presets: %w", err)
	}
	if err := seedInitialSampleData(db); err != nil {
		return fmt.Errorf("gagal seed sample roster: %w", err)
	}
	return nil
}

func seedPsychubes(db *sql.DB) error {
	psychubes := []models.Psychube{
		{
			ID:             "steps-forward",
			Name:           "Steps Forward",
			Rarity:         6,
			EngravingStat:  "Incantation Might +18%",
			PassiveSummary: "BiS Lucy: Jika pembawa berelemen [Intellect], Critical Rate +6%. Jika memiliki >=2 jenis efek [Special], Incantation Might +6% saat menyerang; jika memiliki [Force Field], Incantation Might meningkat +12% dan Crit Rate +3%.",
			ArchetypeFit:   "Dynamo / Intellect Carry",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1527.webp",
			BaseATK:        380,
			BaseHP:         2400,
			BaseDEF:        160,
		},
		{
			ID:             "a-tingle-of-a-thought",
			Name:           "A Tingle of a Thought",
			Rarity:         6,
			EngravingStat:  "Incantation Might +18%",
			PassiveSummary: "BiS Ulrich/Dynamo: Jika pembawa berelemen [Intellect], setelah memakai kartu Channel, ATK +1% (maks 3x). Di akhir ronde, tiap kali tim mentransfer [Dynamo], Crit DMG +1.2% (maks 16 stack).",
			ArchetypeFit:   "Dynamo / Intellect",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1550.webp",
			BaseATK:        370,
			BaseHP:         2500,
			BaseDEF:        170,
		},
		{
			ID:             "brave-new-world",
			Name:           "Brave New World",
			Rarity:         6,
			EngravingStat:  "Ultimate Might +18%",
			PassiveSummary: "Generalist Ultimate: Setelah pembawa melancarkan Ultimate, Incantation Might dari kartu biasa berikutnya meningkat +20% (Amp 1) hingga +40% (Amp 5).",
			ArchetypeFit:   "Ultimate Spam / General DPS",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1501.webp",
			BaseATK:        370,
			BaseHP:         2600,
			BaseDEF:        160,
		},
		{
			ID:             "hopscotch",
			Name:           "Hopscotch",
			Rarity:         6,
			EngravingStat:  "Incantation Might +18%",
			PassiveSummary: "Generalist Carry: Setiap kali pembawa mengalahkan target musuh, Ultimate Might meningkat +4% (Amp 1) hingga +8% (Amp 5), maksimal 4 tumpukan.",
			ArchetypeFit:   "General DPS / Wave Clear",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1502.webp",
			BaseATK:        370,
			BaseHP:         2400,
			BaseDEF:        170,
		},
		{
			ID:             "knock-on-the-door",
			Name:           "Knock on the Door",
			Rarity:         6,
			EngravingStat:  "Incantation Might +18%",
			PassiveSummary: "BiS Isolde / Burn: Ketika menyerang musuh berstatus [Burn], DMG Dealt +6%. Ketika serangan ekstra pembawa bersifat AoE (Mass), Incantation Might meningkat drastis.",
			ArchetypeFit:   "Lingering Glow / Burn / FUA",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1523.webp",
			BaseATK:        360,
			BaseHP:         2600,
			BaseDEF:        165,
		},
		{
			ID:             "silent-and-adoring",
			Name:           "Silent and Adoring",
			Rarity:         6,
			EngravingStat:  "ATK +10%",
			PassiveSummary: "BiS 37 / Eureka FUA: Meningkatkan DMG dari serangan ekstra (Extra Action) sebesar +12%, dan Genesis DMG dari serangan ekstra meningkat +10% (Amp 1) hingga +20% (Amp 5).",
			ArchetypeFit:   "Follow-Up / Eureka / Genesis",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1513.webp",
			BaseATK:        380,
			BaseHP:         2200,
			BaseDEF:        160,
		},
		{
			ID:             "balance-please",
			Name:           "Balance, Please",
			Rarity:         6,
			EngravingStat:  "Incantation Might +18%",
			PassiveSummary: "BiS Spirit/Intellect: Ketika menyerang tanpa keunggulan elemen, DMG Dealt +6%. Jika pembawa berelemen Primal (Spirit/Intellect), efek meningkat dua kali lipat menjadi +12% (Amp 1) hingga +24% (Amp 5).",
			ArchetypeFit:   "Spirit & Intellect / General",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1514.webp",
			BaseATK:        360,
			BaseHP:         2600,
			BaseDEF:        180,
		},
		{
			ID:             "her-second-life",
			Name:           "Her Second Life",
			Rarity:         6,
			EngravingStat:  "ATK +10%",
			PassiveSummary: "Sustain / Support Ultimate: Setelah pembawa melancarkan Ultimate berjenis Mass (AoE), memulihkan HP seluruh anggota tim sebesar 32% (Amp 1) hingga 64% (Amp 5) dari ATK pembawa.",
			ArchetypeFit:   "Support / Sub-Healer",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1503.webp",
			BaseATK:        350,
			BaseHP:         2600,
			BaseDEF:        160,
		},
		{
			ID:             "that-inquisitive-dear",
			Name:           "That Inquisitive Dear",
			Rarity:         6,
			EngravingStat:  "Healing Done +18%",
			PassiveSummary: "BiS Pure Healer: Setiap kali pembawa menggunakan kartu debuff dasar, memulihkan HP sebesar 24% ATK ke anggota tim dengan persentase HP terendah.",
			ArchetypeFit:   "Survival / Healer",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1508.webp",
			BaseATK:        340,
			BaseHP:         2600,
			BaseDEF:        170,
		},
		{
			ID:             "a-dream-beyond-light",
			Name:           "A Dream Beyond Light",
			Rarity:         6,
			EngravingStat:  "HP +16%",
			PassiveSummary: "Conduit / Sustain: Jika pembawa berelemen [Mineral], mendapat Healing Done +12%. Tiap kali rekan mengonsumsi Conduit Energy, seluruh tim mendapat Crit DMG +0.8% (maks 16 stack).",
			ArchetypeFit:   "Conduit / Mineral Sustain",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/psychubes/1573.webp",
			BaseATK:        350,
			BaseHP:         2800,
			BaseDEF:        175,
		},
	}

	query := `
		INSERT INTO psychubes (
			id, name, rarity, engraving_stat, passive_summary,
			archetype_fit, image_url, base_atk, base_hp, base_def
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			name = excluded.name,
			rarity = excluded.rarity,
			engraving_stat = excluded.engraving_stat,
			passive_summary = excluded.passive_summary,
			archetype_fit = excluded.archetype_fit,
			image_url = excluded.image_url,
			base_atk = excluded.base_atk,
			base_hp = excluded.base_hp,
			base_def = excluded.base_def
	`
	// 1. Muat Psychube bintang 6 dari katalog embeddedPsychubesJSON terlebih dahulu
	var rawCubes []rawCatalogPsychube
	if err := json.Unmarshal(embeddedPsychubesJSON, &rawCubes); err == nil {
		for _, rc := range rawCubes {
			if rc.Rarity < 6 {
				continue
			}
			summary := rc.Passive
			if len(summary) > 140 {
				summary = summary[:140] + "..."
			}
			if _, err := db.Exec(
				query,
				rc.ID, rc.Name, rc.Rarity, "ATK / Incantation Might", summary,
				"Universal 6★", rc.ImageURL, 370, 2500, 165,
			); err != nil {
				return err
			}
		}
	}

	// 2. Timpa dengan 10 Psychube kurasi utama Bahasa Indonesia
	for _, p := range psychubes {
		if _, err := db.Exec(
			query,
			p.ID, p.Name, p.Rarity, p.EngravingStat, p.PassiveSummary,
			p.ArchetypeFit, p.ImageURL, p.BaseATK, p.BaseHP, p.BaseDEF,
		); err != nil {
			return err
		}
	}
	return nil
}

func seedCharacters(db *sql.DB) error {
	characters := []models.Character{
		// ==================== ARCHETYPE: DYNAMO (PRIORITAS UTAMA) ====================
		{
			ID:             "lucy",
			Name:           "Lucy",
			Rarity:         6,
			Afflatus:       "Intellect",
			DamageType:     "Reality",
			Role:           "Damage Dealer",
			Archetype:      "Dynamo",
			Tier:           "S+",
			HasEuphoria:    true,
			BestPsychubeID: "steps-forward",
			ResonanceFocus: "Crit Rate & Crit DMG (ATK Secondary)",
			BestPattern:    "Elucidation",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/lucy-face.webp",
			Description:    "Main Carry utama tim Dynamo. Mengumpulkan dan menyuntikkan [Dynamo] ke [Pulsing Field], meng-upgrade kartu skill-nya, serta melancarkan Follow-Up Attack AoE [Conservation of Energy] dengan keunggulan elemen universal saat Ultimate aktif.",
			BaseATK:        1044,
			BaseHP:         6666,
			BaseRealityDEF: 505,
			BaseMentalDEF:  505,
			BaseTechnique:  882,
		},
		{
			ID:             "ulrich",
			Name:           "Ulrich",
			Rarity:         6,
			Afflatus:       "Intellect",
			DamageType:     "Reality",
			Role:           "Sub Carry",
			Archetype:      "Dynamo",
			Tier:           "S+",
			HasEuphoria:    false,
			BestPsychubeID: "a-tingle-of-a-thought",
			ResonanceFocus: "Crit Rate & ATK%",
			BestPattern:    "Elucidation",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/ulrich-face.webp",
			Description:    "Mesin pengisi [Dynamo] tercepat (Battery & Sub-DPS). Menyuntikkan hingga 15 Dynamo tiap akhir ronde, dan Ultimate-nya langsung menghasilkan serta menyuntikkan 30 Dynamo sekaligus ke [Pulsing Field] untuk langsung mendorongnya ke Level 3.",
			BaseATK:        1120,
			BaseHP:         6600,
			BaseRealityDEF: 549,
			BaseMentalDEF:  549,
			BaseTechnique:  765,
		},
		{
			ID:             "ezra-theodore",
			Name:           "Ezra Theodore",
			Rarity:         6,
			Afflatus:       "Star",
			DamageType:     "Mental",
			Role:           "Survival",
			Archetype:      "Dynamo",
			Tier:           "S",
			HasEuphoria:    true,
			BestPsychubeID: "that-inquisitive-dear",
			ResonanceFocus: "HP% & DMG Reduction",
			BestPattern:    "Stupefaction",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/ezra-theodore-face.webp",
			Description:    "Sustain & Shielder utama untuk tim Dynamo (dengan Euphoria). Menghasilkan Shield tebal melalui jamur uniknya sekaligus mengumpulkan dan menyuntikkan hingga 20 tumpukan [Dynamo] ke [Pulsing Field] setiap akhir ronde.",
			BaseATK:        945,
			BaseHP:         8249,
			BaseRealityDEF: 572,
			BaseMentalDEF:  572,
			BaseTechnique:  456,
		},
		{
			ID:             "recoleta",
			Name:           "Recoleta",
			Rarity:         6,
			Afflatus:       "Mineral",
			DamageType:     "Reality",
			Role:           "Damage Dealer",
			Archetype:      "Dynamo",
			Tier:           "S+",
			HasEuphoria:    false,
			BestPsychubeID: "brave-new-world",
			ResonanceFocus: "Crit DMG & ATK%",
			BestPattern:    "Aspirational",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/recoleta-face.webp",
			Description:    "Carry / Burst Amplifier berperingkat S+ yang dapat menyimpan Moxie melebihi batas 5 poin untuk melepaskan Ultimate AoE + Single Target masif sekaligus membagikan Moxie ke rekan tim.",
			BaseATK:        1153,
			BaseHP:         6270,
			BaseRealityDEF: 515,
			BaseMentalDEF:  525,
			BaseTechnique:  456,
		},

		// ==================== ARCHETYPE: UNIVERSAL SUPPORT & SUSTAIN ====================
		{
			ID:             "kakania",
			Name:           "Kakania",
			Rarity:         6,
			Afflatus:       "Plant",
			DamageType:     "Mental",
			Role:           "Support",
			Archetype:      "Dynamo",
			Tier:           "S+",
			HasEuphoria:    false,
			BestPsychubeID: "balance-please",
			ResonanceFocus: "HP% Maksimal (Skala Empathy)",
			BestPattern:    "Stupefaction",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/kakania-face.webp",
			Description:    "Support & Damage Absorber terbaik yang sangat fleksibel di tim Dynamo maupun Bloodtithe. Menyerap separuh kerusakan yang diterima rekan ke pool [Empathy] miliknya, memberikan bonus Flat ATK raksasa, dan memantulkan Genesis DMG.",
			BaseATK:        1011,
			BaseHP:         8579,
			BaseRealityDEF: 577,
			BaseMentalDEF:  577,
			BaseTechnique:  305,
		},
		{
			ID:             "flutterpage",
			Name:           "Flutterpage",
			Rarity:         6,
			Afflatus:       "Star",
			DamageType:     "Reality",
			Role:           "Support",
			Archetype:      "Follow-Up",
			Tier:           "S+",
			HasEuphoria:    false,
			BestPsychubeID: "silent-and-adoring",
			ResonanceFocus: "Crit Rate & Crit DMG",
			BestPattern:    "Elucidation",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/flutterpage-face.webp",
			Description:    "Buffer nomor satu untuk tim Follow-Up Attack (termasuk Lucy). Mengumpulkan tumpukan [Gust] dari setiap aksi rekan tim untuk mengaktifkan Force Field yang semakin kuat di 5, 15, dan 25 tumpukan.",
			BaseATK:        1120,
			BaseHP:         5543,
			BaseRealityDEF: 492,
			BaseMentalDEF:  492,
			BaseTechnique:  571,
		},
		{
			ID:             "fatutu",
			Name:           "Fatutu",
			Rarity:         6,
			Afflatus:       "Mineral",
			DamageType:     "Mental",
			Role:           "Survival",
			Archetype:      "Follow-Up",
			Tier:           "S+",
			HasEuphoria:    false,
			BestPsychubeID: "that-inquisitive-dear",
			ResonanceFocus: "HP% & Healing Done",
			BestPattern:    "Placidity",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/fatutu-face.webp",
			Description:    "Healer S+ terbaik di meta saat ini. Melempar dan menarik [Spirit Shell] untuk memulihkan seluruh tim, membagi rata kerusakan yang masuk, membersihkan debuff, dan meningkatkan kerusakan Follow-Up Attack.",
			BaseATK:        1020,
			BaseHP:         8600,
			BaseRealityDEF: 630,
			BaseMentalDEF:  640,
			BaseTechnique:  250,
		},
		{
			ID:             "medicine-pocket",
			Name:           "Medicine Pocket",
			Rarity:         6,
			Afflatus:       "Beast",
			DamageType:     "Mental",
			Role:           "Survival",
			Archetype:      "General",
			Tier:           "S+",
			HasEuphoria:    true,
			BestPsychubeID: "that-inquisitive-dear",
			ResonanceFocus: "ATK% & HP%",
			BestPattern:    "Placidity",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/medicine-pocket-face.webp",
			Description:    "Healer & Debuffer serbaguna (semakin kuat dengan Euphoria). Memberikan debuff DMG Taken +20% pada musuh, Stun/Daze lewat Ultimate, serta pemulihan HP darurat yang sangat andal.",
			BaseATK:        1120,
			BaseHP:         7600,
			BaseRealityDEF: 580,
			BaseMentalDEF:  600,
			BaseTechnique:  260,
		},

		// ==================== ARCHETYPE: BLOODTITHE ====================
		{
			ID:             "nautika",
			Name:           "Nautika",
			Rarity:         6,
			Afflatus:       "Plant",
			DamageType:     "Mental",
			Role:           "Damage Dealer",
			Archetype:      "Bloodtithe",
			Tier:           "S+",
			HasEuphoria:    false,
			BestPsychubeID: "brave-new-world",
			ResonanceFocus: "HP% & Crit DMG",
			BestPattern:    "Hyperphrenia",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/nautika-face.webp",
			Description:    "Main Carry utama tim Bloodtithe. Mengorbankan HP untuk mengisi gauge [Bloodtithe] bersama tim dan melepaskan serangan burst berskala Max HP dengan lifesteal tinggi.",
			BaseATK:        1180,
			BaseHP:         9200,
			BaseRealityDEF: 610,
			BaseMentalDEF:  620,
			BaseTechnique:  330,
		},
		{
			ID:             "semmelweis",
			Name:           "Semmelweis",
			Rarity:         6,
			Afflatus:       "Mineral",
			DamageType:     "Reality",
			Role:           "Sub Carry",
			Archetype:      "Bloodtithe",
			Tier:           "S+",
			HasEuphoria:    true,
			BestPsychubeID: "brave-new-world",
			ResonanceFocus: "Crit Rate & HP%",
			BestPattern:    "Hyperphrenia",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/semmelweis-face.webp",
			Description:    "Pilar utama Array Bloodtithe. Mengaktifkan Array yang menguras sedikit HP rekan untuk memberikan hampir semua jenis buff ofensif dan defensif di dalam gim, sembari melepaskan Follow-Up Attack di akhir ronde.",
			BaseATK:        1200,
			BaseHP:         8500,
			BaseRealityDEF: 600,
			BaseMentalDEF:  600,
			BaseTechnique:  320,
		},

		// ==================== ARCHETYPE: LINGERING GLOW ====================
		{
			ID:             "beryl",
			Name:           "Beryl",
			Rarity:         6,
			Afflatus:       "Intellect",
			DamageType:     "Mental",
			Role:           "Damage Dealer",
			Archetype:      "Lingering Glow",
			Tier:           "S+",
			HasEuphoria:    false,
			BestPsychubeID: "knock-on-the-door",
			ResonanceFocus: "Crit Rate & Crit DMG",
			BestPattern:    "Elucidation",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/beryl-face.webp",
			Description:    "Carry utama archetype Lingering Glow. Mengandalkan aksi frekuensi tinggi dan tumpukan [Burn]/[Halo] untuk menjaga stack Lingering Glow tetap tinggi dan menghujani musuh dengan AoE Mental DMG.",
			BaseATK:        1290,
			BaseHP:         7100,
			BaseRealityDEF: 570,
			BaseMentalDEF:  590,
			BaseTechnique:  355,
		},
		{
			ID:             "isolde",
			Name:           "Isolde",
			Rarity:         6,
			Afflatus:       "Spirit",
			DamageType:     "Reality",
			Role:           "Sub Carry",
			Archetype:      "Lingering Glow",
			Tier:           "S",
			HasEuphoria:    false,
			BestPsychubeID: "knock-on-the-door",
			ResonanceFocus: "Crit Rate & ATK%",
			BestPattern:    "Elucidation",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/isolde-face.webp",
			Description:    "Enabler Burn / Lingering Glow & Reality DEF Shredder. Mengumpulkan [Heat] dari tumpukan Burn musuh untuk bertransisi dari Overture -> Intermezzo -> Finale dan melancarkan serangan ekstra otomatis tiap ronde.",
			BaseATK:        1220,
			BaseHP:         7400,
			BaseRealityDEF: 585,
			BaseMentalDEF:  585,
			BaseTechnique:  330,
		},

		// ==================== ARCHETYPE: FOLLOW-UP & ULTIMATE & CONDUIT ====================
		{
			ID:             "37",
			Name:           "37",
			Rarity:         6,
			Afflatus:       "Star",
			DamageType:     "Mental",
			Role:           "Sub Carry",
			Archetype:      "Follow-Up",
			Tier:           "S",
			HasEuphoria:    true,
			BestPsychubeID: "silent-and-adoring",
			ResonanceFocus: "Crit Rate & ATK% (Genesis DMG Bisa Crit)",
			BestPattern:    "Elucidation",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/thirty-seven-face.webp",
			Description:    "Spesialis Eureka & Follow-Up Attack. Setiap kali rekan tim melakukan serangan ekstra (FUA), 37 mendapatkan +1 Eureka. Saat mencapai 5 Eureka, ia melancarkan serangan AoE yang menghasilkan Genesis DMG yang dapat Critical!",
			BaseATK:        1230,
			BaseHP:         6950,
			BaseRealityDEF: 560,
			BaseMentalDEF:  610,
			BaseTechnique:  350,
		},
		{
			ID:             "anjo-nala",
			Name:           "Anjo Nala",
			Rarity:         6,
			Afflatus:       "Beast",
			DamageType:     "Mental",
			Role:           "Sub Carry",
			Archetype:      "Follow-Up",
			Tier:           "S+",
			HasEuphoria:    false,
			BestPsychubeID: "silent-and-adoring",
			ResonanceFocus: "Crit Rate & Crit DMG",
			BestPattern:    "Elucidation",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/anjo-nala-face.webp",
			Description:    "Unit Contract / Follow-Up luar biasa yang dapat mengikat kontrak dengan satu rekan tim, memicu serangan susulan beruntun dan crowd-control.",
			BaseATK:        1143,
			BaseHP:         6927,
			BaseRealityDEF: 482,
			BaseMentalDEF:  505,
			BaseTechnique:  456,
		},
		{
			ID:             "melania",
			Name:           "Melania",
			Rarity:         6,
			Afflatus:       "Beast",
			DamageType:     "Mental",
			Role:           "Damage Dealer",
			Archetype:      "Ultimate",
			Tier:           "S+",
			HasEuphoria:    true,
			BestPsychubeID: "brave-new-world",
			ResonanceFocus: "Crit Rate & Crit DMG",
			BestPattern:    "Elucidation",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/melania-face.webp",
			Description:    "Ratu Single-Target Ultimate Spam & Moxie Stealer (semakin buas setelah Euphoria). Mencuri Moxie bos agar bos gagal mengeluarkan Ultimate, sambil terus menggandakan kerusakan Ultimate-nya sendiri setiap kali dipakai.",
			BaseATK:        1133,
			BaseHP:         6204,
			BaseRealityDEF: 572,
			BaseMentalDEF:  572,
			BaseTechnique:  341,
		},
		{
			ID:             "pickles",
			Name:           "Pickles",
			Rarity:         6,
			Afflatus:       "Mineral",
			DamageType:     "Mental",
			Role:           "Support",
			Archetype:      "Ultimate",
			Tier:           "S+",
			HasEuphoria:    true,
			BestPsychubeID: "brave-new-world",
			ResonanceFocus: "Crit Rate & ATK%",
			BestPattern:    "Placidity",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/pickles-face.webp",
			Description:    "Support AP-friendly yang sangat hemat giliran. Ketika tidak beraksi selama 1 ronde, ia mendapat [Clarified Topic] yang memperkuat skill berikutnya, menghapus buff musuh (Dispel), dan memberikan DMG Bonus +30% ke seluruh tim lewat Ultimate.",
			BaseATK:        1120,
			BaseHP:         6468,
			BaseRealityDEF: 525,
			BaseMentalDEF:  592,
			BaseTechnique:  305,
		},
		{
			ID:             "coppelia",
			Name:           "Coppélia",
			Rarity:         6,
			Afflatus:       "Mineral",
			DamageType:     "Reality",
			Role:           "Damage Dealer",
			Archetype:      "Conduit",
			Tier:           "S",
			HasEuphoria:    false,
			BestPsychubeID: "a-dream-beyond-light",
			ResonanceFocus: "Crit Rate & Crit DMG",
			BestPattern:    "Elucidation",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/coppelia-face.webp",
			Description:    "Carry archetype Conduit yang mengumpulkan [Chromatic Progression] dari setiap Conduit Energy yang dikonsumsi tim dan meledakkannya melalui Ultimate 960% Reality DMG.",
			BaseATK:        1209,
			BaseHP:         6270,
			BaseRealityDEF: 492,
			BaseMentalDEF:  492,
			BaseTechnique:  571,
		},
		{
			ID:             "kiperina",
			Name:           "Kiperina",
			Rarity:         6,
			Afflatus:       "Star",
			DamageType:     "Mental",
			Role:           "Survival",
			Archetype:      "General",
			Tier:           "S+",
			HasEuphoria:    false,
			BestPsychubeID: "that-inquisitive-dear",
			ResonanceFocus: "ATK% & Shield Strength",
			BestPattern:    "Placidity",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/kiperina-face.webp",
			Description:    "Shield Support S+ yang memberikan Shield tebal hingga 650% ATK ke seluruh tim, memberikan bonus Crit Rate berdasarkan ketebalan Shield, serta membersihkan debuff lewat Ultimate.",
			BaseATK:        1143,
			BaseHP:         6072,
			BaseRealityDEF: 549,
			BaseMentalDEF:  549,
			BaseTechnique:  445,
		},

		// ==================== KARAKTER 5-STAR POPULER (RAMAH PEMULA / F2P) ====================
		{
			ID:             "bkornblume",
			Name:           "Bkornblume",
			Rarity:         5,
			Afflatus:       "Plant",
			DamageType:     "Reality",
			Role:           "Support",
			Archetype:      "Ultimate",
			Tier:           "S",
			HasEuphoria:    true,
			BestPsychubeID: "her-second-life",
			ResonanceFocus: "ATK% & Crit Rate",
			BestPattern:    "Placidity",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/bkornblume-face.webp",
			Description:    "5-Star terbaik di Reverse: 1999 (semakin kuat dengan Euphoria). Memangkas Reality DEF musuh sebesar 25% dan menaikkan DMG Taken musuh +25%, sementara Ultimate-nya memberikan [Seal] atau menguras 2 Moxie bos.",
			BaseATK:        1139,
			BaseHP:         5919,
			BaseRealityDEF: 445,
			BaseMentalDEF:  512,
			BaseTechnique:  194,
		},
		{
			ID:             "sonetto",
			Name:           "Sonetto",
			Rarity:         5,
			Afflatus:       "Mineral",
			DamageType:     "Reality",
			Role:           "Support",
			Archetype:      "General",
			Tier:           "A",
			HasEuphoria:    true,
			BestPsychubeID: "her-second-life",
			ResonanceFocus: "ATK% & HP%",
			BestPattern:    "Placidity",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/sonetto-face.webp",
			Description:    "Asisten setia Timekeeper (didapat gratis). Memberikan buff komprehensif (DMG Dealt +25%, DMG Taken -25%, dan Penetration Rate) serta efek [Disarm] selama 2 ronde.",
			BaseATK:        975,
			BaseHP:         6783,
			BaseRealityDEF: 579,
			BaseMentalDEF:  512,
			BaseTechnique:  247,
		},
		{
			ID:             "yenisei",
			Name:           "Yenisei",
			Rarity:         5,
			Afflatus:       "Star",
			DamageType:     "Mental",
			Role:           "Survival",
			Archetype:      "General",
			Tier:           "B",
			HasEuphoria:    false,
			BestPsychubeID: "that-inquisitive-dear",
			ResonanceFocus: "HP% & Healing Done",
			BestPattern:    "Placidity",
			ImageURL:       "https://www.gacha.gg/img/reverse-1999/dm/chars/3082-face.webp",
			Description:    "Healer & Shielder 5-Star terbaik untuk pemula. Memberikan heal sebesar 40% Max HP + Sturdiness, sementara Ultimate-nya memberikan Shield tebal dan status [Immunity] (kebal debuff) kepada seluruh tim.",
			BaseATK:        922,
			BaseHP:         7031,
			BaseRealityDEF: 534,
			BaseMentalDEF:  534,
			BaseTechnique:  383,
		},
	}

	query := `
		INSERT INTO characters (
			id, name, rarity, afflatus, damage_type, role, archetype, tier,
			has_euphoria, best_psychube_id, resonance_focus, best_pattern,
			image_url, description, base_atk, base_hp, base_reality_def,
			base_mental_def, base_technique
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			name = excluded.name,
			rarity = excluded.rarity,
			afflatus = excluded.afflatus,
			damage_type = excluded.damage_type,
			role = excluded.role,
			archetype = excluded.archetype,
			tier = excluded.tier,
			has_euphoria = excluded.has_euphoria,
			best_psychube_id = excluded.best_psychube_id,
			resonance_focus = excluded.resonance_focus,
			best_pattern = excluded.best_pattern,
			image_url = excluded.image_url,
			description = excluded.description,
			base_atk = excluded.base_atk,
			base_hp = excluded.base_hp,
			base_reality_def = excluded.base_reality_def,
			base_mental_def = excluded.base_mental_def,
			base_technique = excluded.base_technique
	`

	// 1. Muat seluruh 129 karakter dari katalog embeddedCharactersJSON terlebih dahulu,
	// lalu timpa dengan 21 karakter kurasi utama di atas agar deskripsi mendalamnya tetap terjaga.
	var rawCatalog []rawCatalogCharacter
	if err := json.Unmarshal(embeddedCharactersJSON, &rawCatalog); err == nil {
		for _, rc := range rawCatalog {
			c := mapRawCharacterToModel(rc)
			if _, err := db.Exec(
				query,
				c.ID, c.Name, c.Rarity, c.Afflatus, c.DamageType, c.Role, c.Archetype, c.Tier,
				0, c.BestPsychubeID, c.ResonanceFocus, c.BestPattern,
				c.ImageURL, c.Description, c.BaseATK, c.BaseHP, c.BaseRealityDEF,
				c.BaseMentalDEF, c.BaseTechnique,
			); err != nil {
				return err
			}
		}
	}

	// 2. Simpan/Perbarui 21 karakter kurasi spesial Bahasa Indonesia
	for _, c := range characters {
		hasEuph := 0
		if c.HasEuphoria {
			hasEuph = 1
		}
		if _, err := db.Exec(
			query,
			c.ID, c.Name, c.Rarity, c.Afflatus, c.DamageType, c.Role, c.Archetype, c.Tier,
			hasEuph, c.BestPsychubeID, c.ResonanceFocus, c.BestPattern,
			c.ImageURL, c.Description, c.BaseATK, c.BaseHP, c.BaseRealityDEF,
			c.BaseMentalDEF, c.BaseTechnique,
		); err != nil {
			return err
		}
	}
	return nil
}

// mapRawCharacterToModel memetakan data katalog 129 karakter menjadi struct models.Character
// lengkap dengan Role, Archetype, Best Psychube, Pola Stat, dan penjelasan singkat Bahasa Indonesia.
func mapRawCharacterToModel(rc rawCatalogCharacter) models.Character {
	tags := rc.RoleTags
	role := "Damage Dealer"
	switch {
	case strings.Contains(tags, "Heal") || strings.Contains(tags, "Shield") || strings.Contains(tags, "Defense"):
		role = "Survival"
	case strings.HasPrefix(tags, "Support") || strings.HasPrefix(tags, "Control") || strings.HasPrefix(tags, "Debuff"):
		role = "Support"
	case strings.Contains(tags, "DPS") && (strings.Contains(tags, "Support") || strings.Contains(tags, "Extra Action")):
		role = "Sub Carry"
	}

	archetype := "General"
	bestCube := "hopscotch"
	focus := "Crit Rate & ATK%"
	pattern := "Elucidation"

	switch {
	case strings.Contains(tags, "Dynamo"):
		archetype = "Dynamo"
		bestCube = "a-tingle-of-a-thought"
		if role == "Damage Dealer" {
			bestCube = "steps-forward"
		}
		focus = "Crit Rate & Crit DMG"
	case strings.Contains(tags, "Bloodtithe") || strings.Contains(tags, "HP Sacrifice"):
		archetype = "Bloodtithe"
		bestCube = "brave-new-world"
		focus = "HP% & Crit DMG"
		pattern = "Hyperphrenia"
	case strings.Contains(tags, "Lingering Glow") || strings.Contains(tags, "Burn"):
		archetype = "Lingering Glow"
		bestCube = "knock-on-the-door"
		focus = "Crit Rate & ATK%"
	case strings.Contains(tags, "Extra Action") || strings.Contains(tags, "Eureka") || strings.Contains(tags, "Inspiration"):
		archetype = "Follow-Up"
		bestCube = "silent-and-adoring"
		focus = "Crit Rate & Crit DMG"
	case strings.Contains(tags, "Conduit"):
		archetype = "Conduit"
		bestCube = "a-dream-beyond-light"
		focus = "Crit Rate & Crit DMG"
	case strings.Contains(tags, "Ritual"):
		archetype = "Ultimate"
		bestCube = "brave-new-world"
		focus = "Ultimate Might & Crit"
	}

	if role == "Survival" {
		bestCube = "that-inquisitive-dear"
		focus = "HP% & Healing Done"
		pattern = "Placidity"
		if strings.Contains(tags, "Shield") {
			pattern = "Stupefaction"
			focus = "HP% & DMG Reduction"
		}
	} else if role == "Support" && archetype == "General" {
		bestCube = "her-second-life"
		focus = "HP% & ATK%"
		pattern = "Placidity"
	}

	// Buat deskripsi Bahasa Indonesia yang ringkas & ramah pemula
	roleID := "Penyerang Utama (DPS)"
	switch role {
	case "Sub Carry":
		roleID = "Penyerang Pendukung (Sub-DPS)"
	case "Support":
		roleID = "Pendukung Tim (Buffer/Control)"
	case "Survival":
		roleID = "Pelindung & Penyembuh Tim (Healer/Shield)"
	}

	desc := fmt.Sprintf(
		"%s berelemen %s (%d★) untuk gaya bertarung %s. Memiliki spesialisasi mekanik: %s.",
		roleID, rc.Afflatus, rc.Rarity, archetype, strings.ReplaceAll(tags, " ", ", "),
	)

	baseATK := 1050
	baseHP := 6800
	if rc.Rarity == 6 {
		baseATK = 1220
		baseHP = 7400
	} else if rc.Rarity <= 4 {
		baseATK = 880
		baseHP = 5900
	}

	return models.Character{
		ID:             rc.ID,
		Name:           rc.Name,
		Rarity:         rc.Rarity,
		Afflatus:       rc.Afflatus,
		DamageType:     "Reality",
		Role:           role,
		Archetype:      archetype,
		Tier:           rc.Tier,
		HasEuphoria:    false,
		BestPsychubeID: bestCube,
		ResonanceFocus: focus,
		BestPattern:    pattern,
		ImageURL:       rc.ImageURL,
		Description:    desc,
		BaseATK:        baseATK,
		BaseHP:         baseHP,
		BaseRealityDEF: 560,
		BaseMentalDEF:  560,
		BaseTechnique:  330,
	}
}

func seedResonancePresets(db *sql.DB) error {
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM resonance_presets`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	presets := []models.ResonancePreset{
		{
			CharacterID:    "lucy",
			PresetName:     "Hyper-Crit Dynamo Carry (R10 Meta)",
			ResonanceLevel: 10,
			Pattern:        "Elucidation",
			StatFocus:      "Crit Rate +22%, Crit DMG +28%, ATK +14%, Incantation Might +8%",
			GridJSON:       `[{"id":"main-T","name":"Main Idea (T-Shape)","row":1,"col":1,"color":"amber","stats":{"atk_pct":10,"crit_rate":12,"crit_dmg":15}},{"id":"crit-L1","name":"L-Shape Crit","row":1,"col":4,"color":"rose","stats":{"crit_rate":5,"crit_dmg":8}},{"id":"crit-L2","name":"L-Shape Crit","row":4,"col":1,"color":"rose","stats":{"crit_rate":5,"crit_dmg":5}},{"id":"atk-I1","name":"I-Bar ATK","row":4,"col":4,"color":"emerald","stats":{"atk_pct":4,"hp_pct":4}}]`,
		},
		{
			CharacterID:    "ulrich",
			PresetName:     "Rapid Dynamo Battery & Sub-DPS (R10)",
			ResonanceLevel: 10,
			Pattern:        "Elucidation",
			StatFocus:      "Crit Rate +18%, ATK +16%, Ultimate Might +10%",
			GridJSON:       `[{"id":"main-Z","name":"Main Idea (Z-Shape)","row":1,"col":1,"color":"amber","stats":{"atk_pct":12,"crit_rate":10,"crit_dmg":12}},{"id":"atk-L1","name":"L-Shape ATK","row":1,"col":4,"color":"emerald","stats":{"atk_pct":4,"crit_rate":4}},{"id":"crit-O1","name":"Square Crit","row":4,"col":2,"color":"rose","stats":{"crit_rate":4,"crit_dmg":6}}]`,
		},
		{
			CharacterID:    "ezra-theodore",
			PresetName:     "Fortress Shield & Dynamo Support (R10)",
			ResonanceLevel: 10,
			Pattern:        "Stupefaction",
			StatFocus:      "HP +24%, Reality/Mental DEF +15%, DMG Taken Reduction +8%",
			GridJSON:       `[{"id":"main-Cross","name":"Main Idea (Cross)","row":1,"col":1,"color":"amber","stats":{"hp_pct":16,"def_pct":10}},{"id":"hp-O1","name":"Square Vitality","row":1,"col":4,"color":"sky","stats":{"hp_pct":4,"def_pct":3}},{"id":"hp-O2","name":"Square Vitality","row":4,"col":1,"color":"sky","stats":{"hp_pct":4,"def_pct":2}}]`,
		},
		{
			CharacterID:    "kakania",
			PresetName:     "Max Empathy Pool (Pure HP R10)",
			ResonanceLevel: 10,
			Pattern:        "Stupefaction",
			StatFocus:      "HP +28% (Memaksimalkan Kapasitas Empathy & Flat ATK Buff)",
			GridJSON:       `[{"id":"main-O","name":"Main Idea (HP Block)","row":1,"col":1,"color":"amber","stats":{"hp_pct":18,"def_pct":8}},{"id":"hp-L1","name":"L-Shape HP","row":1,"col":4,"color":"sky","stats":{"hp_pct":5,"def_pct":2}},{"id":"hp-L2","name":"L-Shape HP","row":4,"col":1,"color":"sky","stats":{"hp_pct":5,"def_pct":2}}]`,
		},
	}

	query := `
		INSERT INTO resonance_presets (
			character_id, preset_name, resonance_level, pattern, stat_focus, grid_json
		) VALUES (?, ?, ?, ?, ?, ?)
	`
	for _, p := range presets {
		if _, err := db.Exec(query, p.CharacterID, p.PresetName, p.ResonanceLevel, p.Pattern, p.StatFocus, p.GridJSON); err != nil {
			return err
		}
	}
	return nil
}

// seedInitialSampleData menambahkan 4 karakter inti tim Dynamo ke user_roster
// dan 1 tim contoh jika tabel user_roster masih kosong saat pertama kali dijalankan.
func seedInitialSampleData(db *sql.DB) error {
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM user_roster`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	starterRoster := []models.UserRoster{
		{
			CharacterID:        "lucy",
			Insight:            3,
			Level:              60,
			Portray:            0,
			ResonanceLevel:     10,
			ResonancePattern:   "Elucidation",
			EuphoriaUnlocked:   true,
			EquippedPsychubeID: "steps-forward",
			PsychubeLevel:      60,
			PsychubeAmp:        1,
			Notes:              "Main Carry Dynamo - Prioritas Kartu Enhanced & Follow-Up",
		},
		{
			CharacterID:        "ulrich",
			Insight:            3,
			Level:              60,
			Portray:            0,
			ResonanceLevel:     10,
			ResonancePattern:   "Elucidation",
			EuphoriaUnlocked:   false,
			EquippedPsychubeID: "a-tingle-of-a-thought",
			PsychubeLevel:      60,
			PsychubeAmp:        1,
			Notes:              "Battery Dynamo - Gunakan Channel & Ultimate untuk suntik 30 Dynamo ke Pulsing Field",
		},
		{
			CharacterID:        "ezra-theodore",
			Insight:            3,
			Level:              60,
			Portray:            0,
			ResonanceLevel:     10,
			ResonancePattern:   "Stupefaction",
			EuphoriaUnlocked:   true,
			EquippedPsychubeID: "that-inquisitive-dear",
			PsychubeLevel:      60,
			PsychubeAmp:        1,
			Notes:              "Shielder + Suntik 20 Dynamo di akhir ronde",
		},
		{
			CharacterID:        "kakania",
			Insight:            3,
			Level:              60,
			Portray:            0,
			ResonanceLevel:     10,
			ResonancePattern:   "Stupefaction",
			EuphoriaUnlocked:   false,
			EquippedPsychubeID: "balance-please",
			PsychubeLevel:      60,
			PsychubeAmp:        1,
			Notes:              "Slot ke-4: Penyerap damage & pemberi Flat ATK buff besar",
		},
	}

	for _, r := range starterRoster {
		euph := 0
		if r.EuphoriaUnlocked {
			euph = 1
		}
		_, err := db.Exec(`
			INSERT INTO user_roster (
				character_id, insight, level, portray, resonance_level,
				resonance_pattern, euphoria_unlocked, equipped_psychube_id,
				psychube_level, psychube_amp, notes
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, r.CharacterID, r.Insight, r.Level, r.Portray, r.ResonanceLevel,
			r.ResonancePattern, euph, r.EquippedPsychubeID,
			r.PsychubeLevel, r.PsychubeAmp, r.Notes)
		if err != nil {
			return err
		}
	}

	// Cek apakah sudah ada tim di tabel teams
	var teamCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM teams`).Scan(&teamCount); err != nil {
		return err
	}
	if teamCount == 0 {
		res, err := db.Exec(`
			INSERT INTO teams (name, archetype, target_boss, tuning_skill, notes)
			VALUES (?, ?, ?, ?, ?)
		`, "Dynamo Pulsing Field Lv.3 Core", "Dynamo", "Limbo / Reveries in the Rain", "First Melody",
			"Rotasi: Aktifkan Pulsing Field Lv.1 -> Gunakan Channel Ulrich & aksi Ezra untuk menyuntikkan Dynamo -> Ultimate Ulrich untuk dorong ke Pulsing Field Lv.3 (+15% DMG, +25% Incantation Might, +35% Ultimate Might) -> Burst dengan Lucy!")
		if err != nil {
			return err
		}

		teamID, _ := res.LastInsertId()
		members := []models.TeamMember{
			{SlotNumber: 1, CharacterID: "lucy", PsychubeID: "steps-forward"},
			{SlotNumber: 2, CharacterID: "ulrich", PsychubeID: "a-tingle-of-a-thought"},
			{SlotNumber: 3, CharacterID: "ezra-theodore", PsychubeID: "that-inquisitive-dear"},
			{SlotNumber: 4, CharacterID: "kakania", PsychubeID: "balance-please"},
		}
		for _, m := range members {
			if _, err := db.Exec(`
				INSERT INTO team_members (team_id, slot_number, character_id, psychube_id)
				VALUES (?, ?, ?, ?)
			`, teamID, m.SlotNumber, m.CharacterID, m.PsychubeID); err != nil {
				return err
			}
		}
	}

	return nil
}
