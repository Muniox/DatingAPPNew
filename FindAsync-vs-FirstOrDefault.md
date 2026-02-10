# FindAsync vs FirstOrDefaultAsync w Entity Framework Core

## FindAsync

Szuka encji **wyłącznie po kluczu głównym (Primary Key)**.

```csharp
var message = await context.Messages.FindAsync(messageId);
```

### Zalety

- **Cache (Change Tracker)** — jeśli encja jest już załadowana w kontekście, zwraca ją natychmiast bez zapytania do bazy
- **Prostota** — krótka, czytelna składnia
- **Wydajność** — mniej narzutu niż budowanie zapytania LINQ

### Ograniczenia

- Działa **tylko** z kluczem głównym
- Nie wspiera `.Include()`, `.Select()`, `.Where()` ani żadnych operacji LINQ
- Nie można budować projekcji (np. mapowania na DTO)

### Kiedy używać

- Pobieranie pojedynczej encji po ID
- Nie potrzebujesz eager loading relacji
- Chcesz skorzystać z cache change trackera (np. w ramach jednej transakcji)

```csharp
// Proste pobranie po PK
var user = await context.Users.FindAsync(userId);

// Klucz złożony (composite key)
var like = await context.Likes.FindAsync(sourceUserId, targetUserId);
```

---

## FirstOrDefaultAsync

Szuka encji po **dowolnym warunku LINQ**. Zwraca pierwszy pasujący rekord lub `null`.

```csharp
var message = await context.Messages
    .Include(m => m.Sender)
    .FirstOrDefaultAsync(m => m.Id == messageId);
```

### Zalety

- **Pełne LINQ** — filtrowanie po dowolnym polu, nie tylko PK
- **Include** — wspiera eager loading relacji
- **Projekcje** — można łączyć z `.Select()` do mapowania na DTO

### Ograniczenia

- **Zawsze** wykonuje zapytanie do bazy (nie korzysta z change trackera)
- Nieco większy narzut niż `FindAsync` dla prostych zapytań po PK

### Kiedy używać

- Szukanie po polu innym niż klucz główny
- Potrzebujesz załadować relacje (`.Include()`)
- Potrzebujesz projekcji na DTO (`.Select()`)

```csharp
// Szukanie po polu innym niż PK
var user = await context.Users
    .FirstOrDefaultAsync(u => u.UserName == username);

// Eager loading relacji
var message = await context.Messages
    .Include(m => m.Sender)
    .Include(m => m.Recipient)
    .FirstOrDefaultAsync(m => m.Id == messageId);

// Projekcja na DTO
var dto = await context.Messages
    .Where(m => m.Id == messageId)
    .Select(m => new MessageDto
    {
        Id = m.Id,
        Content = m.Content,
        SenderName = m.Sender.UserName
    })
    .FirstOrDefaultAsync();
```

---

## Podsumowanie

| Kryterium              | FindAsync            | FirstOrDefaultAsync       |
|------------------------|----------------------|---------------------------|
| Szuka po               | Klucz główny (PK)   | Dowolny warunek           |
| Cache (Change Tracker) | Tak                  | Nie                       |
| `.Include()`           | Nie                  | Tak                       |
| `.Select()` / DTO      | Nie                  | Tak                       |
| Wydajność (po PK)     | Lepsza               | Nieco wolniejsza          |

**Zasada:** Jeśli szukasz po PK i nie potrzebujesz `.Include()` — użyj `FindAsync`. W pozostałych przypadkach — `FirstOrDefaultAsync`.

---

## Powiązane metody

- **SingleOrDefaultAsync** — jak `FirstOrDefault`, ale rzuca wyjątek jeśli znajdzie więcej niż jeden rekord. Używaj gdy spodziewasz się dokładnie 0 lub 1 wyniku i chcesz to wymusić.
- **FirstAsync / SingleAsync** — rzucają wyjątek gdy nie znajdą żadnego rekordu. Używaj gdy brak wyniku oznacza błąd w logice aplikacji.
