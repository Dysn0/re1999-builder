package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/http/cgi"
	"os"
	"strings"

	"re1999-backend/internal/database"
	"re1999-backend/internal/handlers"
)

// enableCORS adalah middleware sederhana agar Frontend React (port 5173)
// diizinkan memanggil API Backend Go (port 8080) oleh browser.
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Jika dipanggil lewat Apache CGI rewrite (/api.cgi/api/...), rapikan path-nya:
		if strings.HasPrefix(r.URL.Path, "/api.cgi") {
			r.URL.Path = strings.TrimPrefix(r.URL.Path, "/api.cgi")
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	seedOnly := flag.Bool("seed-only", false, "Jalankan seeding database lalu keluar")
	flag.Parse()

	// 1. Hubungkan ke database SQLite dan buat tabel jika belum ada
	dbPath := "./data/r1999.db"
	db, err := database.Connect(dbPath)
	if err != nil {
		log.Fatalf("Gagal menginisialisasi database: %v", err)
	}
	defer db.Close()

	// 2. Jalankan Seeding Data Master (Karakter, Psychubes, Preset Resonance, & Tim Dynamo Awal)
	if err := database.Seed(db); err != nil {
		log.Fatalf("Gagal melakukan seeding data awal: %v", err)
	}

	isCGI := os.Getenv("GATEWAY_INTERFACE") != ""
	if !isCGI {
		fmt.Println("✅ Database SQLite terhubung & data master Reverse: 1999 (termasuk Tim Dynamo) telah siap!")
	}
	if *seedOnly {
		return
	}

	// 3. Buat instance APIHandler yang memegang koneksi database
	api := handlers.NewAPIHandler(db)

	// 4. Daftarkan seluruh rute REST API menggunakan http.NewServeMux()
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		var charCount, cubeCount, rosterCount int
		_ = db.QueryRow(`SELECT COUNT(*) FROM characters`).Scan(&charCount)
		_ = db.QueryRow(`SELECT COUNT(*) FROM psychubes`).Scan(&cubeCount)
		_ = db.QueryRow(`SELECT COUNT(*) FROM user_roster`).Scan(&rosterCount)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":           "ok",
			"phase":            "Production Ready",
			"characters_count": charCount,
			"psychubes_count":  cubeCount,
			"roster_count":     rosterCount,
		})
	})

	// Master Data Endpoints
	mux.HandleFunc("GET /api/characters", api.GetCharacters)
	mux.HandleFunc("GET /api/psychubes", api.GetPsychubes)

	// User Roster (Koleksi Karakter Pemain) CRUD Endpoints
	mux.HandleFunc("GET /api/roster", api.GetRoster)
	mux.HandleFunc("POST /api/roster", api.UpsertRoster)
	mux.HandleFunc("DELETE /api/roster/{character_id}", api.DeleteRoster)

	// Teams & Smart Team Recommender Endpoints
	mux.HandleFunc("GET /api/teams", api.GetTeams)
	mux.HandleFunc("POST /api/teams", api.CreateTeam)
	mux.HandleFunc("DELETE /api/teams/{id}", api.DeleteTeam)
	mux.HandleFunc("GET /api/recommendations", api.RecommendTeam)

	// Resonance Presets Endpoints
	mux.HandleFunc("GET /api/resonance-presets", api.GetResonancePresets)
	mux.HandleFunc("POST /api/resonance-presets", api.CreateResonancePreset)

	// Jika dipanggil oleh Apache cPanel sebagai CGI script, layani langsung via CGI:
	if isCGI {
		if err := cgi.Serve(enableCORS(mux)); err != nil {
			log.Fatalf("CGI error: %v", err)
		}
		return
	}

	// 5. Jalankan server HTTP (default port 8080, atau sesuai variabel environment PORT)
	port := ":8080"
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = ":" + envPort
	}
	fmt.Printf("🚀 Server Backend Go berjalan di http://localhost%s\n", port)
	fmt.Println("   - Cek status:        http://localhost:8080/api/health")
	fmt.Println("   - Daftar karakter:   http://localhost:8080/api/characters")
	fmt.Println("   - Filter Dynamo:     http://localhost:8080/api/characters?archetype=Dynamo")
	fmt.Println("   - Koleksi Anda:      http://localhost:8080/api/roster")
	fmt.Println("   - Saran Tim Dynamo:  http://localhost:8080/api/recommendations?archetype=Dynamo")

	if err := http.ListenAndServe(port, enableCORS(mux)); err != nil {
		log.Fatalf("Server berhenti: %v", err)
	}
}
