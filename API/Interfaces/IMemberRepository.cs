using System;
using API.Entities;

namespace API.Interfaces;

public interface IMemberRepository
{
    void Update(Member member);
    Task<bool> SaveAllAsync();
    Task<IReadOnlyCollection<Member>> GetMembersAsync();
    Task<Member?> GetMemberByIdAsync(string Id);
    Task<IReadOnlyCollection<Photo>> GetPhotosForMemberAsync(string memberId);
    Task<Member?> GetMemberForUpdate(string id);
}
