# Action Filters w ASP.NET Core

## Czym jest Action Filter?

Action Filter to mechanizm w ASP.NET Core, który pozwala wykonać kod **przed** i/lub **po** wykonaniu akcji kontrolera. Działa jak "przechwytywacz" (interceptor) w potoku przetwarzania żądania HTTP.

ASP.NET Core udostępnia kilka typów filtrów, m.in.:

| Typ filtra | Interfejs | Zastosowanie |
|---|---|---|
| Authorization Filter | `IAuthorizationFilter` | Sprawdzanie uprawnień |
| Resource Filter | `IResourceFilter` | Przetwarzanie przed i po model binding |
| **Action Filter** | **`IActionFilter` / `IAsyncActionFilter`** | **Logika przed/po wykonaniu akcji** |
| Exception Filter | `IExceptionFilter` | Obsługa wyjątków |
| Result Filter | `IResultFilter` | Przetwarzanie przed/po zwróceniu wyniku |

## Kolejność wykonywania

```
Żądanie HTTP
    └─> Authorization Filters
        └─> Resource Filters (przed)
            └─> Model Binding
                └─> Action Filters (przed)  ← tutaj działa nasz filtr
                    └─> Akcja kontrolera
                └─> Action Filters (po)     ← tutaj działa nasz filtr
            └─> Resource Filters (po)
└─> Odpowiedź HTTP
```

## Interfejs IAsyncActionFilter

```csharp
public interface IAsyncActionFilter
{
    Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next);
}
```

- `ActionExecutingContext context` — kontekst **przed** wykonaniem akcji (dostęp do parametrów, HttpContext, itp.)
- `ActionExecutionDelegate next` — delegat wywołujący kolejny filtr lub samą akcję kontrolera
- Wywołanie `await next()` uruchamia akcję i zwraca `ActionExecutedContext` (kontekst **po** wykonaniu)

## LogUserActivity — nasz Action Filter

### Cel

Automatyczne aktualizowanie pola `LastActive` zalogowanego użytkownika przy każdym żądaniu do API, bez konieczności powtarzania tej logiki w każdej akcji kontrolera.

### Implementacja

```csharp
public class LogUserActivity : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // 1. Najpierw wykonaj akcję kontrolera
        var resultContext = await next();

        // 2. Po wykonaniu akcji — sprawdź, czy użytkownik jest zalogowany
        if (context.HttpContext.User.Identity?.IsAuthenticated != true) return;

        // 3. Pobierz ID zalogowanego użytkownika z claims
        var memberId = resultContext.HttpContext.User.GetMemberId();

        // 4. Pobierz DbContext z kontenera DI
        var dbContext = resultContext.HttpContext.RequestServices
            .GetRequiredService<AppDbContext>();

        // 5. Zaktualizuj pole LastActive na bieżący czas UTC
        await dbContext.Members
            .Where(x => x.Id == memberId)
            .ExecuteUpdateAsync(setters =>
                setters.SetProperty(x => x.LastActive, DateTime.UtcNow));
    }
}
```

### Jak jest zarejestrowany

1. **Rejestracja w kontenerze DI** (`Program.cs`):

```csharp
builder.Services.AddScoped<LogUserActivity>();
```

2. **Nałożenie na kontrolery** za pomocą atrybutu `[ServiceFilter]`:

```csharp
[ServiceFilter(typeof(LogUserActivity))]
public class MembersController : ControllerBase { ... }

[ServiceFilter(typeof(LogUserActivity))]
public class AccountController : ControllerBase { ... }

[ServiceFilter(typeof(LogUserActivity))]
public class BuggyController : ControllerBase { ... }
```

`ServiceFilter` pozwala ASP.NET Core rozwiązać filtr z kontenera DI, dzięki czemu filtr może korzystać z zależności (np. `AppDbContext`).

### Dlaczego Action Filter, a nie middleware?

- **Action Filter** działa na poziomie kontrolera/akcji — uruchamia się tylko dla żądań obsługiwanych przez MVC.
- **Middleware** działa na poziomie całego potoku HTTP — uruchamia się dla każdego żądania (również pliki statyczne, health checks, itp.).
- W naszym przypadku chcemy aktualizować `LastActive` tylko wtedy, gdy użytkownik faktycznie wywołuje akcję API — Action Filter jest do tego idealnym narzędziem.

### Korzyści

- **DRY** — logika aktualizacji `LastActive` jest w jednym miejscu, nie trzeba jej powtarzać w każdej akcji.
- **Przejrzystość** — kontrolery pozostają czyste i skupione na swojej logice biznesowej.
- **Selektywność** — filtr jest nałożony tylko na wybrane kontrolery za pomocą atrybutu.
- **Wydajność** — `ExecuteUpdateAsync` wykonuje UPDATE bezpośrednio w bazie, bez pobierania encji do pamięci.
