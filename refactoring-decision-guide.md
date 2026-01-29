# Refactoring Decision Guide - Angular Component vs Service

## Kontekst

Analiza kodu `MemberProfile.updateProfile()` - czy logika powinna być w komponencie czy w serwisie?

## Obecny kod (w komponencie)

```typescript
updateProfile() {
  if (!this.memberService.member()) return;

  const updatedMember = { ...this.memberService.member(), ...this.editableMember() };
  this.memberService.updateMember(this.editableMember()).subscribe({
    next: () => {
      // Synchronizacja z accountService
      const currentUser = this.accountService.currentUser();
      if(currentUser && updatedMember.displayName !== currentUser?.displayName) {
        currentUser.displayName = updatedMember.displayName;
        this.accountService.setCurrentUser(currentUser);
      }

      // UI feedback
      this.toast.success('Profile updated successfully');
      this.memberService.editMode.set(false);
      this.memberService.member.set(updatedMember as Member);
      this.editForm?.reset(updatedMember);
    },
  });
}
```

## Potencjalne problemy

| Problem | Opis |
|---------|------|
| **SRP violation** | Komponent zawiera logikę biznesową |
| **Coupling** | Komponent zna relację między MemberService a AccountService |
| **Testowalność** | Trudniej testować logikę w izolacji |
| **Duplikacja** | Jeśli inny komponent będzie aktualizować profil - kod się powtórzy |

## Propozycja refaktoringu

### Komponent (tylko UI)

```typescript
updateProfile() {
  this.memberService.updateMember(this.editableMember()).subscribe({
    next: () => {
      this.toast.success('Profile updated successfully');
      this.editForm?.reset(this.memberService.member());
    },
  });
}
```

### Serwis (logika biznesowa)

```typescript
// member.service.ts
updateMember(data: EditableMember) {
  return this.http.put(`${this.apiUrl}/members`, data).pipe(
    tap(() => {
      // Aktualizacja własnego stanu
      const updatedMember = { ...this.member(), ...data };
      this.member.set(updatedMember as Member);
      this.editMode.set(false);

      // Synchronizacja z AccountService
      this.accountService.syncDisplayName(data.displayName);
    })
  );
}
```

## Pragmatyczna decyzja

### Zostaw obecny kod gdy:

- Mała/średnia aplikacja
- Tylko jeden komponent edytuje profil
- Mały zespół (1-3 osoby)
- Krótki deadline
- Brak testów jednostkowych

### Refaktoruj gdy:

- Wiele miejsc aktualizuje profil
- Zespół się rozrasta
- Aplikacja będzie długo utrzymywana
- Piszecie testy jednostkowe
- Logika zaczyna się powtarzać

## Zasada

> "Najpierw wyślij feature, potem refaktoruj gdy zaboli. Przedwczesna abstrakcja to też dług techniczny."

## Rekomendacja

Jeśli zostawiasz obecny kod, dodaj komentarz dokumentujący intencję:

```typescript
// TODO: move business logic to MemberService if reused elsewhere
```

Gdy pojawi się drugi przypadek użycia - wtedy refaktor.

## Powiązane zasady

- **YAGNI** - You Aren't Gonna Need It
- **Rule of Three** - refaktoruj przy trzecim powtórzeniu
- **SRP** - Single Responsibility Principle
- **Pragmatic Programming** - działający kod > perfekcyjna architektura

## Lokalizacja w projekcie

Plik: `client/src/features/members/member-profile/member-profile.ts`