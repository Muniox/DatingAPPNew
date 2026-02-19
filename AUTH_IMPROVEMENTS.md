# Auth Security Improvements

## Priority 1 — Memory leak `setInterval` (bug)

**Plik:** `client/src/core/services/account-service.ts`

Każde wywołanie `startTokenRefreshInterval()` tworzy nowy `setInterval`, ale stary nigdy nie jest kasowany.
Po kilku login/refresh w jednej sesji działa wiele interwałów równolegle — każdy wysyła requesty do `/refresh-token`.

**Fix:** Przechowywać ID interwału i czyścić go przed utworzeniem nowego oraz przy logout.

---

## Priority 2 — User enumeration w login (security)

**Plik:** `API/Controllers/AccountController.cs` linie 64-68

Osobne komunikaty "Invalid email address" i "Invalid password" pozwalają atakującemu ustalić, czy konto o danym emailu istnieje w systemie.

**Fix:** Zwracać ten sam komunikat niezależnie od tego, czy email istnieje, czy hasło jest błędne:
`"Invalid email or password"`

---

## Priority 3 — Brak revoke refresh token przy logout (security)

**Plik:** `API/Controllers/AccountController.cs` + `client/src/core/services/account-service.ts`

Przy logout Angular czyści stan po stronie klienta, ale cookie z refresh tokenem nadal jest ważne przez 7 dni.
Ktoś kto przechwyci cookie może go użyć do uzyskania nowego access tokena.

**Fix:** Dodać endpoint `POST /api/account/revoke-token`, który:
- Odczytuje refresh token z cookie
- Ustawia `RefreshToken = null` i `RefreshTokenExpiry = null` w bazie
- Usuwa cookie z odpowiedzi

Angular przy logout powinien wywołać ten endpoint przed wyczyszczeniem stanu.

---

## Priority 4 — SameSite=Strict blokuje cookie po redirect (UX)

**Plik:** `API/Controllers/AccountController.cs` linia 104

`SameSite=Strict` nie wysyła cookie przy pierwszym request po redirect z zewnętrznego źródła (email, Google, social media link). Użytkownik musi odświeżyć stronę, żeby cookie zostało wysłane.

**Fix:** Zmienić na `SameSite=Lax` — cookie jest wysyłane przy nawigacji top-level (kliknięcie linka), ale nie przy cross-site subrequests (obrazki, iframe). To wystarczająca ochrona przed CSRF dla refresh tokena.
