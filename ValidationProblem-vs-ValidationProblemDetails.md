# ValidationProblem() vs ValidationProblemDetails

## `ValidationProblem()` (metoda)

Jest to **metoda pomocnicza** dostepna w klasie `ControllerBase`. Jej cechy:

- Automatycznie odczytuje bledy z `ModelState`
- Zwraca `ActionResult` z kodem odpowiedzi **400 Bad Request**
- Formatuje cialo odpowiedzi jako obiekt JSON zgodny ze standardem RFC 7807 (Problem Details)
- Jest wygodnym i idiomatycznym sposobem zwracania bledow walidacji z kontrolera

Przyklad uzycia w `AccountController.cs`:

```csharp
if (!result.Succeeded)
{
    foreach (var error in result.Errors)
    {
        ModelState.AddModelError("identity", error.Description);
    }

    return ValidationProblem();
}
```

## `ValidationProblemDetails` (klasa)

Jest to **klasa modelu danych** (`Microsoft.AspNetCore.Mvc.ValidationProblemDetails`), ktora reprezentuje cialo odpowiedzi. Jej cechy:

- Dziedziczy po klasie `ProblemDetails`
- Posiada slownik `Errors` (`IDictionary<string, string[]>`) zawierajacy bledy walidacji przypisane do poszczegolnych pol
- Jest **obiektem**, ktory metoda `ValidationProblem()` serializuje do odpowiedzi HTTP

## Relacja miedzy nimi

`ValidationProblem()` tworzy i zwraca `ValidationProblemDetails` pod spodem. Podsumowanie:

| | `ValidationProblem()` | `ValidationProblemDetails` |
|---|---|---|
| **Czym jest** | Metoda kontrolera | Klasa danych |
| **Zwraca** | `ActionResult` (odpowiedz 400) | Nie dotyczy (to POCO) |
| **Zrodlo bledow** | Odczytuje z `ModelState` | Wypelniasz recznie |

## Kiedy uzyc `ValidationProblemDetails` bezposrednio?

Rzadko w kontrolerach — `ValidationProblem()` jest prostsze. Klasy uzywa sie bezposrednio gdy:

- Budujemy wlasny middleware lub handler wyjatkow, ktory musi recznie skonstruowac odpowiedz
- Dostosowujemy `ProblemDetailsFactory`
- Piszemy testy jednostkowe sprawdzajace ksztalt odpowiedzi