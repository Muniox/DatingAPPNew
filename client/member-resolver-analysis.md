# Analiza wzorca memberResolver

## Obecna implementacja

### Jak działa przepływ danych:

1. **Resolver** (`member-resolver.ts`) wywołuje `memberService.getMember(memberId)` przed nawigacją

2. **MemberService.getMember()** (`member-service.ts:24-30`) ma efekt uboczny - zapisuje dane do sygnału:
   ```typescript
   return this.http.get<Member>(...).pipe(
     tap(member => {
       this.member.set(member);  // ← tu zapisuje do sygnału
     })
   )
   ```

3. **Komponenty** korzystają z sygnału `memberService.member()`:
   - `MemberProfile` - linia 42-45
   - `MemberDetailed` - linia 16

### Co to oznacza:

Komponenty **nie pobierają danych z resolvera w standardowy sposób** (przez `route.snapshot.data.member`). Zamiast tego resolver służy jako mechanizm gwarantujący, że dane będą pobrane **przed** wyrenderowaniem komponentu, a komponenty odczytują je przez współdzielony sygnał w serwisie.

---

## Problemy z tym podejściem

### 1. Anti-pattern - niewykorzystany wynik resolvera
Resolver zwraca `Member`, ale żaden komponent tego nie używa. To jak kupienie biletu na pociąg i pójście pieszo obok torów.

### 2. Ukryty przepływ danych
Dane trafiają do komponentów przez efekt uboczny (`tap`). Nowy developer patrząc na kod zapyta: "skąd `memberService.member()` ma wartość?" - odpowiedź jest nieoczywista.

### 3. Ryzyko race condition
Sygnał jest globalny w serwisie. Przy szybkiej nawigacji między członkami może dojść do sytuacji, gdzie wyświetlany jest nieprawidłowy member.

### 4. Trudniejsze testowanie
Zamiast mockować dane routy, musisz mockować stan serwisu.

---

## Lepsze podejścia

### Opcja A - Użyj resolvera prawidłowo

```typescript
// w komponencie
private route = inject(ActivatedRoute);
member = toSignal(this.route.data.pipe(map(d => d['member'])));
```

### Opcja B - Porzuć resolver, użyj input signals (Angular 17.1+)

```typescript
// w routach
{ path: 'members/:id', component: MemberDetailed }

// w komponencie
id = input.required<string>();  // automatycznie z route param
member = toSignal(toObservable(this.id).pipe(
  switchMap(id => this.memberService.getMember(id))
));
```

### Opcja C - Zachowaj sygnał w serwisie

Usuń resolver i ładuj dane w komponencie z loading state.

---

## Werdykt

Obecne rozwiązanie **działa**, ale jest "code smell". Łączy dwa wzorce (resolver + shared state) w sposób, który komplikuje zrozumienie i utrzymanie kodu. Wybrałbym jedno podejście i trzymał się go konsekwentnie.
