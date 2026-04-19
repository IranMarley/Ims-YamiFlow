namespace Ims.YamiFlow.Application.Common;

public interface IPaginatedQuery
{
    int Page { get; }
    int PageSize { get; }
}
