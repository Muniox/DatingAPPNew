using System;
using API.Entities;
using API.Helpers;
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

    public async Task<PaginatedReslut<Member>> GetMemberLikes(LikesParams likesParams)
    {
        var query = appDbContext.Likes.AsQueryable();
        IQueryable<Member> result;

        switch (likesParams.Predicate)
        {
            case "liked":
                result = query
                        .Where(x => x.SourceMemberId == likesParams.MemberId)
                        .Select(x => x.TargetMember);
                    break;
            case "likedBy":
                result = query
                        .Where(x => x.TargetMemberId == likesParams.MemberId)
                        .Select(x => x.SourceMember);
                    break;
            default: // mutual
                var likeIds = await GetCurrentMemberLikeIds(likesParams.MemberId);

                result = query
                        .Where(x => x.TargetMemberId == likesParams.MemberId 
                        && likeIds.Contains(x.SourceMemberId))
                        .Select(x => x.SourceMember);
                break;
        }

        return await PaginationHelper.CreateAsync(result, likesParams.PageNumber, likesParams.PageSize);
    }

    public async Task<bool> SaveAllChanges()
    {
        return await appDbContext.SaveChangesAsync() > 0;
    }
}
