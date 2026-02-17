using System.Text.RegularExpressions;

namespace SCEMS.Application.Common;

public static class Utils
{
    public static string GenerateCode(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return string.Empty;
        
        // Convert to uppercase
        string code = name.ToUpperInvariant();
        
        // Replace spaces with hyphens
        code = code.Replace(" ", "-");
        
        // Remove non-alphanumeric characters except hyphens
        code = Regex.Replace(code, "[^A-Z0-9-]", "");
        
        // Remove multiple consecutive hyphens
        code = Regex.Replace(code, "-+", "-");
        
        // Trim hyphens from ends
        code = code.Trim('-');
        
        return code;
    }
}
