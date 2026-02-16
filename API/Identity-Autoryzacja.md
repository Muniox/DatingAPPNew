# ASP.NET Core Identity — Mechanizmy Autoryzacji

## 1. Role (Roles)

Najprostszy mechanizm autoryzacji. Użytkownik jest przypisywany do jednej lub wielu grup (ról), a dostęp do zasobów jest kontrolowany na podstawie przynależności do danej roli.

### Konfiguracja ról

```csharp
// Program.cs — dodanie ról do Identity
builder.Services.AddIdentityCore<AppUser>()
    .AddRoles<AppRole>()
    .AddRoleManager<RoleManager<AppRole>>()
    .AddEntityFrameworkStores<DataContext>();
```

### Tworzenie ról

```csharp
// Seed danych — tworzenie ról przy starcie aplikacji
var roleManager = serviceProvider.GetRequiredService<RoleManager<AppRole>>();

string[] roles = { "Admin", "Moderator", "Member" };
foreach (var role in roles)
{
    if (!await roleManager.RoleExistsAsync(role))
        await roleManager.CreateAsync(new AppRole { Name = role });
}
```

### Przypisywanie ról do użytkownika

```csharp
// Za pomocą UserManager
await userManager.AddToRoleAsync(user, "Member");
await userManager.AddToRolesAsync(user, new[] { "Admin", "Moderator" });

// Sprawdzanie roli
bool isAdmin = await userManager.IsInRoleAsync(user, "Admin");

// Pobieranie ról użytkownika
var roles = await userManager.GetRolesAsync(user);
```

### Użycie w kontrolerach

```csharp
[Authorize(Roles = "Admin")]
public IActionResult AdminPanel() { ... }

[Authorize(Roles = "Admin,Moderator")]  // Admin LUB Moderator
public IActionResult ModeratorPanel() { ... }
```

---

## 2. Roszczenia (Claims)

Claims to pary klucz-wartość przechowujące informacje o użytkowniku (np. email, wiek, uprawnienia). Są osadzane w tokenie JWT lub cookie i dostępne w każdym żądaniu HTTP.

### Standardowe typy claims

| Typ | Opis |
|---|---|
| `ClaimTypes.Name` | Nazwa użytkownika |
| `ClaimTypes.Email` | Adres email |
| `ClaimTypes.NameIdentifier` | Unikalny identyfikator (ID) |
| `ClaimTypes.Role` | Rola użytkownika |
| `ClaimTypes.DateOfBirth` | Data urodzenia |

### Dodawanie claims do tokenu JWT

```csharp
var claims = new List<Claim>
{
    new Claim(ClaimTypes.Email, user.Email!),
    new Claim(ClaimTypes.NameIdentifier, user.Id),
    new Claim("Department", "IT"),           // Własny claim
    new Claim("Permission", "CanEditPosts")  // Własny claim
};
```

### Zarządzanie claims użytkownika (w bazie danych)

```csharp
// Dodawanie
await userManager.AddClaimAsync(user, new Claim("Permission", "CanEditPosts"));

// Usuwanie
await userManager.RemoveClaimAsync(user, claim);

// Pobieranie
var claims = await userManager.GetClaimsAsync(user);
```

### Odczytywanie claims w kontrolerze

```csharp
// Pobranie wartości claim z aktualnie zalogowanego użytkownika
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
var email = User.FindFirst(ClaimTypes.Email)?.Value;
```

---

## 3. Polityki (Policies)

Polityki pozwalają definiować złożone reguły autoryzacji łączące role, claims i inne warunki. Definiuje się je centralnie w `Program.cs`.

### Definiowanie polityk

```csharp
builder.Services.AddAuthorizationBuilder()
    // Polityka wymagająca roli
    .AddPolicy("RequireAdminRole", policy =>
        policy.RequireRole("Admin"))

    // Polityka wymagająca jednej z kilku ról
    .AddPolicy("RequireModeratorRole", policy =>
        policy.RequireRole("Admin", "Moderator"))

    // Polityka wymagająca konkretnego claim
    .AddPolicy("RequireEmailVerified", policy =>
        policy.RequireClaim("EmailVerified", "true"))

    // Polityka łącząca wiele warunków (AND — wszystkie muszą być spełnione)
    .AddPolicy("FullAccess", policy =>
        policy.RequireRole("Admin")
              .RequireClaim("Permission", "CanEditPosts")
              .RequireAuthenticatedUser());
```

### Użycie w kontrolerach

```csharp
[Authorize(Policy = "RequireAdminRole")]
public IActionResult AdminOnly() { ... }

[Authorize(Policy = "FullAccess")]
public IActionResult RestrictedAction() { ... }
```

---

## 4. Wymagania i handlery (Requirements + Handlers)

Najbardziej zaawansowany mechanizm — pozwala tworzyć własną logikę autoryzacji, np. sprawdzanie wieku, własności zasobu, limitu operacji itp.

### Krok 1: Definicja wymagania

```csharp
using Microsoft.AspNetCore.Authorization;

public class MinimumAgeRequirement(int minimumAge) : IAuthorizationRequirement
{
    public int MinimumAge { get; } = minimumAge;
}
```

### Krok 2: Implementacja handlera

```csharp
public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinimumAgeRequirement requirement)
    {
        var dateOfBirthClaim = context.User.FindFirst(ClaimTypes.DateOfBirth);

        if (dateOfBirthClaim is null)
            return Task.CompletedTask; // Brak claim = brak autoryzacji

        var dateOfBirth = DateTime.Parse(dateOfBirthClaim.Value);
        var age = DateTime.Today.Year - dateOfBirth.Year;

        if (age >= requirement.MinimumAge)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
```

### Krok 3: Rejestracja w Program.cs

```csharp
// Rejestracja handlera
builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();

// Dodanie polityki korzystającej z wymagania
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("AtLeast18", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(18)));
```

### Przykład: Autoryzacja oparta na własności zasobu

```csharp
public class ResourceOwnerRequirement : IAuthorizationRequirement { }

public class ResourceOwnerHandler : AuthorizationHandler<ResourceOwnerRequirement, Post>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ResourceOwnerRequirement requirement,
        Post resource)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == resource.AuthorId)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
```

---

## 5. Schematy uwierzytelniania (Authentication Schemes)

Schematy określają w jaki sposób użytkownik jest uwierzytelniany (JWT, Cookie, OAuth itp.). Można używać wielu schematów jednocześnie.

### Konfiguracja JWT Bearer

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var tokenKey = config["TokenKey"] ?? throw new Exception("TokenKey not found");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });
```

---

## 6. Filtry autoryzacji (Authorization Filters)

Pozwalają stosować autoryzację na poziomie kontrolera lub akcji z dodatkową logiką.

```csharp
// Wymaga uwierzytelnienia dla całego kontrolera
[Authorize]
public class UsersController : BaseApiController { ... }

// Zezwala na dostęp bez uwierzytelnienia dla konkretnej akcji
[AllowAnonymous]
public IActionResult GetPublicData() { ... }
```

---

## Podsumowanie

| Mechanizm | Złożoność | Kiedy używać |
|---|---|---|
| **Roles** | Prosta | Podział użytkowników na grupy (Admin, Moderator, Member) |
| **Claims** | Średnia | Przechowywanie atrybutów użytkownika w tokenie |
| **Policies** | Średnia | Łączenie wielu warunków autoryzacji w jedną regułę |
| **Requirements/Handlers** | Zaawansowana | Własna logika biznesowa (np. własność zasobu, limity) |
| **Authentication Schemes** | Średnia | Konfiguracja sposobu uwierzytelniania (JWT, Cookie) |
| **Authorization Filters** | Prosta | Stosowanie autoryzacji na poziomie kontrolerów i akcji |

### Hierarchia działania

```
Żądanie HTTP
  └── Authentication Scheme (KTO to jest? — weryfikacja tokenu/cookie)
        └── Authorization Filter ([Authorize] / [AllowAnonymous])
              └── Policy (CZY MA DOSTĘP? — sprawdzenie reguł)
                    ├── Role (czy należy do grupy?)
                    ├── Claims (czy ma wymagane atrybuty?)
                    └── Requirements/Handlers (czy spełnia warunki biznesowe?)
```
