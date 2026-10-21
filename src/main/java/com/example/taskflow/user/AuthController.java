package com.example.taskflow.user;

import com.example.taskflow.user.dto.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.example.taskflow.user.dto.LoginRequest;
import com.example.taskflow.user.dto.LoginResponse;
import com.example.taskflow.user.dto.MeResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AppUser user = userService.register(request);

        return new RegisterResponse(user.getId(), user.getEmail());
    }


    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        String token = userService.login(
                request.email(),
                request.password()
        );

        return new LoginResponse(token, "Bearer");
    }

    @GetMapping("/me")
    public MeResponse getCurrentUser(Authentication authentication) {
        return userService.getCurrentUser(authentication);
    }


    public record RegisterResponse(Long id, String email) {
    }
}
