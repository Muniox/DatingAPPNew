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
public class LikesController(IUnitOfWork uow) : ControllerBase
{
    [HttpPost("{targetMemberId}")]
    public async Task<ActionResult> ToggleLike(string targetMemberId)
    {
        var sourceMemberId = User.GetMemberId();

        if (sourceMemberId == targetMemberId) return BadRequest("You cannot like yorself");

        var existingLike = await uow.LikesRepository.GetMemberLike(sourceMemberId, targetMemberId);

        if (existingLike is null)
        {
            var like = new MemberLike()
            {
                SourceMemberId = sourceMemberId,
                TargetMemberId = targetMemberId
            };

            uow.LikesRepository.AddLike(like);
        }
        else
        {
            uow.LikesRepository.DeleteLike(existingLike);
        }

        if (!await uow.Complete()) return BadRequest("Failed to updae like");
        
        return Ok();
    }

    [HttpGet("list")]
    public async Task<ActionResult<IEnumerable<string>>> GetCurrentMemberLikeIds()
    {
        return Ok(await uow.LikesRepository.GetCurrentMemberLikeIds(User.GetMemberId()));
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedReslut<Member>>> GetMemberLikes([FromQuery] LikesParams likesParams)
    {
        likesParams.MemberId = User.GetMemberId();
        var members = await uow.LikesRepository.GetMemberLikes(likesParams);

        return members;
    }
}

