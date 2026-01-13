# Backend API – Educode

Backend serwer dla platformy edukacyjnej z kursami, modułami, lekcjami oraz zadaniami (w tym automatyczną weryfikacją kodu).

Projekt został zbudowany w oparciu o **AdonisJS v6** i jest przeznaczony do pracy w połączeniu z aplikacją frontendową.

---

## 🚀 Główne funkcjonalności

* Autoryzacja i uwierzytelnianie użytkowników (role: `admin`, `user`, `pro`, `tester`)
* Zarządzanie kursami, modułami, lekcjami i zadaniami (CRUD)
* Obsługa różnych typów zadań (quiz, zadania z kodem itp.)
* Integracja z **Judge0 API** do sprawdzania kodu
* Śledzenie postępu użytkownika w kursach
* Logika panelu administracyjnego po stronie serwera

---

## 🧰 Stos technologiczny

* **Node.js**
* **AdonisJS v6**
* **TypeScript**
* **Lucid ORM**
* **MySQL** (WAMP Server)
* **Judge0 API** (uruchamianie i weryfikacja kodu)

---

## 📦 Wymagania

Przed instalacją upewnij się, że posiadasz:

* **Node.js** >= 18
* **WAMP Server** (Apache + MySQL)
* **npm** lub **yarn**
* **Klucz API do Judge0**

---

## ⚙️ Instalacja i uruchomienie

### 1️⃣ Klonowanie repozytorium

```bash
git clone https://github.com/bogdanisl/EduCode-Server
cd EduCode-Server
```

---

### 2️⃣ Instalacja zależności

```bash
npm install
```

---

### 3️⃣ Konfiguracja bazy danych (WAMP)

1. Uruchom **WAMP Server**
2. Utwórz bazę danych (np. `educode`)
3. Upewnij się, że MySQL działa poprawnie

---

### 4️⃣ Zmienne środowiskowe

Utwórz plik `.env` na podstawie `.env.example`:

```env
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_DATABASE=educode
SESSION_DRIVER=cookie
JUDGE0_RAPIDAPI_KEY=
JUDGE0_RAPIDAPI_URL=
JUDGE0_RAPIDAPI_HOST=
```

⚠️ **Bez poprawnego klucza API Judge0 zadania z kodem nie będą działać.**

### 🔗 Konfiguracja Judge0

Aby uzyskać klucz API oraz zapoznać się z dokumentacją, odwiedź oficjalną stronę Judge0:

👉 https://judge0.com  
👉 https://ce.judge0.com  

---
### 5️⃣ Migracje bazy danych

```bash
node ace migration:run
```

---

### 6️⃣ Uruchomienie serwera

```bash
node ace serve --watch
lub
npm run dev
```

Serwer będzie dostępny pod adresem:

```
http://localhost:3333
```

---


