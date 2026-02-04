using System;
using Microsoft.EntityFrameworkCore;

namespace API.Helpers;

public class PaginatedReslut<T>
{
    public PaginationMetadata Metadata { get; set; } = default!;
    public List<T> Items { get; set; } = default!;
};

public class PaginationMetadata
{
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
};


public class PaginationHelper
{
    public static async Task<PaginatedReslut<T>> CreateAsync<T>(IQueryable<T> query, int pageNumber, int pageSize)
    {
        var count = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedReslut<T>
        {
            Metadata = new PaginationMetadata
            {
                CurrentPage = pageNumber,
                TotalPages = (int)Math.Ceiling(count / (double)pageSize),
                PageSize = pageSize,
                TotalCount = count
            },
            Items = items
        };
    }
}

