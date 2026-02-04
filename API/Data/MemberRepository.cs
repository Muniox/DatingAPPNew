using System;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class MemberRepository(AppDbContext appDbContext) : IMemberRepository
{
    public async Task<Member?> GetMemberByIdAsync(string Id)
    {
        var member = await appDbContext.Members.FindAsync(Id);
        return member;
    }

    public async Task<Member?> GetMemberForUpdate(string id)
    {
        return await appDbContext.Members
            .Include(x => x.User)
            .Include(x => x.Photos)
            .SingleOrDefaultAsync(x => x.Id == id);
    }

    public async Task<IReadOnlyCollection<Member>> GetMembersAsync()
    {
        var query = appDbContext.Members.AsQueryable();

        return await appDbContext.Members.ToListAsync();
    }

    public async Task<IReadOnlyCollection<Photo>> GetPhotosForMemberAsync(string memberId)
    {
        return await appDbContext.Members
            .Where((x) => x.Id == memberId)
            .SelectMany(x => x.Photos)
            .ToListAsync();
    }

    public async Task<bool> SaveAllAsync()
    {
        return await appDbContext.SaveChangesAsync() > 0;
    }

    public void Update(Member member)
    {
        appDbContext.Entry(member).State = EntityState.Modified;
    }
}
