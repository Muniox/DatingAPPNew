using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ServiceFilter(typeof(LogUserActivity))]
[Authorize]
[Route("api/[controller]")]
[ApiController]
public class MembersController(IUnitOfWork uow, IPhotoService photoService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<Member>>> GetMembers([FromQuery]MemberParams memberParams)
    {
        var members = await uow.MemberRepository.GetMembersAsync(memberParams);

        memberParams.CurrentMemberId = User.GetMemberId();

        return Ok(members);
    }

    // [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<Member>> GetMember(string id)
    {
        var member = await uow.MemberRepository.GetMemberByIdAsync(id);

        if(member is null)
        {
            return NotFound();
        }

        return member;
    }

    [HttpGet("{id}/photos")]
    public async Task<ActionResult<IReadOnlyCollection<Photo>>> GetMemberPhoto(string id)
    {
        var photos = await uow.MemberRepository.GetPhotosForMemberAsync(id);
        return Ok(photos);
    }

    [HttpPut]
    public async Task<ActionResult> UpdateMember(MemberUpdateDto memberUpdateDto)
    {
        var memberId = User.GetMemberId();

        var member = await uow.MemberRepository.GetMemberForUpdate(memberId);

        if (member is null) return BadRequest("Could not get member");

        member.DisplayName = memberUpdateDto.DisplayName ?? member.DisplayName;
        member.Description = memberUpdateDto.Description ?? member.Description;
        member.City = memberUpdateDto.City ?? member.City;
        member.Country = memberUpdateDto.Country ?? member.Country;

        member.User.DisplayName = memberUpdateDto.DisplayName ?? member.User.DisplayName;

        uow.MemberRepository.Update(member); // optional

        // Note: SaveAllAsync returns false if SaveChangesAsync() > 0 check fails (no changes made)
        // Better approach: use try-catch and return true from SaveAllAsync, let exceptions bubble up
        if (!await uow.Complete())
            return BadRequest("Failed to update user");

        return NoContent();
    }

    [HttpPost("add-photo")]
    public async Task<ActionResult<Photo>> AddPhoto([FromForm]IFormFile file)
    {
        var memberId = User.GetMemberId();

        var member = await uow.MemberRepository.GetMemberForUpdate(memberId);

        if (member is null) return BadRequest("Cannot update member");

        var result = await photoService.UploadPhotoAsync(file);

        if (result.Error is not null) return BadRequest(result.Error.Message);

        var photo = new Photo
        {
            Url = result.SecureUrl.AbsoluteUri,
            PublicId = result.PublicId,
            MemberId = User.GetMemberId(),
        };

        if (member.ImageUrl is null)
        {
            member.ImageUrl = photo.Url;
            member.User.ImageUrl = photo.Url;
        }

        member.Photos.Add(photo);

        if (!await uow.Complete()) return BadRequest("Problem adding photo");

        return photo;
    }

    [HttpPut("set-main-photo/{photoId}")]
    public async Task<ActionResult> SetMainPhoto(int photoId)
    {
        var member = await uow.MemberRepository.GetMemberForUpdate(User.GetMemberId());

        if (member is null) return BadRequest("Cannot get member from token");

        var photo = member.Photos.SingleOrDefault(x => x.Id == photoId);

        if (member.ImageUrl == photo?.Url || photo == null)
        {
            return BadRequest("Cannot set this as main image");
        }

        member.ImageUrl = photo.Url;
        member.User.ImageUrl = photo.Url;

        if (!await uow.Complete()) return BadRequest("Problem setting main photo");

        return NoContent();
    }

    [HttpDelete("delete-photo/{photoId:int}")]
    public async Task<ActionResult> DeletePhoto(int photoId)
    {
        var member = await uow.MemberRepository.GetMemberForUpdate(User.GetMemberId());

        if (member is null) return BadRequest("Cannot get member from token");

        var photo = member.Photos.SingleOrDefault(x => x.Id == photoId);

        if (photo is null || photo.Url == member.ImageUrl)
        {
            return BadRequest("This photo cannot be deleted");
        }

        if (photo.PublicId is not null)
        {
            var result = await photoService.DeletePhotoAsync(photo.PublicId);
            if (result.Error is not null) return BadRequest(result.Error.Message);
        }

        member.Photos.Remove(photo);

        if (!await uow.Complete()) return BadRequest("Problem deletinf the photo");

        return Ok();
    }
}

