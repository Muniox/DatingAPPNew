# Client-Side State Update Pattern

## Problem

Po wysłaniu żądania aktualizacji danych do API, czy potrzebujemy dodatkowego zapytania GET, aby pobrać zaktualizowany stan?

## Rozwiązanie

**Nie** - klient może samodzielnie zaktualizować lokalny stan po otrzymaniu potwierdzenia sukcesu z serwera.

## Przykład implementacji

```typescript
updateProfile() {
  if (!this.memberService.member()) return;

  // 1. Przygotowanie zaktualizowanych danych przed wysłaniem
  const updatedMember = { ...this.memberService.member(), ...this.editableMember() };

  // 2. Wysłanie żądania do API
  this.memberService.updateMember(this.editableMember()).subscribe({
    next: () => {
      // 3. Po sukcesie - aktualizacja lokalnego stanu
      this.toast.success('Profile updated successfully');
      this.memberService.editMode.set(false);
      this.memberService.member.set(updatedMember as Member);
      this.editForm?.reset(updatedMember);
    },
  });
}
```

## Dlaczego to działa?

1. **Klient zna wysłane dane** - przed wysłaniem żądania tworzymy obiekt `updatedMember` zawierający nowy stan
2. **Sukces = akceptacja** - gdy serwer odpowiada bez błędu, potwierdza że dane zostały zapisane
3. **Dane są identyczne** - serwer zapisuje dokładnie to, co otrzymał (bez modyfikacji)

## Korzyści

| Aspekt | Opis |
|--------|------|
| **Wydajność** | Eliminacja dodatkowego round-trip HTTP |
| **UX** | Szybsza odpowiedź dla użytkownika |
| **Zasoby** | Mniejsze obciążenie serwera |
| **Prostota** | Mniej kodu do obsługi |

## Kiedy NIE stosować tego wzorca?

Dodatkowe zapytanie GET jest potrzebne gdy:

- Serwer **modyfikuje dane** (np. dodaje timestamp, generuje ID)
- Serwer **wylicza pola zależne** od innych danych w bazie
- Wymagana jest **100% pewność synchronizacji** (systemy krytyczne)
- Istnieje możliwość **równoczesnej edycji** przez innych użytkowników

## Powiązane wzorce

- **Optimistic Update** - aktualizacja UI przed potwierdzeniem z serwera
- **Pessimistic Update** - aktualizacja UI dopiero po potwierdzeniu
- **CQRS** - rozdzielenie operacji odczytu i zapisu

## Lokalizacja w projekcie

Plik: `client/src/features/members/member-profile/member-profile.ts`
