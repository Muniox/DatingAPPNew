# C# — Kiedy stosować `required`, `= null!`, `= default!` i inne

## `required` — wartość podajesz ręcznie

Stosuj gdy właściwość **musi być podana jawnie** przy tworzeniu obiektu i nie ma sensownej wartości domyślnej.

```csharp
public required string SenderId { get; set; }
public required string Content { get; set; }
```

Kompilator wymusi podanie wartości:

```csharp
var msg = new Message { SenderId = "abc", Content = "hello" }; // OK
var msg = new Message { Content = "hello" };                   // błąd kompilacji!
```

## `= null!` — wartość ustawia framework

Stosuj gdy właściwość wypełnia **framework** (EF Core, deserializacja JSON itp.), a nie programista ręcznie.

```csharp
public Member Sender { get; set; } = null!;
```

- EF Core sam uzupełni navigation property podczas ładowania z bazy.
- `= null!` mówi kompilatorowi: "wiem, że teraz jest null, ale zostanie uzupełnione."

## `= default!` — alternatywa dla `= null!`

Dla typów referencyjnych `default` to `null`, więc efekt jest identyczny z `= null!`.

```csharp
public Member Sender { get; set; } = default!;
```

- `= null!` jest bardziej powszechne i czytelne.
- `= default!` przydaje się w kodzie generycznym (działa zarówno z typami wartościowymi, jak i referencyjnymi).

## `typ?` — wartość opcjonalna

Stosuj gdy właściwość **może być null** i to jest poprawny stan.

```csharp
public DateTime? DateRead { get; set; }
```

## `= wartość` — sensowna wartość domyślna

Stosuj gdy właściwość ma **logiczną wartość początkową**.

```csharp
public DateTime MessageSent { get; set; } = DateTime.UtcNow;
```

## Podsumowanie

| Scenariusz | Składnia | Przykład |
|---|---|---|
| Wartość obowiązkowa, podawana ręcznie | `required` | `required string Content` |
| Wartość ustawiana przez framework | `= null!` | `Member Sender = null!` |
| Kod generyczny (value + reference types) | `= default!` | `T Value = default!` |
| Wartość opcjonalna (null jest OK) | `typ?` | `DateTime? DateRead` |
| Sensowna wartość domyślna | `= wartość` | `DateTime MessageSent = DateTime.UtcNow` |
