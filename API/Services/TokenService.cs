using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using API.Entities;
using API.Interfaces;
using Microsoft.IdentityModel.Tokens;

namespace API.Services;

/// <summary>
/// Serwis odpowiedzialny za tworzenie i zarządzanie tokenami JWT (JSON Web Token)
/// używanymi do autentykacji i autoryzacji użytkowników w aplikacji.
/// </summary>
public class TokenService(IConfiguration config) : ITokenService
{
    /// <summary>
    /// Tworzy token JWT dla uwierzytelnionego użytkownika.
    /// Token zawiera informacje o użytkowniku (email, ID) i jest ważny przez 7 dni.
    /// </summary>
    /// <param name="user">Obiekt użytkownika, dla którego tworzony jest token</param>
    /// <returns>Zakodowany token JWT jako string</returns>
    /// <exception cref="Exception">
    /// Rzuca wyjątek jeśli:
    /// - Klucz tokenu nie został znaleziony w konfiguracji
    /// - Klucz tokenu jest krótszy niż 64 znaki (wymagane dla bezpieczeństwa)
    /// </exception>
    public string CreateToken(AppUser user)
    {
        // Pobierz klucz tokenu z konfiguracji aplikacji (appsettings.json)
        // Jeśli klucz nie istnieje, rzuć wyjątek
        var tokenKey = config["TokenKey"] ?? throw new Exception("Cannot get token key");
        
        // Walidacja długości klucza - musi mieć co najmniej 64 znaki dla bezpieczeństwa
        if (tokenKey.Length < 64) throw new Exception("Your token key needs to be >= 64 characters");
        
        // Utwórz symetryczny klucz zabezpieczający z klucza tekstowego
        // Klucz jest konwertowany z UTF8 string na bytes
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));

        // Zdefiniuj roszczenia (claims) - informacje zawarte w tokenie
        // Claims to pary klucz-wartość opisujące użytkownika
        var claims = new List<Claim>()
        {
            new Claim(ClaimTypes.Email, user.Email),              // Email użytkownika
            new Claim(ClaimTypes.NameIdentifier, user.Id)         // Unikalny identyfikator użytkownika
        };

        // Utwórz dane uwierzytelniające do podpisania tokenu
        // Używamy algorytmu HMAC SHA512 do podpisywania
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        // Zdefiniuj deskryptor tokenu - opis jak token powinien być skonstruowany
        var tokenDescriptor = new SecurityTokenDescriptor()
        {
            Subject = new ClaimsIdentity(claims),           // Tożsamość zawierająca roszczenia
            Expires = DateTime.UtcNow.AddDays(7),           // Token wygasa po 7 dniach
            SigningCredentials = creds                       // Dane uwierzytelniające do podpisania
        };

        // Utwórz handler do obsługi operacji na tokenach JWT
        var tokenHandler = new JwtSecurityTokenHandler();
        
        // Wygeneruj token na podstawie deskryptora
        var token = tokenHandler.CreateToken(tokenDescriptor);

        // Zwróć token jako zakodowany string gotowy do wysłania do klienta
        return tokenHandler.WriteToken(token);
    }
}
