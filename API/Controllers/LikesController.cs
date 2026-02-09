using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ServiceFilter(typeof(LogUserActivity))]
[Route("api/[controller]")]
[ApiController]
public class LikesController(ILikesRepository likesRepository) : ControllerBase
{
    [HttpPost("{targetMemberId}")]
    public async Task<ActionResult> ToggleLike(string targetMemberId)
    {
        var sourceMemberId = User.GetMemberId();

        if (sourceMemberId == targetMemberId) return BadRequest("You cannot like yorself");

        var existingLike = await likesRepository.GetMemberLike(sourceMemberId, targetMemberId);

        if (existingLike is null)
        {
            var like = new MemberLike()
            {
                SourceMemberId = sourceMemberId,
                TargetMemberId = targetMemberId
            };

            likesRepository.AddLike(like);
        }
        else
        {
            likesRepository.DeleteLike(existingLike);
        }

        if (!await likesRepository.SaveAllChanges()) return BadRequest("Failed to updae like");
        
        return Ok();
    }

    [HttpGet("list")]
    public async Task<ActionResult<IEnumerable<string>>> GetCurrentMemberLikeIds()
    {
        return Ok(await likesRepository.GetCurrentMemberLikeIds(User.GetMemberId()));
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedReslut<Member>>> GetMemberLikes([FromQuery] LikesParams likesParams)
    {
        likesParams.MemberId = User.GetMemberId();
        var members = await likesRepository.GetMemberLikes(likesParams);

        return members;
    }
}

