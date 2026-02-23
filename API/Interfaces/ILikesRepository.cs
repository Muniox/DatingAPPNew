using System;
using API.Entities;
using API.Helpers;
using Newtonsoft.Json.Bson;

namespace API.Interfaces;

public interface ILikesRepository
{
    Task<MemberLike?> GetMemberLike(string sourceMemberId, string targetMemberId);
    Task<PaginatedReslut<Member>> GetMemberLikes(LikesParams likesParams);
    Task<IReadOnlyCollection<string>> GetCurrentMemberLikeIds(string memberId);
    void DeleteLike(MemberLike like);
    void AddLike(MemberLike like);
}
