using System;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class LikesRepository(AppDbContext appDbContext) : ILikesRepository
{
    public void AddLike(MemberLike like)
    {
        appDbContext.Likes.Add(like);
    }

    public void DeleteLike(MemberLike like)
    {
        appDbContext.Likes.Remove(like);
    }

    public async Task<IReadOnlyCollection<string>> GetCurrentMemberLikeIds(string memberId)
    {
        return await appDbContext.Likes
            .Where(x => x.SourceMemberId == memberId)
            .Select(x => x.TargetMemberId)
            .ToListAsync();
    }

    public async Task<MemberLike?> GetMemberLike(string sourceMemberId, string targetMemberId)
    {
        return await appDbContext.Likes.FindAsync(sourceMemberId, targetMemberId);
    }

    public async Task<IReadOnlyCollection<Member>> GetMemberLikes(string predicate, string memberId)
    {
        var query = appDbContext.Likes.AsQueryable();

        switch (predicate)
        {
            case "liked":
                return await query
                        .Where(x => x.SourceMemberId == memberId)
                        .Select(x => x.TargetMember)
                        .ToListAsync();
            case "likedBy":
                return await query
                        .Where(x => x.TargetMemberId == memberId)
                        .Select(x => x.SourceMember)
                        .ToListAsync();
            default: // mutual
                var likeIds = await GetCurrentMemberLikeIds(memberId);

                return await query
                        .Where(x => x.TargetMemberId == memberId 
                        && likeIds.Contains(x.SourceMemberId))
                        .Select(x => x.SourceMember)
                        .ToListAsync();
        }
    }

    public async Task<bool> SaveAllChanges()
    {
        return await appDbContext.SaveChangesAsync() > 0;
    }
}
