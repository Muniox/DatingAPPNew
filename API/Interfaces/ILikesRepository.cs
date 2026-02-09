using System;
using API.Entities;
using Newtonsoft.Json.Bson;

namespace API.Interfaces;

public interface ILikesRepository
{
    Task<MemberLike> GetMemberLike(string sourceMemberId, string targetMemberId);
    Task<IReadOnlyCollection<Member>> GetMemberLikes(string predicate, string memberId);
    Task<IReadOnlyCollection<string>> GetCurrentMemberLikieIds(string memberId);
    void DeleteLike(MemberLike like);
    void AddLike(MemberLike like);
    Task<bool> SaveAllChanges();
}
