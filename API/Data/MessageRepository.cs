using System;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;

namespace API.Data;

public class MessageRepository(AppDbContext appDbContext) : IMessageRepository
{
    public void AddMessage(Message message)
    {
        appDbContext.Add(message);
    }

    public void DeleteMessage(Message message)
    {
        appDbContext.Messages.Remove(message);
    }

    public async Task<Message?> GetMessageAsync(string messageId)
    {
        return await appDbContext.Messages.FindAsync(messageId);
    }

    public Task<PaginatedReslut<MessageDto>> GetMessagesForMember()
    {
        throw new NotImplementedException();
    }

    public Task<IReadOnlyCollection<MessageDto>> GetMessageThread(string currentMemberId, string recipientId)
    {
        throw new NotImplementedException();
    }

    public async Task<bool> SaveAllAsync()
    {
        return await appDbContext.SaveChangesAsync() > 0;
    }
}
