using System;
using API.Entities;
using API.Helpers;
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

    public async Task<PaginatedReslut<Member>> GetMembersAsync(MemberParams memberParams)
    {
        var query = appDbContext.Members.AsQueryable();

        query = query.Where(x => x.Id != memberParams.CurrentMemberId);

        if (memberParams.Gender is not null)
        {
            query = query.Where(x => x.Gender == memberParams.Gender);
        }

        query = memberParams.OrderBy switch
        {
            "created" => query.OrderByDescending(x => x.Created),
            _ => query.OrderByDescending(x => x.LastActive)
        };

        var minDob = DateOnly.FromDateTime(DateTime.Today.AddYears(-memberParams.MaxAge -1));
        var maxDob = DateOnly.FromDateTime(DateTime.Today.AddYears(-memberParams.MinAge));

        query = query.Where(x => x.DateOfBirth >= minDob && x.DateOfBirth <= maxDob);

        return await PaginationHelper.CreateAsync(query, memberParams.PageNumber, memberParams.PageSize);  
    }

    public async Task<IReadOnlyCollection<Photo>> GetPhotosForMemberAsync(string memberId)
    {
        return await appDbContext.Members
            .Where((x) => x.Id == memberId)
            .SelectMany(x => x.Photos)
            .ToListAsync();
    }

    public void Update(Member member)
    {
        appDbContext.Entry(member).State = EntityState.Modified;
    }
}
