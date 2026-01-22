using System;
using System.Text.Json.Serialization;

namespace API.Entities;

public class Photo
{
    public int Id { get; set; }
    public required string  Url { get; set; }
    public string?  PublicId { get; set; }

    // Foreign key
    [JsonIgnore]
    public string MemberId { get; set; } = null!;

    [JsonIgnore]
    // Navigation property
    public Member Member { get; set; } = null!;
}
