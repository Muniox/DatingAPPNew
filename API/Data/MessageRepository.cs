using System;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class MessageRepository(AppDbContext appDbContext) : IMessageRepository
{
    public void AddGroup(Group group)
    {
        appDbContext.Groups.Add(group);
    }

    public void AddMessage(Message message)
    {
        appDbContext.Add(message);
    }

    public void DeleteMessage(Message message)
    {
        appDbContext.Messages.Remove(message);
    }

    public async Task<Connection?> GetConnection(string connectionId)
    {
        return await appDbContext.Connections.FindAsync(connectionId);
    }

    public async Task<Group?> GetGroupForConnection(string connectionId)
    {
        return await appDbContext.Groups
            .Include(x => x.Connections)
            .Where(x => x.Connections.Any(c => c.ConnectionId == connectionId))
            .FirstOrDefaultAsync();
    }

    public async Task<Group?> GetMessaageGroup(string groupName)
    {
        return await appDbContext.Groups
            .Include(x => x.Connections)
            .FirstOrDefaultAsync(x => x.Name == groupName);
    }

    public async Task<Message?> GetMessageAsync(string messageId)
    {
        return await appDbContext.Messages.FindAsync(messageId);
    }

    public async Task<PaginatedReslut<MessageDto>> GetMessagesForMember(MessageParams messageParams)
    {
        var query = appDbContext.Messages
            .OrderByDescending(x => x.MessageSent)
            .AsQueryable();

        query = messageParams.Container switch
        {
            "Outbox" => query.Where(x => x.SenderId == messageParams.MemberId && x.SenderDeleted == false),
            _ => query.Where(x => x.RecipientId == messageParams.MemberId && x.RecipientDeleted == false)
        };

        var messageQuery = query.Select(MessageExtensions.ToDtoProjection());

        return await PaginationHelper.CreateAsync(messageQuery, messageParams.PageNumber, messageParams.PageSize);

    }

    public async Task<IReadOnlyCollection<MessageDto>> GetMessageThread(string currentMemberId, string recipientId)
    {
        await appDbContext.Messages
            .Where(x => x.RecipientId == currentMemberId && x.RecipientDeleted == false
                && x.SenderId == recipientId
                && x.DateRead == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.DateRead, DateTime.UtcNow));

        return await appDbContext.Messages
            .Where(x => (x.RecipientId == currentMemberId && x.SenderId == recipientId)
                || (x.SenderId == currentMemberId && x.SenderDeleted == false && x.RecipientId == recipientId))
            .OrderBy(x => x.MessageSent)
            .Select(MessageExtensions.ToDtoProjection())
            .ToListAsync();
    }

    public async Task RemoveConnection(string connectionId)
    {
        await appDbContext.Connections
            .Where(x => x.ConnectionId == connectionId)
            .ExecuteDeleteAsync();
    }

    public async Task<bool> SaveAllAsync()
    {
        return await appDbContext.SaveChangesAsync() > 0;
    }
}
