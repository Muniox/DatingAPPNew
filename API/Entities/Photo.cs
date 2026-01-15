using System;

namespace API.Entities;

public class Photo
{
    public int Id { get; set; }
    public required string  Url { get; set; }
    public string?  PublicId { get; set; }

    // Foreign key
    public string MemberId { get; set; } = null!;

    // Navigation property
    public Member Member { get; set; } = null!;
}
