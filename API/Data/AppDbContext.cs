using System;
using API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace API.Data;

public class AppDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<AppUser> Users { get; set; }
    public DbSet<Member> Members { get; set; }
    public DbSet<Photo> Photos { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
            v => v.ToUniversalTime(), 
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
        );

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(dateTimeConverter);
                }
            }
        }

        // AppUser 1:1 Member (shared primary key)
        modelBuilder.Entity<Member>()
            .HasOne(m => m.User)
            .WithOne(u => u.Member)
            .HasForeignKey<Member>(m => m.Id)
            .OnDelete(DeleteBehavior.Cascade);

        // Member 1:N Photos
        modelBuilder.Entity<Photo>()
            .HasOne(p => p.Member)
            .WithMany(m => m.Photos)
            .HasForeignKey(p => p.MemberId)
            .OnDelete(DeleteBehavior.Cascade);
    }

}
