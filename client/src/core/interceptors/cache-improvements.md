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
