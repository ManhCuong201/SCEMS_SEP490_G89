using Xunit;
using Moq;
using SCEMS.Application.Services;
using SCEMS.Infrastructure.Repositories;
using AutoMapper;
using SCEMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using SCEMS.Infrastructure.DbContext;
using System.IO;
using ClosedXML.Excel;
using SCEMS.Domain.Enums;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Application.DTOs.Import;

namespace SCEMS.Tests;

public class ImportTests
{
    [Fact]
    public async Task ImportRoomAsync_ValidFile_ImportsRooms()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ScemsDbContext>()
            .UseInMemoryDatabase(databaseName: "SCEMS_Test_Room")
            .Options;
            
        using var context = new ScemsDbContext(options);
        var unitOfWork = new UnitOfWork(context);
        var mapperMock = new Mock<IMapper>();
        
        var service = new RoomService(unitOfWork, mapperMock.Object);
        
        // Create Excel file
        using var stream = new MemoryStream();
        using (var workbook = new XLWorkbook())
        {
            var worksheet = workbook.Worksheets.Add("Rooms");
            worksheet.Cell(1, 1).Value = "Code";
            worksheet.Cell(1, 2).Value = "Name";
            worksheet.Cell(1, 3).Value = "Capacity";
            worksheet.Cell(1, 4).Value = "Status";
            worksheet.Cell(1, 5).Value = "Type";
            worksheet.Cell(1, 6).Value = "Dept";
            
            worksheet.Cell(2, 1).Value = "T101";
            worksheet.Cell(2, 2).Value = "Test Room 1";
            worksheet.Cell(2, 3).Value = 40;
            worksheet.Cell(2, 4).Value = "Available";
            
            workbook.SaveAs(stream);
        }
        stream.Position = 0;

        // Act
        var result = await service.ImportRoomAsync(stream);

        // Assert
        Assert.Equal(1, result.SuccessCount);
        var room = await context.Rooms.FirstOrDefaultAsync(r => r.RoomCode == "T101");
        Assert.NotNull(room);
        Assert.Equal("Test Room 1", room.RoomName);
        Assert.Equal(40, room.Capacity);
    }

    [Fact]
    public async Task ImportEquipmentAsync_ValidFile_ImportsEquipment()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ScemsDbContext>()
            .UseInMemoryDatabase(databaseName: "SCEMS_Test_Equipment")
            .Options;
            
        using var context = new ScemsDbContext(options);
        var unitOfWork = new UnitOfWork(context);
        var mapperMock = new Mock<IMapper>();
        var notificationMock = new Mock<INotificationService>();
        
        // Pre-seed room and type
        var room = new Room { RoomName = "Room1", RoomCode = "R1", Capacity = 10, Status = RoomStatus.Available };
        var type = new EquipmentType { Name = "Projector", Code = "PRJ", Status = EquipmentTypeStatus.Active };
        context.Rooms.Add(room);
        context.EquipmentTypes.Add(type);
        await context.SaveChangesAsync();

        var service = new EquipmentService(unitOfWork, mapperMock.Object, notificationMock.Object);
        
        // Create Excel file
        using var stream = new MemoryStream();
        using (var workbook = new XLWorkbook())
        {
            var worksheet = workbook.Worksheets.Add("Equipment");
            worksheet.Cell(1, 1).Value = "Name";
            worksheet.Cell(1, 2).Value = "Description";
            worksheet.Cell(1, 3).Value = "Type Code";
            worksheet.Cell(1, 4).Value = "Room Code";
            worksheet.Cell(1, 5).Value = "Status";
            
            worksheet.Cell(2, 1).Value = "Epson 123";
            worksheet.Cell(2, 2).Value = "Projector Description";
            worksheet.Cell(2, 3).Value = "PRJ";
            worksheet.Cell(2, 4).Value = "R1";
            worksheet.Cell(2, 5).Value = "Working";
            
            workbook.SaveAs(stream);
        }
        stream.Position = 0;

        // Act
        var result = await service.ImportEquipmentAsync(stream);

        // Assert
        Assert.Equal(1, result.SuccessCount);
        var eq = await context.Equipment.FirstOrDefaultAsync(e => e.Name == "Epson 123");
        Assert.NotNull(eq);
        Assert.Equal("Epson 123", eq.Name);
        Assert.Equal("Projector Description", eq.Description);
        Assert.Equal(room.Id, eq.RoomId);
        Assert.Equal(type.Id, eq.EquipmentTypeId);
    }
}
