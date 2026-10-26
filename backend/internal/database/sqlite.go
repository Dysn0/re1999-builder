package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	// Import driver SQLite pure-Go (tanpa CGO).
	// Tanda garis bawah (_) artinya kita melakukan "blank import":
	// kita tidak memanggil fungsi dari package ini secara langsung di kode,
	// melainkan membiarkan fungsi init() di dalamnya mendaftarkan driver "sqlite"
	// ke dalam package standar "database/sql" milik Go.
	_ "modernc.org/sqlite"
)

// Connect membuka koneksi ke file database SQLite dan menjalankan pembuatan tabel awal.
func Connect(dbPath string) (*sql.DB, error) {
	// 1. Pastikan folder tempat menyimpan file database (misal: "data/") sudah ada
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("gagal membuat direktori database: %w", err)
	}

	// 2. Buka koneksi menggunakan sql.Open("sqlite", dbPath)
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("gagal membuka koneksi sqlite: %w", err)
	}

	// 3. Uji koneksi ke file database dengan db.Ping()
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("gagal melakukan ping ke database: %w", err)
	}

	// 4. Aktifkan dukungan Foreign Key di SQLite (secara default SQLite menonaktifkannya)
	if _, err := db.Exec(`PRAGMA foreign_keys = ON;`); err != nil {
		return nil, fmt.Errorf("gagal mengaktifkan foreign keys: %w", err)
	}

	// 5. Jalankan pembuatan tabel (DDL Raw SQL)
	if err := createTables(db); err != nil {
		return nil, fmt.Errorf("gagal membuat tabel database: %w", err)
	}

	return db, nil
}

// createTables berisi kueri DDL (Data Definition Language) Raw SQL untuk membuat
// keenam tabel utama aplikasi Reverse: 1999 Builder jika belum ada.
func createTables(db *sql.DB) error {
	schema := `
	-- 1. Tabel Master Karakter (Arcanists)
	CREATE TABLE IF NOT EXISTS characters (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		rarity INTEGER NOT NULL CHECK(rarity BETWEEN 2 AND 6),
		afflatus TEXT NOT NULL,
		damage_type TEXT NOT NULL,
		role TEXT NOT NULL,
		archetype TEXT NOT NULL,
		tier TEXT NOT NULL,
		has_euphoria INTEGER NOT NULL DEFAULT 0,
		best_psychube_id TEXT NOT NULL DEFAULT '',
		resonance_focus TEXT NOT NULL DEFAULT '',
		best_pattern TEXT NOT NULL DEFAULT 'Placidity',
		image_url TEXT NOT NULL DEFAULT '',
		description TEXT NOT NULL DEFAULT '',
		base_atk INTEGER NOT NULL DEFAULT 1000,
		base_hp INTEGER NOT NULL DEFAULT 5000,
		base_reality_def INTEGER NOT NULL DEFAULT 400,
		base_mental_def INTEGER NOT NULL DEFAULT 400,
		base_technique INTEGER NOT NULL DEFAULT 250
	);

	-- 2. Tabel Master Psychubes (Senjata / Equipment)
	CREATE TABLE IF NOT EXISTS psychubes (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		rarity INTEGER NOT NULL CHECK(rarity BETWEEN 3 AND 6),
		engraving_stat TEXT NOT NULL,
		passive_summary TEXT NOT NULL,
		archetype_fit TEXT NOT NULL DEFAULT '',
		image_url TEXT NOT NULL DEFAULT '',
		base_atk INTEGER NOT NULL DEFAULT 360,
		base_hp INTEGER NOT NULL DEFAULT 2200,
		base_def INTEGER NOT NULL DEFAULT 160
	);

	-- 3. Tabel Koleksi Karakter Milik Pengguna (User Roster)
	CREATE TABLE IF NOT EXISTS user_roster (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		character_id TEXT NOT NULL UNIQUE,
		insight INTEGER NOT NULL DEFAULT 0 CHECK(insight BETWEEN 0 AND 3),
		level INTEGER NOT NULL DEFAULT 1 CHECK(level BETWEEN 1 AND 60),
		portray INTEGER NOT NULL DEFAULT 0 CHECK(portray BETWEEN 0 AND 5),
		resonance_level INTEGER NOT NULL DEFAULT 1 CHECK(resonance_level BETWEEN 1 AND 15),
		resonance_pattern TEXT NOT NULL DEFAULT 'Placidity',
		euphoria_unlocked INTEGER NOT NULL DEFAULT 0,
		equipped_psychube_id TEXT NOT NULL DEFAULT '',
		psychube_level INTEGER NOT NULL DEFAULT 1 CHECK(psychube_level BETWEEN 1 AND 60),
		psychube_amp INTEGER NOT NULL DEFAULT 1 CHECK(psychube_amp BETWEEN 1 AND 5),
		notes TEXT NOT NULL DEFAULT '',
		FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
	);

	-- 4. Tabel Tim Racikan Pengguna (Teams)
	CREATE TABLE IF NOT EXISTS teams (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		archetype TEXT NOT NULL DEFAULT 'General',
		target_boss TEXT NOT NULL DEFAULT '',
		tuning_skill TEXT NOT NULL DEFAULT 'First Melody',
		notes TEXT NOT NULL DEFAULT ''
	);

	-- 5. Tabel Anggota Tim (3 di Lapangan + 1 Substitute)
	CREATE TABLE IF NOT EXISTS team_members (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		team_id INTEGER NOT NULL,
		slot_number INTEGER NOT NULL CHECK(slot_number BETWEEN 1 AND 4),
		character_id TEXT NOT NULL,
		psychube_id TEXT NOT NULL DEFAULT '',
		FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
		FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
		UNIQUE(team_id, slot_number)
	);

	-- 6. Tabel Preset & Susunan Puzzle Resonance
	CREATE TABLE IF NOT EXISTS resonance_presets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		character_id TEXT NOT NULL,
		preset_name TEXT NOT NULL,
		resonance_level INTEGER NOT NULL DEFAULT 10 CHECK(resonance_level BETWEEN 1 AND 15),
		pattern TEXT NOT NULL DEFAULT 'Placidity',
		stat_focus TEXT NOT NULL DEFAULT '',
		grid_json TEXT NOT NULL DEFAULT '[]',
		FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
	);
	`

	_, err := db.Exec(schema)
	return err
}
