using System;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class UnitOfWork(AppDbContext appDbContext) : IUnitOfWork
{
    private IMemberRepository? _memberRepository;
    private IMessageRepository? _messageRepository;
    private ILikesRepository? _likesRepository;

    public IMemberRepository MemberRepository => _memberRepository ??= new MemberRepository(appDbContext);

    public IMessageRepository MessageRepository => _messageRepository ??= new MessageRepository(appDbContext);

    public ILikesRepository LikesRepository => _likesRepository ??= new LikesRepository(appDbContext);

    public async Task<bool> Complete()
    {
        try
        {
            return await appDbContext.SaveChangesAsync() > 0;
        }
        catch (DbUpdateException ex)
        {
            throw new Exception("An error occured while saving changes", ex);
        }
    }

    public bool HasChanges()
    {
        return appDbContext.ChangeTracker.HasChanges();
    }
}
