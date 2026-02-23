using System;
using API.Entities;
using API.Helpers;

namespace API.Interfaces;

public interface IMemberRepository
{
    void Update(Member member);
    Task<PaginatedReslut<Member>> GetMembersAsync(MemberParams memberParams);
    Task<Member?> GetMemberByIdAsync(string Id);
    Task<IReadOnlyCollection<Photo>> GetPhotosForMemberAsync(string memberId);
    Task<Member?> GetMemberForUpdate(string id);
}
