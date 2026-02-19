# Architektura autentykacji w SPA — OAuth 2.0 / RFC 9700

## Schemat ogólny

```
LOGOWANIE / REJESTRACJA
──────────────────────────────────────────────────────────────
  Angular (SPA)                         .NET API (Backend)
  ─────────────                         ──────────────────
  POST /account/login          ──►      Weryfikacja danych
                                        GenerateToken()
                                        GenerateRefreshToken()
                               ◄──      Body:    { user, accessToken }
                                        Cookie:  refreshToken (HttpOnly)

  signal<User> = user ✓
  Authorization header = Bearer <accessToken>
```

---

## Gdzie trzymamy tokeny i dlaczego

### Access Token → pamięć RAM (Angular Signal)

```typescript
currentUser = signal<User | null>(null); // access token żyje tutaj
```

- **Żywotność:** krótka (7–15 minut)
- **Dostęp JS:** tak, ale tylko własny kod aplikacji
- **Giną po:** odświeżeniu strony → celowo (patrz niżej)
- **Nie w localStorage:** bo każdy skrypt na stronie mógłby go ukraść (XSS)

### Refresh Token → HttpOnly Cookie (przeglądarka)

```
Set-Cookie: refreshToken=abc123; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

| Atrybut | Znaczenie |
|---|---|
| `HttpOnly` | JavaScript **w ogóle nie może** go odczytać — bezpieczny na XSS |
| `Secure` | Wysyłany **tylko przez HTTPS** |
| `SameSite=Strict` | Wysyłany tylko przy requestach z tej samej domeny — blokuje CSRF |
| `Max-Age=604800` | Żyje 7 dni w przeglądarce |

---

## Dlaczego NIE trzymamy access tokenu w cookie?

Pozornie kuszące — przeglądarka sama by go wysyłała. Problem: **CSRF**.

```
ATAK CSRF (Cross-Site Request Forgery):
─────────────────────────────────────────────────────
  Użytkownik odwiedza złośliwą stronę evil.com
  evil.com wykonuje: POST https://twoja-api.com/transfer-money
  Przeglądarka automatycznie dołącza WSZYSTKIE cookie dla twoja-api.com
  API dostaje request z ważnym access tokenem → wykonuje operację ✗
```

Natomiast **nagłówek `Authorization: Bearer`** jest **ręcznie dodawany przez JavaScript** — złośliwa strona nie może go dołączyć bez dostępu do tokenu.

```
Z access tokenem w pamięci:
─────────────────────────────────────────────────────
  evil.com wykonuje: POST https://twoja-api.com/transfer-money
  Przeglądarka NIE dołącza Authorization header (nie ma dostępu do pamięci Angular)
  API odrzuca request — brak tokenu ✓
```

---

## Dlaczego access token ginie po odświeżeniu strony?

To **zamierzone zachowanie** — nie bug. RAM przeglądarki jest czyszczony przy każdym odświeżeniu. Aplikacja nie traci sesji, bo ma mechanizm odtwarzania:

```
PAGE REFRESH — co się dzieje krok po kroku:
──────────────────────────────────────────────────────────────
  1. Angular startuje od zera
  2. APP_INITIALIZER uruchamia refreshUserByRefreshToken()
     PRZED inicjalizacją routera i guardów
  3. POST /account/refresh-token
     → przeglądarka automatycznie dołącza cookie refreshToken (HttpOnly)
  4. Backend weryfikuje refresh token w bazie danych
  5. Generuje nowy access token + nowy refresh token (rotacja!)
  6. Angular otrzymuje nowy access token → ustawia signal
  7. Router startuje → guard widzi zalogowanego użytkownika ✓
```

---

## Rotacja Refresh Tokenów

Każde użycie refresh tokenu generuje **nowy refresh token**. Stary jest unieważniany.

```
Dlaczego to ważne?
──────────────────
  Jeśli atakujący skradnie refresh token (np. przez MITM),
  a użytkownik odświeży stronę PRZED atakującym:
  → stary token jest już unieważniony
  → atakujący dostaje 401 Unauthorized
  → możemy wykryć próbę kradzieży i wylogować wszystkie sesje
```

```csharp
// Backend — każde użycie refresh tokenu generuje nowy
var refreshToken = tokenService.GenerateRefreshToken(); // nowy losowy token
user.RefreshToken = refreshToken;                        // stary nadpisany
user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
await userManager.UpdateAsync(user);
```

---

## Automatyczne odświeżanie Access Tokenu

Access token żyje 7 minut. Aby użytkownik nie był wylogowywany co 7 minut:

```
TIMELINE:
──────────────────────────────────────────────────────────────
  t=0:00  Logowanie → access token (ważny 7 min) + refresh token (7 dni)
  t=5:00  startTokenRefreshInterval() → POST /refresh-token (co 5 minut)
           → nowy access token + nowy refresh token
  t=10:00 Kolejne odświeżenie tokenów
  t=7dni  Refresh token wygasł → użytkownik musi się zalogować ponownie
```

```typescript
// Angular — interwał działa w tle przez cały czas sesji
startTokenRefreshInterval() {
  setInterval(() => {
    this.refreshToken().subscribe({
      next: (user) => this.setCurrentUser(user),
      error: () => this.logout() // refresh token wygasł → wyloguj
    });
  }, 5 * 60 * 1000); // co 5 minut
}
```

---

## Porównanie podejść

| | Access token w pamięci + RT w cookie | Oba tokeny w cookie | Oba tokeny w localStorage |
|---|:---:|:---:|:---:|
| Bezpieczny na XSS | ✅ | ✅ | ❌ |
| Bezpieczny na CSRF | ✅ | ❌ (wymaga anti-CSRF) | ✅ |
| Przeżywa page refresh | ❌ → ✅ (przez RT) | ✅ | ✅ |
| Rekomendowany przez OAuth 2.0 | ✅ **RFC 9700** | ➖ | ❌ |
| Złożoność | niska | wysoka | niska |

---

## Implementacja w tej aplikacji

```
client/src/
├── app/app.config.ts
│   └── provideAppInitializer()          ← odtwarza sesję PRZED routerem
│
├── core/
│   ├── services/account-service.ts
│   │   ├── currentUser signal           ← access token w pamięci
│   │   ├── refreshUserByRefreshToken()  ← używany przy page refresh
│   │   ├── startTokenRefreshInterval()  ← odświeża co 5 min
│   │   └── logout()                     ← czyści signal
│   │
│   └── interceptors/jwt-interceptor.ts
│       └── Authorization: Bearer        ← dodaje token do każdego requestu
│
API/
├── Controllers/AccountController.cs
│   ├── POST /login                      ← zwraca token + ustawia cookie
│   ├── POST /register                   ← j.w.
│   └── POST /refresh-token              ← weryfikuje cookie, rotuje tokeny
│
└── Services/TokenService.cs
    ├── CreateToken()                    ← JWT ważny 7 minut
    └── GenerateRefreshToken()           ← losowe 64 bajty (kryptograficzne)
```

---

## Źródła

- [RFC 9700 — Best Practices for OAuth 2.0 in Browser-Based Applications](https://datatracker.ietf.org/doc/html/rfc9700)
- [OWASP — Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN — SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#samesite_attribute)
