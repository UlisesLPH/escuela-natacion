package com.escuelanatacion.config;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Emite y valida los tokens de sesión del administrador (JWT firmado con HS256). */
@Service
public class JwtService {

    private final SecretKey clave;
    private final Duration vigencia;

    public JwtService(@Value("${app.secret}") String secreto, @Value("${app.token-horas}") long horas) {
        this.clave = Keys.hmacShaKeyFor(sha256(secreto));
        this.vigencia = Duration.ofHours(horas);
    }

    public String emitir(Long adminId) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(adminId))
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(vigencia)))
                .signWith(clave)
                .compact();
    }

    public Optional<Long> validar(String token) {
        try {
            String sub = Jwts.parser().verifyWith(clave).build().parseSignedClaims(token).getPayload().getSubject();
            return Optional.of(Long.valueOf(sub));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /** Deriva una clave de 256 bits a partir de cualquier texto secreto. */
    private static byte[] sha256(String texto) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
