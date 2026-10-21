package com.example.taskflow.user;

import com.example.taskflow.user.dto.MeResponse;
import com.example.taskflow.user.dto.RegisterRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.taskflow.security.JwtService;
import org.springframework.security.core.Authentication;

@Service
public class UserService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AppUser register(RegisterRequest request) {

        String email = request.email().trim().toLowerCase();

        if (appUserRepository.existsByEmail(email)) {
            throw new InvalidCredentialsException();
        }

        AppUser user = new AppUser();
        user.setEmail(email);

        // Never store the original password in the database.
        user.setPasswordHash(
                passwordEncoder.encode(request.password())
        );

        return appUserRepository.save(user);
    }



    public String login(String email, String password) {

        AppUser user = appUserRepository
                .findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid email or password"
                ));

        if (!passwordEncoder.matches(
                password,
                user.getPasswordHash()
        )) {
            throw new InvalidCredentialsException();
        }

        return jwtService.generateToken(user.getEmail());
    }

    public MeResponse getCurrentUser(Authentication authentication) {
        String email = authentication.getName();

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        return new MeResponse(user.getId(), user.getEmail());
    }

}
