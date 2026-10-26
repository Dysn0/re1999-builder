package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"re1999-backend/internal/models"
)

// APIHandler menyimpan referensi koneksi database (*sql.DB) agar semua fungsi handler
// dapat menjalankan kueri Raw SQL ke SQLite.
type APIHandler struct {
	DB *sql.DB
}

// NewAPIHandler adalah fungsi konstruktor untuk membuat instance APIHandler baru.
func NewAPIHandler(db *sql.DB) *APIHandler {
	return &APIHandler{DB: db}
}

// writeJSON adalah fungsi pembantu (helper) untuk mengirim respons berformat JSON ke browser.
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// ============================================================================
// 1. ENDPOINT MASTER KARakter (GET /api/characters)
// ============================================================================

func (h *APIHandler) GetCharacters(w http.ResponseWriter, r *http.Request) {
	// Ambil parameter filter opsional dari URL (contoh: /api/characters?archetype=Dynamo)
	afflatus := r.URL.Query().Get("afflatus")
	archetype := r.URL.Query().Get("archetype")
	role := r.URL.Query().Get("role")

	// Kueri dasar Raw SQL. Kondisi "WHERE 1=1" memudahkan penambahan filter "AND ..." secara dinamis.
	query := `
		SELECT id, name, rarity, afflatus, damage_type, role, archetype, tier,
		       has_euphoria, best_psychube_id, resonance_focus, best_pattern,
		       image_url, description, base_atk, base_hp, base_reality_def,
		       base_mental_def, base_technique
		FROM characters
		WHERE 1=1
	`
	var args []any

	if afflatus != "" {
		query += ` AND afflatus = ?`
		args = append(args, afflatus)
	}
	if archetype != "" {
		query += ` AND archetype = ?`
		args = append(args, archetype)
	}
	if role != "" {
		query += ` AND role = ?`
		args = append(args, role)
	}

	query += ` ORDER BY rarity DESC, name ASC`

	// Eksekusi SELECT menggunakan db.Query
	rows, err := h.DB.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var characters []models.Character
	for rows.Next() {
		var c models.Character
		var hasEuphoriaInt int // Di SQLite, boolean disimpan sebagai INTEGER (0 atau 1)

		err := rows.Scan(
			&c.ID, &c.Name, &c.Rarity, &c.Afflatus, &c.DamageType, &c.Role, &c.Archetype, &c.Tier,
			&hasEuphoriaInt, &c.BestPsychubeID, &c.ResonanceFocus, &c.BestPattern,
			&c.ImageURL, &c.Description, &c.BaseATK, &c.BaseHP, &c.BaseRealityDEF,
			&c.BaseMentalDEF, &c.BaseTechnique,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		c.HasEuphoria = (hasEuphoriaInt == 1)
		characters = append(characters, c)
	}

	if characters == nil {
		characters = []models.Character{}
	}
	writeJSON(w, http.StatusOK, characters)
}

// ============================================================================
// 2. ENDPOINT MASTER PSYCHUBES (GET /api/psychubes)
// ============================================================================

func (h *APIHandler) GetPsychubes(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`
		SELECT id, name, rarity, engraving_stat, passive_summary,
		       archetype_fit, image_url, base_atk, base_hp, base_def
		FROM psychubes
		ORDER BY rarity DESC, name ASC
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var list []models.Psychube
	for rows.Next() {
		var p models.Psychube
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Rarity, &p.EngravingStat, &p.PassiveSummary,
			&p.ArchetypeFit, &p.ImageURL, &p.BaseATK, &p.BaseHP, &p.BaseDEF,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		list = append(list, p)
	}

	if list == nil {
		list = []models.Psychube{}
	}
	writeJSON(w, http.StatusOK, list)
}

// ============================================================================
// 3. ENDPOINT USER ROSTER / KOLEKSI PEMAIN (GET, POST, DELETE /api/roster)
// ============================================================================

// GetRoster mengambil semua karakter yang dimiliki pemain dengan melakukan INNER JOIN
// antara tabel user_roster dan tabel characters.
func (h *APIHandler) GetRoster(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`
		SELECT ur.id, ur.character_id, ur.insight, ur.level, ur.portray,
		       ur.resonance_level, ur.resonance_pattern, ur.euphoria_unlocked,
		       ur.equipped_psychube_id, ur.psychube_level, ur.psychube_amp, ur.notes,
		       c.name, c.afflatus, c.role, c.archetype, c.image_url
		FROM user_roster ur
		INNER JOIN characters c ON ur.character_id = c.id
		ORDER BY ur.insight DESC, ur.level DESC, c.rarity DESC
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var roster []models.UserRoster
	for rows.Next() {
		var item models.UserRoster
		var euphoriaInt int
		if err := rows.Scan(
			&item.ID, &item.CharacterID, &item.Insight, &item.Level, &item.Portray,
			&item.ResonanceLevel, &item.ResonancePattern, &euphoriaInt,
			&item.EquippedPsychubeID, &item.PsychubeLevel, &item.PsychubeAmp, &item.Notes,
			&item.CharacterName, &item.Afflatus, &item.Role, &item.Archetype, &item.ImageURL,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		item.EuphoriaUnlocked = (euphoriaInt == 1)
		roster = append(roster, item)
	}

	if roster == nil {
		roster = []models.UserRoster{}
	}
	writeJSON(w, http.StatusOK, roster)
}

// UpsertRoster menyimpan karakter baru ke koleksi atau memperbarui progresnya jika sudah ada.
func (h *APIHandler) UpsertRoster(w http.ResponseWriter, r *http.Request) {
	var req models.UserRoster
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Nilai default yang aman jika belum diisi dari frontend
	if req.Level < 1 {
		req.Level = 1
	}
	if req.ResonanceLevel < 1 {
		req.ResonanceLevel = 1
	}
	if req.ResonancePattern == "" {
		req.ResonancePattern = "Placidity"
	}
	if req.PsychubeLevel < 1 {
		req.PsychubeLevel = 1
	}
	if req.PsychubeAmp < 1 {
		req.PsychubeAmp = 1
	}

	euphoriaInt := 0
	if req.EuphoriaUnlocked {
		euphoriaInt = 1
	}

	// Kueri UPSERT Raw SQL: jika character_id sudah ada di user_roster, lakukan UPDATE.
	query := `
		INSERT INTO user_roster (
			character_id, insight, level, portray, resonance_level,
			resonance_pattern, euphoria_unlocked, equipped_psychube_id,
			psychube_level, psychube_amp, notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(character_id) DO UPDATE SET
			insight = excluded.insight,
			level = excluded.level,
			portray = excluded.portray,
			resonance_level = excluded.resonance_level,
			resonance_pattern = excluded.resonance_pattern,
			euphoria_unlocked = excluded.euphoria_unlocked,
			equipped_psychube_id = excluded.equipped_psychube_id,
			psychube_level = excluded.psychube_level,
			psychube_amp = excluded.psychube_amp,
			notes = excluded.notes
	`

	_, err := h.DB.Exec(
		query,
		req.CharacterID, req.Insight, req.Level, req.Portray, req.ResonanceLevel,
		req.ResonancePattern, euphoriaInt, req.EquippedPsychubeID,
		req.PsychubeLevel, req.PsychubeAmp, req.Notes,
	)
	if err != nil {
		http.Error(w, "Gagal menyimpan roster: "+err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "saved",
		"message": "Data progres karakter berhasil disimpan!",
	})
}

// DeleteRoster menghapus karakter dari koleksi milik pemain.
func (h *APIHandler) DeleteRoster(w http.ResponseWriter, r *http.Request) {
	charID := r.PathValue("character_id")
	if charID == "" {
		http.Error(w, "character_id wajib diisi", http.StatusBadRequest)
		return
	}

	_, err := h.DB.Exec(`DELETE FROM user_roster WHERE character_id = ?`, charID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Karakter dihapus dari koleksi.",
	})
}

// ============================================================================
// 4. ENDPOINT TEAMS / TIM TERSIMPAN (GET, POST, DELETE /api/teams)
// ============================================================================

func (h *APIHandler) GetTeams(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`
		SELECT id, name, archetype, target_boss, tuning_skill, notes
		FROM teams
		ORDER BY id DESC
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var teams []models.Team
	for rows.Next() {
		var t models.Team
		if err := rows.Scan(&t.ID, &t.Name, &t.Archetype, &t.TargetBoss, &t.TuningSkill, &t.Notes); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		teams = append(teams, t)
	}
	rows.Close()

	// Ambil daftar 4 anggota untuk setiap tim
	for i := range teams {
		memberRows, err := h.DB.Query(`
			SELECT id, team_id, slot_number, character_id, psychube_id
			FROM team_members
			WHERE team_id = ?
			ORDER BY slot_number ASC
		`, teams[i].ID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var members []models.TeamMember
		for memberRows.Next() {
			var m models.TeamMember
			if err := memberRows.Scan(&m.ID, &m.TeamID, &m.SlotNumber, &m.CharacterID, &m.PsychubeID); err != nil {
				memberRows.Close()
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			members = append(members, m)
		}
		memberRows.Close()

		if members == nil {
			members = []models.TeamMember{}
		}
		teams[i].Members = members
	}

	if teams == nil {
		teams = []models.Team{}
	}
	writeJSON(w, http.StatusOK, teams)
}

func (h *APIHandler) CreateTeam(w http.ResponseWriter, r *http.Request) {
	var req models.Team
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON tidak valid: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.TuningSkill == "" {
		req.TuningSkill = "First Melody"
	}

	// Gunakan Database Transaction (tx) agar penyimpanan ke tabel teams dan team_members
	// berjalan sebagai satu kesatuan (jika salah satu gagal, semuanya dibatalkan/Rollback).
	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	res, err := tx.Exec(`
		INSERT INTO teams (name, archetype, target_boss, tuning_skill, notes)
		VALUES (?, ?, ?, ?, ?)
	`, req.Name, req.Archetype, req.TargetBoss, req.TuningSkill, req.Notes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	teamID, err := res.LastInsertId()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, m := range req.Members {
		if m.CharacterID == "" {
			continue
		}
		_, err := tx.Exec(`
			INSERT INTO team_members (team_id, slot_number, character_id, psychube_id)
			VALUES (?, ?, ?, ?)
		`, teamID, m.SlotNumber, m.CharacterID, m.PsychubeID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "created",
		"team_id": teamID,
		"message": "Tim berhasil disimpan!",
	})
}

func (h *APIHandler) DeleteTeam(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID tim tidak valid", http.StatusBadRequest)
		return
	}

	if _, err := h.DB.Exec(`DELETE FROM teams WHERE id = ?`, id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "deleted",
		"message": "Tim berhasil dihapus.",
	})
}

// ============================================================================
// 5. SMART TEAM RECOMMENDER (GET /api/recommendations)
// ============================================================================

// isStrongAgainst mengecek siklus keunggulan elemen (Afflatus Advantage 1.3x) di Reverse: 1999:
// Beast -> Plant -> Star -> Mineral -> Beast, serta Spirit <-> Intellect.
func isStrongAgainst(attackerAfflatus, enemyAfflatus string) bool {
	switch attackerAfflatus {
	case "Beast":
		return enemyAfflatus == "Plant"
	case "Plant":
		return enemyAfflatus == "Star"
	case "Star":
		return enemyAfflatus == "Mineral"
	case "Mineral":
		return enemyAfflatus == "Beast"
	case "Spirit":
		return enemyAfflatus == "Intellect"
	case "Intellect":
		return enemyAfflatus == "Spirit"
	default:
		return false
	}
}

// RecommendTeam menganalisis koleksi karakter pemain (atau seluruh master data jika parameter use_all=true)
// dan menyusun komposisi 4 slot ideal berdasarkan Archetype & Kelemahan Afflatus Musuh.
func (h *APIHandler) RecommendTeam(w http.ResponseWriter, r *http.Request) {
	targetArchetype := r.URL.Query().Get("archetype")
	enemyAfflatus := r.URL.Query().Get("enemy_afflatus")
	onlyOwned := r.URL.Query().Get("only_owned") != "false"

	// Ambil kandidat karakter (prioritaskan dari user_roster jika only_owned=true)
	query := `
		SELECT c.id, c.name, c.rarity, c.afflatus, c.damage_type, c.role, c.archetype,
		       c.tier, c.has_euphoria, c.best_psychube_id, c.resonance_focus, c.best_pattern,
		       c.image_url, c.description, c.base_atk, c.base_hp, c.base_reality_def,
		       c.base_mental_def, c.base_technique
		FROM characters c
	`
	if onlyOwned {
		query += ` INNER JOIN user_roster ur ON c.id = ur.character_id`
	}

	rows, err := h.DB.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var pool []models.Character
	for rows.Next() {
		var c models.Character
		var hasEuph int
		if err := rows.Scan(
			&c.ID, &c.Name, &c.Rarity, &c.Afflatus, &c.DamageType, &c.Role, &c.Archetype,
			&c.Tier, &hasEuph, &c.BestPsychubeID, &c.ResonanceFocus, &c.BestPattern,
			&c.ImageURL, &c.Description, &c.BaseATK, &c.BaseHP, &c.BaseRealityDEF,
			&c.BaseMentalDEF, &c.BaseTechnique,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		c.HasEuphoria = (hasEuph == 1)
		pool = append(pool, c)
	}

	type RecommendedSlot struct {
		SlotNumber        int              `json:"slot_number"`
		SlotLabel         string           `json:"slot_label"`
		Character         models.Character `json:"character"`
		RecommendedCubeID string           `json:"recommended_psychube_id"`
		AfflatusAdvantage bool             `json:"afflatus_advantage"`
		Reason            string           `json:"reason"`
	}

	used := make(map[string]bool)
	var slots []RecommendedSlot

	// Helper untuk memilih karakter dengan skor kecocokan tertinggi untuk sebuah peran
	pickBest := func(desiredRoles []string, slotNum int, slotLabel string) {
		bestIdx := -1
		bestScore := -999

		for i, c := range pool {
			if used[c.ID] {
				continue
			}

			score := 0
			// 1. Kecocokan Role
			roleMatched := false
			for _, dr := range desiredRoles {
				if c.Role == dr {
					roleMatched = true
					score += 40
					break
				}
			}
			if !roleMatched {
				score -= 20
			}

			// 2. Kecocokan Archetype (misal Dynamo)
			if targetArchetype != "" && c.Archetype == targetArchetype {
				score += 50
			}

			// 3. Keunggulan Afflatus (1.3x DMG terhadap musuh)
			if enemyAfflatus != "" && isStrongAgainst(c.Afflatus, enemyAfflatus) {
				score += 35
			}

			// 4. Skor Tier & Rarity
			switch c.Tier {
			case "S+":
				score += 25
			case "S":
				score += 20
			case "A":
				score += 12
			default:
				score += 5
			}
			score += c.Rarity * 2

			if score > bestScore {
				bestScore = score
				bestIdx = i
			}
		}

		if bestIdx >= 0 {
			chosen := pool[bestIdx]
			used[chosen.ID] = true
			adv := enemyAfflatus != "" && isStrongAgainst(chosen.Afflatus, enemyAfflatus)

			reason := "Cocok sebagai " + slotLabel + " (" + chosen.Archetype + ")"
			if adv {
				reason += " + Unggul Afflatus 1.3x vs " + enemyAfflatus
			}

			slots = append(slots, RecommendedSlot{
				SlotNumber:        slotNum,
				SlotLabel:         slotLabel,
				Character:         chosen,
				RecommendedCubeID: chosen.BestPsychubeID,
				AfflatusAdvantage: adv,
				Reason:            reason,
			})
		}
	}

	// Urutan pemilihan 4 slot standar Reverse: 1999:
	// Slot 1: Main Carry (Damage Dealer)
	pickBest([]string{"Damage Dealer"}, 1, "Main DPS (Carry)")
	// Slot 2: Sub Carry / Enabler
	pickBest([]string{"Sub Carry", "Support"}, 2, "Sub-Carry / Enabler")
	// Slot 3: Survival (Healer / Shielder)
	pickBest([]string{"Survival"}, 3, "Sustain (Healer/Shielder)")
	// Slot 4: Substitute / Amplifier (Support / Sub Carry)
	pickBest([]string{"Support", "Sub Carry", "Damage Dealer"}, 4, "4th Slot / Flex Support")

	writeJSON(w, http.StatusOK, map[string]any{
		"archetype":      targetArchetype,
		"enemy_afflatus": enemyAfflatus,
		"only_owned":     onlyOwned,
		"total_pool":     len(pool),
		"recommended":    slots,
	})
}

// ============================================================================
// 6. ENDPOINT RESONANCE PRESETS (GET & POST /api/resonance-presets)
// ============================================================================

func (h *APIHandler) GetResonancePresets(w http.ResponseWriter, r *http.Request) {
	charID := r.URL.Query().Get("character_id")

	query := `
		SELECT id, character_id, preset_name, resonance_level, pattern, stat_focus, grid_json
		FROM resonance_presets
		WHERE 1=1
	`
	var args []any
	if charID != "" {
		query += ` AND character_id = ?`
		args = append(args, charID)
	}
	query += ` ORDER BY resonance_level DESC, id ASC`

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var presets []models.ResonancePreset
	for rows.Next() {
		var p models.ResonancePreset
		if err := rows.Scan(&p.ID, &p.CharacterID, &p.PresetName, &p.ResonanceLevel, &p.Pattern, &p.StatFocus, &p.GridJSON); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		presets = append(presets, p)
	}

	if presets == nil {
		presets = []models.ResonancePreset{}
	}
	writeJSON(w, http.StatusOK, presets)
}

func (h *APIHandler) CreateResonancePreset(w http.ResponseWriter, r *http.Request) {
	var req models.ResonancePreset
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON tidak valid: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.ResonanceLevel < 1 {
		req.ResonanceLevel = 10
	}
	if req.Pattern == "" {
		req.Pattern = "Placidity"
	}
	if req.GridJSON == "" {
		req.GridJSON = "[]"
	}

	res, err := h.DB.Exec(`
		INSERT INTO resonance_presets (character_id, preset_name, resonance_level, pattern, stat_focus, grid_json)
		VALUES (?, ?, ?, ?, ?, ?)
	`, req.CharacterID, req.PresetName, req.ResonanceLevel, req.Pattern, req.StatFocus, req.GridJSON)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	writeJSON(w, http.StatusCreated, map[string]any{
		"status": "saved",
		"id":     id,
	})
}
