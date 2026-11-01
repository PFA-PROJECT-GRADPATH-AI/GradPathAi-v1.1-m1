using GradPath.Member1.Api.Contracts;
using GradPath.Member1.Api.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.Member1.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
    }

    /// <summary>POST /api/v1/auth/register</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(error.Code, error.Description);
            return ValidationProblem(ModelState);
        }

        await _signInManager.SignInAsync(user, isPersistent: false);
        _logger.LogInformation("Auth.RegisterSucceeded UserId={UserId}", user.Id);

        return Ok(new UserInfoDto(user.Id, user.Email!, user.FullName, HasProfile: false));
    }

    /// <summary>POST /api/v1/auth/login</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var result = await _signInManager.PasswordSignInAsync(dto.Email, dto.Password, isPersistent: false, lockoutOnFailure: false);
        if (!result.Succeeded)
        {
            _logger.LogWarning("Auth.LoginFailed Reason={Reason}", "InvalidCredentials");
            return Unauthorized(new { detail = "Invalid email or password." });
        }

        var user = await _userManager.FindByEmailAsync(dto.Email);
        _logger.LogInformation("Auth.LoginSucceeded UserId={UserId}", user!.Id);

        return Ok(new UserInfoDto(user.Id, user.Email!, user.FullName, HasProfile: user.Profile is not null));
    }

    /// <summary>POST /api/v1/auth/logout</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Logged out successfully." });
    }

    /// <summary>GET /api/v1/auth/me</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        return Ok(new UserInfoDto(user.Id, user.Email!, user.FullName, HasProfile: user.Profile is not null));
    }
}
