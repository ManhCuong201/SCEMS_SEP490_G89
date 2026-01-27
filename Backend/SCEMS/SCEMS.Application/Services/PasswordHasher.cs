using System.Security.Cryptography;
using SCEMS.Application.Common.Interfaces;

namespace SCEMS.Application.Services;

public class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        using var pbkdf2 = new Rfc2898DeriveBytes(password, 16, 10000, HashAlgorithmName.SHA256);
        var salt = pbkdf2.Salt;
        var hash = pbkdf2.GetBytes(20);
        return Convert.ToBase64String(salt.Concat(hash).ToArray());
    }

    public bool VerifyPassword(string password, string hash)
    {
        var hashBytes = Convert.FromBase64String(hash);
        var salt = new byte[16];
        Array.Copy(hashBytes, 0, salt, 0, 16);

        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
        var hash2 = pbkdf2.GetBytes(20);

        for (int i = 0; i < 20; i++)
        {
            if (hashBytes[i + 16] != hash2[i])
                return false;
        }

        return true;
    }
}
