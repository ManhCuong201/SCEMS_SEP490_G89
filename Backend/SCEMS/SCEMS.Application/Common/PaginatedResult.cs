namespace SCEMS.Application.Common;

public class PaginatedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }

    public int TotalPages => (Total + PageSize - 1) / PageSize;
    public bool HasPreviousPage => PageIndex > 1;
    public bool HasNextPage => PageIndex < TotalPages;
}
