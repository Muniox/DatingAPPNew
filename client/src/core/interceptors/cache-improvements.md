# Ulepszenia Cache w Loading Interceptor

## Problemy z obecną implementacją

1. **Brak TTL** - cache nigdy nie wygasa
2. **Nieograniczony rozmiar** - może rosnąć w nieskończoność
3. **Cachuje wszystkie GET** - nawet te które nie powinny być cachowane
4. **Brak invalidacji** - po POST/PUT/DELETE cache nie jest czyszczony

## Ulepszona wersja

```typescript
import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BusyService } from '../services/busy-service';
import { delay, finalize, of, tap } from 'rxjs';

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minut
const MAX_CACHE_SIZE = 100;

// URL-e które NIE powinny być cachowane
const noCachePatterns = ['/api/messages', '/api/notifications'];

function shouldCache(url: string): boolean {
  return !noCachePatterns.some(pattern => url.includes(pattern));
}

function cleanExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiry < now) {
      cache.delete(key);
    }
  }
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const busyService = inject(BusyService);

  // Invaliduj cache przy mutacjach
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    cache.clear(); // lub bardziej selektywne czyszczenie
  }

  if (req.method === 'GET' && shouldCache(req.url)) {
    cleanExpiredEntries();

    const cached = cache.get(req.url);
    if (cached && cached.expiry > Date.now()) {
      return of(cached.response);
    }
  }

  busyService.busy();

  return next(req).pipe(
    delay(500),
    tap(event => {
      if (event instanceof HttpResponse && req.method === 'GET' && shouldCache(req.url)) {
        // Ogranicz rozmiar cache
        if (cache.size >= MAX_CACHE_SIZE) {
          const firstKey = cache.keys().next().value;
          if (firstKey) cache.delete(firstKey);
        }

        cache.set(req.url, {
          response: event,
          expiry: Date.now() + CACHE_TTL
        });
      }
    }),
    finalize(() => {
      busyService.idle();
    })
  );
};
```

## Kluczowe ulepszenia

| Ulepszenie | Opis |
|------------|------|
| **TTL** | Cache wygasa po 5 minutach |
| **Max size** | Limit 100 wpisów (LRU-like) |
| **Selektywne cache** | Można wykluczyć dynamiczne endpointy |
| **Invalidacja** | POST/PUT/DELETE czyści cache |
| **Typowanie** | Cachuje tylko `HttpResponse`, nie wszystkie eventy |

## Dodatkowe możliwości rozbudowy

- Przeniesienie cache do osobnego serwisu (łatwiejsze testowanie)
- Użycie `localStorage` dla persystencji między sesjami
- Bardziej granularna invalidacja (np. tylko powiązane URL-e)
- Obsługa nagłówków `Cache-Control` z serwera

---

## Obecna implementacja cache na frontendzie

Aktualnie cache działa w `loadingInterceptor` i opiera się na prostym mechanizmie:

- **`Map<string, HttpEvent<unknown>>`** - przechowuje odpowiedzi HTTP w pamięci
- **Klucz cache** - generowany z URL + query params (`generateCacheKey`)
- **Zakres** - cachowane są **wszystkie** requesty GET bez wyjątku
- **Brak TTL** - raz zapisana odpowiedź nigdy nie wygasa
- **Brak limitu rozmiaru** - mapa rośnie bez ograniczeń
- **Brak invalidacji** - operacje POST/PUT/DELETE nie czyszczą cache
- **localStorage** - używany dodatkowo do persystencji filtrów użytkownika (`MemberService`) oraz danych zalogowanego użytkownika (`AccountService`)
- **Angular Signals** - `MemberService` przechowuje aktualnego membera w `signal<Member | null>`, co daje reaktywny dostęp do danych bez ponownego fetchowania

### Przepływ cachowania

```
GET /api/members?pageNumber=1&pageSize=5
  → generateCacheKey() → "api/members?pageNumber=1&pageSize=5"
  → sprawdzenie Map → brak wpisu → request do API → zapis do Map
  → kolejne wywołanie z tymi samymi parametrami → zwrot z Map (bez HTTP)
```

---

## Opinia Angular Developera z 10-letnim stażem

### Ogólna ocena

Caching po stronie frontendu to **absolutna konieczność** w nowoczesnych aplikacjach SPA. W Angularze, gdzie mamy do dyspozycji interceptory HTTP, signals i RxJS, możemy zbudować naprawdę potężny system cache'owania bez sięgania po zewnętrzne biblioteki. Obecna implementacja w tym projekcie to **dobry punkt wyjścia** - działa, jest prosta i spełnia swoje zadanie w kontekście nauki. Natomiast w aplikacji produkcyjnej wymaga rozbudowy.

### Co myślę o zastosowanym podejściu

Użycie `HttpInterceptorFn` (functional interceptor) to **nowoczesne podejście** zgodne z duchem standalone components w Angular 16+. Dobrze, że odeszliśmy od class-based interceptorów. Cache oparty na `Map` jest szybki i prosty, a generowanie klucza z URL + params jest poprawne i obsługuje różne kombinacje filtrów.

Użycie `signal()` w `MemberService` do trzymania aktualnego membera to **sprytne rozwiązanie** - pozwala komponentom reagować na zmiany bez dodatkowych subskrypcji. To podejście jest zdecydowanie lepsze niż tradycyjny `BehaviorSubject` w nowych projektach Angular.

### Czego bym unikał

- **Cachowania wszystkiego na ślepo** - w obecnej wersji nawet requesty do endpointów, które zwracają dynamiczne dane (np. wiadomości, notyfikacje), są cachowane. To może prowadzić do wyświetlania przestarzałych danych.
- **Nieskończonego cache** - brak TTL oznacza, że użytkownik może siedzieć na stronie godzinami i widzieć stare dane.
- **Braku strategii invalidacji** - gdy użytkownik edytuje profil (PUT), a potem wraca do listy memberów, lista pochodzi z cache i nie zawiera zmian.

---

## Plusy cachowania na frontendzie

| Plus | Opis |
|------|------|
| **Szybkość UX** | Użytkownik nie czeka na ponowne ładowanie danych, które już raz pobrał. Lista memberów po powrocie z profilu ładuje się natychmiastowo |
| **Redukcja obciążenia API** | Mniej requestów = mniejsze koszty serwera, mniejsze zużycie bandwidth |
| **Lepsze działanie offline/słaba sieć** | Cache pozwala wyświetlać dane nawet gdy sieć jest niestabilna (szczególnie z localStorage) |
| **Prostota implementacji** | W Angularze interceptor + Map to kilkanaście linii kodu, a zysk ogromny |
| **Spójność danych w ramach sesji** | Angular Signals zapewniają, że wszystkie komponenty widzą te same dane bez dodatkowych mechanizmów synchronizacji |
| **Mniejsza liczba renderów** | Dane z cache nie powodują pełnego cyklu loading → empty state → dane, co eliminuje migotanie UI |
| **Persystencja filtrów** | Użycie localStorage do zapamiętywania filtrów sprawia, że użytkownik nie traci swoich ustawień po odświeżeniu strony |

## Minusy cachowania na frontendzie

| Minus | Opis |
|-------|------|
| **Nieaktualne dane (stale data)** | Największy problem - użytkownik może widzieć przestarzałe informacje jeśli cache nie jest poprawnie invalidowany |
| **Zużycie pamięci** | Bez limitu rozmiaru cache rośnie z każdym nowym requestem. W aplikacji z wieloma stronami i filtrami `Map` może pochłonąć sporo RAM |
| **Złożoność invalidacji** | Poprawna invalidacja cache to najtrudniejszy problem w informatyce. Trzeba wiedzieć, które dane unieważnić po każdej mutacji |
| **Debugowanie** | Gdy coś nie działa, cache jest często ostatnim miejscem, gdzie szukamy problemu. "Dlaczego dane się nie zmieniają?" - bo cache |
| **Niespójność między użytkownikami** | Jeśli użytkownik A edytuje dane, użytkownik B nadal widzi stare dane z cache. Rozwiązanie wymaga WebSocket/SSE |
| **Podwójne źródło prawdy** | Cache w interceptorze + signal w serwisie + localStorage = trzy miejsca gdzie mogą być różne wersje danych. Trzeba pilnować synchronizacji |
| **Utrudnione testowanie** | Cache w zmiennej modułowej (`const cache = new Map()`) jest trudny do mockowania w unit testach. Lepiej wyciągnąć go do osobnego serwisu |
| **Brak kontroli serwera** | Cache po stronie frontendu nie respektuje nagłówków `Cache-Control`, `ETag` czy `Last-Modified` z serwera |

---

## Rekomendacje na przyszłość

1. **Wydzielić cache do osobnego `CacheService`** - łatwiejsze testowanie, czystsza architektura
2. **Dodać TTL (5 min)** - dane nie będą przechowywane wiecznie
3. **Dodać limit rozmiaru (100 wpisów)** - ochrona przed wyciekiem pamięci
4. **Selektywne cachowanie** - wykluczyć endpointy z dynamicznymi danymi
5. **Invalidacja przy mutacjach** - POST/PUT/DELETE powinny czyścić powiązane wpisy
6. **Rozważyć `transferState`** - jeśli w przyszłości pojawi się SSR (Angular Universal), cache z serwera można przenieść na klienta
7. **Monitoring** - dodać logowanie trafień/pudł cache w trybie development, żeby mierzyć skuteczność
