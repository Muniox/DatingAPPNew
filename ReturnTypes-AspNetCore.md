# Typy zwracane w kontrolerach ASP.NET Core — przewodnik

## Problem

```csharp
// To NIE skompiluje się:
public async Task<ActionResult<IReadOnlyCollection<MessageDto>>> GetMessageThread(...)
{
    return await repo.GetMessageThread(...); // List<T> → ActionResult<IReadOnlyCollection<T>> ❌
}
```

`ActionResult<T>` ma implicit operator konwersji, ale wymaga **dokładnego dopasowania typu**.
`List<T>` to nie jest `IReadOnlyCollection<T>` z punktu widzenia tego operatora — mimo że implementuje ten interfejs.

---

## Rozwiązania

### 1. `IEnumerable<T>` — najczęstsze podejście (rekomendowane)

```csharp
// Interfejs
Task<IEnumerable<MessageDto>> GetMessageThread(...);

// Repozytorium
public async Task<IEnumerable<MessageDto>> GetMessageThread(...)
{
    return await context.Messages.Select(...).ToListAsync();
    // List<T> implementuje IEnumerable<T> — implicit conversion działa ✅
}

// Kontroler
public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessageThread(...)
{
    return Ok(await repo.GetMessageThread(...)); // ✅
}
```

**Zalety:** standard w ASP.NET Core, minimalna ekspozycja kontraktu, `List<T>` konwertuje się bez problemów.
**Uwaga:** nawet z `IEnumerable<T>` w `ActionResult<T>` warto użyć `Ok(...)` dla pewności.

---

### 2. `Ok(result)` — jawne opakowanie (najprostsze rozwiązanie)

```csharp
// Repozytorium zostaje bez zmian — może zwracać IReadOnlyCollection, List, cokolwiek
Task<IReadOnlyCollection<MessageDto>> GetMessageThread(...);

// Kontroler — Ok() akceptuje dowolny obiekt
public async Task<ActionResult<IReadOnlyCollection<MessageDto>>> GetMessageThread(...)
{
    var messages = await repo.GetMessageThread(...);
    return Ok(messages); // ✅ zawsze działa
}
```

**Zalety:** zero zmian w interfejsie/repozytorium, działa z każdym typem.
**To jest najprostszy fix jeśli nie chcesz zmieniać sygnatury repozytorium.**

---

### 3. `List<T>` — bezpośrednio

```csharp
Task<List<MessageDto>> GetMessageThread(...);
```

**Zalety:** brak problemów z konwersją, jawny typ.
**Wady:** eksponuje implementację (lista) zamiast abstrakcji — łamie zasadę "program to an interface".

---

## Zastosowanie w tym projekcie

### Obecny stan (nie kompiluje się):
```
Interfejs:      Task<IReadOnlyCollection<MessageDto>>
Repozytorium:   Task<IReadOnlyCollection<MessageDto>>  → zwraca ToListAsync()
Kontroler:      ActionResult<IEnumerable<MessageDto>>   → return await repo... ❌
```

### Fix A — zmień na Ok() (minimalna zmiana):
```
Interfejs:      Task<IReadOnlyCollection<MessageDto>>  (bez zmian)
Repozytorium:   Task<IReadOnlyCollection<MessageDto>>  (bez zmian)
Kontroler:      return Ok(await repo.GetMessageThread(...));  ✅
```

### Fix B — ujednolicenie na IEnumerable (czystsze):
```
Interfejs:      Task<IEnumerable<MessageDto>>
Repozytorium:   Task<IEnumerable<MessageDto>>
Kontroler:      ActionResult<IEnumerable<MessageDto>> + Ok(await repo...)  ✅
```

---

## Zasada ogólna

| Sytuacja | Użyj |
|----------|------|
| Kolekcja w kontrolerze API | `IEnumerable<T>` + `Ok(result)` |
| Kolekcja w logice biznesowej | `IReadOnlyCollection<T>` lub `IReadOnlyList<T>` |
| Potrzebujesz `.Count` | `IReadOnlyCollection<T>` |
| Potrzebujesz indeksowania `[i]` | `IReadOnlyList<T>` |
| Wewnętrzna implementacja | `List<T>` |

**Złota reguła:** W kontrolerach ASP.NET Core zawsze opakowuj wynik w `Ok()` — eliminuje to problemy z implicit conversion i jest idiomatyczne.
