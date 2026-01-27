# Use Case: Route Resolver

## Problem
Masz parent route z child routes i wszystkie potrzebują tych samych danych z API.

## Przykład
```
/members/123               → MemberDetailed (parent)
/members/123/profile       → MemberProfile (child)
/members/123/photos        → MemberPhotos (child)  
/members/123/messages      → MemberMessages (child)
```

Wszystkie komponenty potrzebują danych `Member`.

## Bez Resolver'a ❌

**Opcja 1: Duplikacja**
```typescript
// MemberDetailed
ngOnInit() {
  this.memberService.getMember(id).subscribe(...); // Request 1
}

// MemberProfile  
ngOnInit() {
  this.memberService.getMember(id).subscribe(...); // Request 2
}

// MemberPhotos
ngOnInit() {
  this.memberService.getMember(id).subscribe(...); // Request 3
}
```

**Problemy:**
- 3x to samo żądanie do API
- Powtórzony kod w każdym komponencie
- Gorsze performance
- Loading state w każdym komponencie

## Z Resolver'em ✅

### 1. Utwórz Resolver
```typescript
// member-resolver.ts
export const memberResolver: ResolveFn<Member> = (route, state) => {
  const memberService = inject(MemberService);
  const router = inject(Router);
  const memberId = route.paramMap.get('id');

  if (!memberId) {
    router.navigateByUrl('/not-found');
    return EMPTY;
  }

  return memberService.getMember(memberId); // Jeden request
};
```

### 2. Dodaj do Routes
```typescript
{
  path: 'members/:id',
  resolve: { member: memberResolver }, // ← Resolver na parent route
  component: MemberDetailed,
  children: [
    { path: 'profile', component: MemberProfile },
    { path: 'photos', component: MemberPhotos },
    { path: 'messages', component: MemberMessages }
  ]
}
```

### 3. Użyj danych w komponentach
```typescript
// MemberDetailed (parent) lub child components
export class MemberDetailed {
  private route = inject(ActivatedRoute);
  
  member = toSignal(
    this.route.data.pipe(map(data => data['member'] as Member))
  );
}
```

## Korzyści Resolver'a

✅ **Jeden request** - dane pobierane raz, dostępne dla wszystkich  
✅ **Brak duplikacji** - logika w jednym miejscu  
✅ **Lepszy UX** - dane gotowe przed renderowaniem (brak "migania")  
✅ **Sharing** - parent i children mają dostęp do tych samych danych  
✅ **Walidacja** - centralna obsługa błędów (redirect jeśli brak ID)  
✅ **Czystszy kod** - komponenty nie zawierają logiki pobierania

## Kiedy używać?

- Parent route + child routes potrzebują tych samych danych
- Chcesz uniknąć wielokrotnych requestów do API
- Dane muszą być gotowe przed renderowaniem komponentu
- Potrzebujesz centralnej walidacji/obsługi błędów

## Kiedy NIE używać?

- Proste komponenty bez child routes
- Dane zmieniają się często (lepszy RxJS state management)
- Bardzo złożona logika pobierania (wtedy serwis z cache)
