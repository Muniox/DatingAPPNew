using System.Security.Claims;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class MembersController(IMemberRepository memberRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<Member>>> GetMembers()
    {
        var members = await memberRepository.GetMembersAsync();

        return Ok(members);
    }

    // [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<Member>> GetMember(string id)
    {
        var member = await memberRepository.GetMemberByIdAsync(id);

        if(member is null)
        {
            return NotFound();
        }

        return member;
    }

    [HttpGet("{id}/photos")]
    public async Task<ActionResult<IReadOnlyCollection<Photo>>> GetMemberPhoto(string id)
    {
        var photos = await memberRepository.GetPhotosForMemberAsync(id);
        return Ok(photos);
    }

    [HttpPut]
    public async Task<ActionResult> UpdateMember(MemberUpdateDto memberUpdateDto)
    {
        var memberId = User.GetMemberId();

        var member = await memberRepository.GetMemberForUpdate(memberId);

        if (member is null) return BadRequest("Could not get member");

        member.DisplayName = memberUpdateDto.DisplayName ?? member.DisplayName;
        member.Description = memberUpdateDto.Description ?? member.Description;
        member.City = memberUpdateDto.City ?? member.City;
        member.Country = memberUpdateDto.Country ?? member.Country;

        member.User.DisplayName = memberUpdateDto.DisplayName ?? member.User.DisplayName;

        memberRepository.Update(member); // optional

        // Note: SaveAllAsync returns false if SaveChangesAsync() > 0 check fails (no changes made)
        // Better approach: use try-catch and return true from SaveAllAsync, let exceptions bubble up
        if (!await memberRepository.SaveAllAsync())
            return BadRequest("Failed to update user");

        return NoContent();
    }
}

