package com.escuelanatacion.web;

import com.escuelanatacion.config.JwtService;
import com.escuelanatacion.repo.AdminRepository;
import java.security.Principal;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AdminRepository admins;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(AdminRepository admins, PasswordEncoder encoder, JwtService jwt) {
        this.admins = admins;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Dto.LoginForm form) {
        String usuario = form.usuario() == null ? "" : form.usuario().strip();
        String password = form.password() == null ? "" : form.password();
        return admins.findByUsuario(usuario)
                .filter(a -> encoder.matches(password, a.getPasswordHash()))
                .<ResponseEntity<?>>map(a -> ResponseEntity.ok(new Dto.Sesion(jwt.emitir(a.getId()), a.getUsuario())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Usuario o contraseña incorrectos.")));
    }

    @GetMapping("/yo")
    public Map<String, String> yo(Principal principal) {
        return Map.of("usuario", principal.getName());
    }

    @GetMapping("/salud")
    public Map<String, Boolean> salud() {
        return Map.of("ok", true);
    }
}
