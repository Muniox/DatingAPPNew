using System;
using System.Security.Claims;

namespace API.Extensions;

public static class ClaimsPrincipalExtensions
{
    // Uwaga: Rzucanie wyjątków w metodach rozszerzających używanych przez kontrolery to zazwyczaj anti-pattern,
    // ale tutaj nie mamy wyboru - to krytyczny błąd autoryzacji, który powinien trafić do ExceptionMiddleware
    // Alternatywa (zwracanie null i sprawdzanie w każdym kontrolerze) jest gorsza dla maintainability
    // Dodatkowo: jeśli kontroler używa [Authorize], ten wyjątek teoretycznie nigdy nie powinien wystąpić,
    // więc jest to sytuacja naprawdę wyjątkowa, co usprawiedliwia użycie exception
    public static string GetMemberId(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("Cannot get memberId from token");
    }
}
