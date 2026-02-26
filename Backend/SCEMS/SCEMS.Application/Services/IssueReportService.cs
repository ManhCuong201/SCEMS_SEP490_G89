using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.IssueReport;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class IssueReportService : IIssueReportService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public IssueReportService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedResult<IssueReportResponseDto>> GetReportsAsync(PaginationParams @params, Guid? userId = null, IssueReportStatus? status = null)
    {
        var query = _unitOfWork.IssueReports.GetAll()
            .Include(ir => ir.CreatedByAccount)
            .Include(ir => ir.Room)
            .Include(ir => ir.Equipment)
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(ir => ir.CreatedBy == userId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(ir => ir.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(@params.Search))
        {
            var search = @params.Search.ToLowerInvariant();
            query = query.Where(ir => 
                (ir.Room != null && ir.Room.RoomName.ToLower().Contains(search)) ||
                (ir.Equipment != null && ir.Equipment.Name.ToLower().Contains(search)) ||
                ir.Description.ToLower().Contains(search)
            );
        }

        query = query.OrderByDescending(ir => ir.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((@params.PageIndex - 1) * @params.PageSize)
            .Take(@params.PageSize)
            .ToListAsync();

        var dtos = _mapper.Map<List<IssueReportResponseDto>>(items);

        return new PaginatedResult<IssueReportResponseDto>
        {
            Items = dtos,
            Total = total,
            PageIndex = @params.PageIndex,
            PageSize = @params.PageSize
        };
    }

    public async Task<IssueReportResponseDto?> GetReportByIdAsync(Guid id)
    {
        var report = await _unitOfWork.IssueReports.GetAll()
            .Include(ir => ir.CreatedByAccount)
            .Include(ir => ir.Room)
            .Include(ir => ir.Equipment)
            .FirstOrDefaultAsync(ir => ir.Id == id);

        return report != null ? _mapper.Map<IssueReportResponseDto>(report) : null;
    }

    public async Task<IssueReportResponseDto> CreateReportAsync(CreateIssueReportDto dto, Guid userId)
    {
        if (!dto.RoomId.HasValue && !dto.EquipmentId.HasValue)
        {
            throw new InvalidOperationException("Either RoomId or EquipmentId must be provided.");
        }

        var report = _mapper.Map<IssueReport>(dto);
        report.CreatedBy = userId;
        report.Status = IssueReportStatus.Open;

        await _unitOfWork.IssueReports.AddAsync(report);
        await _unitOfWork.SaveChangesAsync();

        return await GetReportByIdAsync(report.Id) ?? throw new InvalidOperationException("Failed to retrieve created report.");
    }

    public async Task<IssueReportResponseDto?> UpdateStatusAsync(Guid id, IssueReportStatus status)
    {
        var report = await _unitOfWork.IssueReports.GetByIdAsync(id);
        if (report == null) return null;

        report.Status = status;
        _unitOfWork.IssueReports.Update(report);
        await _unitOfWork.SaveChangesAsync();

        return await GetReportByIdAsync(id);
    }
}
