using API.Entities;
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
}

