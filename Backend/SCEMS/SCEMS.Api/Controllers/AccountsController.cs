using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Account;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Api.Requests;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;

    public AccountsController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAccounts([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null)
    {
        var @params = new PaginationParams { PageIndex = pageIndex, PageSize = pageSize, Search = search, SortBy = sortBy };
        var result = await _accountService.GetAccountsAsync(@params);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAccountById(Guid id)
    {
        var account = await _accountService.GetAccountByIdAsync(id);
        if (account == null)
            return NotFound(new { message = "Account not found" });
        return Ok(account);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountDto dto)
    {
        try
        {
            var account = await _accountService.CreateAccountAsync(dto);
            return CreatedAtAction(nameof(GetAccountById), new { id = account.Id }, account);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAccount(Guid id, [FromBody] UpdateAccountDto dto)
    {
        try
        {
            var account = await _accountService.UpdateAccountAsync(id, dto);
            if (account == null)
                return NotFound(new { message = "Account not found" });
            return Ok(account);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAccount(Guid id)
    {
        var result = await _accountService.DeleteAccountAsync(id);
        if (!result)
            return NotFound(new { message = "Account not found" });
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var result = await _accountService.UpdateStatusAsync(id, request.Status);
        if (!result)
            return NotFound(new { message = "Account not found" });
        return Ok(new { message = "Status updated successfully" });
    }

    [HttpPost("import")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ImportAccounts(IFormFile file, [FromServices] IImportService importService)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty");

        using var stream = file.OpenReadStream();
        var result = await importService.ImportAccountsAsync(stream);
        
        return Ok(result);
    }

    [HttpGet("import/template")]
    public async Task<IActionResult> DownloadTemplate([FromServices] IImportService importService)
    {
        var stream = await importService.GetAccountTemplateStreamAsync();
        return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Account_Template.xlsx");
    }
}
