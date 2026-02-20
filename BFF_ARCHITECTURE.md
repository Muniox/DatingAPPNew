# BFF (Backend For Frontend) — ArchitekturaAuth z Keycloak

## Czym jest BFF

BFF to wzorzec, w którym .NET API pełni rolę pośrednika między Angular (SPA) a Keycloak (Identity Provider).
Angular nigdy nie komunikuje się z Keycloak bezpośrednio i nigdy nie widzi żadnych tokenów.

---

## Schemat komunikacji

```
Przeglądarka (Angular)              .NET (BFF)                  Keycloak
       │                                │                           │
       │── request + session cookie ───→│                           │
       │                                │── Bearer access_token ───→│
       │                                │                           │
       │← response ────────────────────│← response ────────────────│
```

---

## Flow logowania

1. Angular → `GET /api/auth/login` → .NET redirectuje przeglądarkę do Keycloak
2. Użytkownik loguje się na stronie Keycloak (formularz Keycloak, nie Angular)
3. Keycloak redirectuje z powrotem do .NET z `authorization_code`
4. .NET wymienia code na tokeny (access + refresh) **server-to-server** — przeglądarka tego nie widzi
5. .NET zapisuje tokeny **w sesji po stronie serwera**
6. .NET wysyła do przeglądarki **tylko HttpOnly session cookie**
7. Angular przy każdym request wysyła cookie automatycznie → .NET dokłada `Authorization: Bearer` do requestów downstream

---

## Gdzie są tokeny

| Token          | Gdzie jest               | Przeglądarka widzi? |
|----------------|--------------------------|---------------------|
| Access token   | pamięć/sesja .NET        | nie                 |
| Refresh token  | pamięć/sesja .NET        | nie                 |
| Session cookie | HttpOnly cookie          | nie może odczytać (HttpOnly) |

Przeglądarka posiada **tylko jedno HttpOnly session cookie** — to jedyny "dowód tożsamości".
JavaScript nie ma dostępu do żadnego tokena.

---

## Jak Angular otrzymuje dane użytkownika

Angular nie dekoduje tokena (bo go nie ma). Zamiast tego pyta .NET o dane:

```
Angular                              .NET (BFF)
   │                                    │
   │── GET /api/auth/me + cookie ──────→│  ← .NET odczytuje sesję/claims
   │                                    │
   │← { name, email, roles } ──────────│  ← zwraca dane z tokena
```

### Endpoint w .NET

```csharp
[Authorize]
[HttpGet("me")]
public IActionResult GetCurrentUser()
{
    return Ok(new
    {
        Email = User.FindFirstValue(ClaimTypes.Email),
        Name = User.FindFirstValue(ClaimTypes.Name),
        Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value)
    });
}
```

`User.Claims` jest dostępny, bo .NET odczytał session cookie i wie kim jest użytkownik.

### Angular — przechowywanie danych

Dane użytkownika trzymane są w pamięci (signal):

```typescript
this.http.get<UserInfo>('/api/auth/me', { withCredentials: true })
  .subscribe(user => {
    this.currentUser.set(user);
  });
```

Po odświeżeniu strony dane giną z RAM — Angular ponownie wywołuje `/api/auth/me`,
a session cookie leci automatycznie, więc .NET wie kim jest użytkownik.

---

## Konfiguracja .NET (Program.cs)

```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.Secure = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
})
.AddOpenIdConnect(options =>
{
    options.Authority = "https://keycloak.example.com/realms/my-realm";
    options.ClientId = "my-bff";
    options.ClientSecret = "secret";           // bezpieczny, bo server-side
    options.ResponseType = "code";              // Authorization Code Flow
    options.SaveTokens = true;                  // tokeny w sesji, nie w przeglądarce
    options.GetClaimsFromUserInfoEndpoint = true;
});
```

---

## Angular — konfiguracja

Angular nie zna Keycloak. Widzi tylko swoje API:

```typescript
login() {
  window.location.href = '/api/auth/login';  // redirect do .NET → Keycloak
}

getMembers() {
  return this.http.get('/api/members', { withCredentials: true });
}

logout() {
  window.location.href = '/api/auth/logout';
}
```

Nie ma interceptora JWT — cookie leci automatycznie.

---

## Porównanie podejść

### Angular → Keycloak bezpośrednio (public client)

- Angular jest public client — nie może przechować `client_secret`
- Tokeny w przeglądarce — podatne na XSS
- Refresh token w localStorage lub pamięci
- Popularne historycznie (Implicit Flow / PKCE), ale odchodzi się od tego

### .NET jako BFF (zalecane)

- Angular nigdy nie widzi tokenów
- `client_secret` bezpieczny na serwerze
- Refresh token na serwerze
- Przeglądarka ma tylko HttpOnly session cookie
- Zgodne z OAuth 2.0 for Browser-Based Apps (aktualny draft RFC)

| Aspekt                   | Angular → Keycloak | .NET BFF          |
|--------------------------|--------------------|-------------------|
| Tokeny w przeglądarce    | tak                | nie               |
| XSS kradnie tokeny       | możliwe            | niemożliwe        |
| Client secret            | brak (public)      | bezpieczny        |
| Refresh token            | w przeglądarce     | na serwerze       |
| Kto dodaje Bearer header | Angular interceptor | .NET middleware   |
| OAuth best practice 2024+| odchodzi się       | zalecane          |

---

## Porównanie z obecnym flow w projekcie (JWT + refresh cookie)

| Aspekt                | Obecny flow                          | BFF z Keycloak                |
|-----------------------|--------------------------------------|-------------------------------|
| Access token          | Angular trzyma w RAM (signal)        | .NET trzyma w sesji           |
| Refresh token         | HttpOnly cookie                      | .NET trzyma w sesji           |
| Co ma przeglądarka    | access token w pamięci + cookie      | tylko session cookie           |
| Kto dodaje Bearer     | Angular (jwt interceptor)            | .NET (middleware)             |
| Identity Provider     | własny (Identity + JWT)              | Keycloak (zewnętrzny)        |
| Dane użytkownika      | dekodowanie JWT w Angular            | GET /api/auth/me              |
| Po odświeżeniu strony | POST /refresh-token → nowy JWT       | GET /api/auth/me (cookie)     |
