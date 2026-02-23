using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
[ServiceFilter(typeof(LogUserActivity))]
[Route("api/[controller]")]
[ApiController]
public class MessagesController(IUnitOfWork uow) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<MessageDto>> CreateMessage(CreateMessageDto createMessageDto)
    {
        var sender = await uow.MemberRepository.GetMemberByIdAsync(User.GetMemberId());

        var recipient = await uow.MemberRepository.GetMemberByIdAsync(createMessageDto.RecipientId);

        if (recipient is null || sender is null || sender.Id == createMessageDto.RecipientId)
        {
            return BadRequest("Cannot send this message");
        }

        var message = new Message()
        {
            SenderId = sender.Id,
            RecipientId = recipient.Id,
            Content = createMessageDto.Content
        };

        uow.MessageRepository.AddMessage(message);

        if (!await uow.Complete())
        {
            return BadRequest("Failed to send message");
        }

        return message.ToDto();
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedReslut<MessageDto>>> GetMessagesByContainer([FromQuery] MessageParams messageParams)
    {
        messageParams.MemberId = User.GetMemberId();

        return await uow.MessageRepository.GetMessagesForMember(messageParams);
    }

    [HttpGet("thread/{recipientId}")]
    public async Task <ActionResult<IReadOnlyCollection<MessageDto>>> GetMessageThread(string recipientId)
    {
        return Ok(await uow.MessageRepository.GetMessageThread(User.GetMemberId(), recipientId));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteMessage(string id)
    {
        var memberId = User.GetMemberId();

        var message = await uow.MessageRepository.GetMessageAsync(id);

        if (message is null) return BadRequest("Cannot delete this message");

        if (message.SenderId == memberId) message.SenderDeleted = true;
        if (message.RecipientId == memberId) message.RecipientDeleted = true;

        if (message is {SenderDeleted: true, RecipientDeleted: true})
        {
            uow.MessageRepository.DeleteMessage(message);
        }

        if (!await uow.Complete()) BadRequest("Problem deleting the message");

        return Ok();
    }
}

