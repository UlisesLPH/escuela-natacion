package com.escuelanatacion.config;

import com.escuelanatacion.repo.AdminRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
@EnableWebSecurity
public class SeguridadConfig {

    private static final String NO_AUTENTICADO =
            "{\"error\":\"Tu sesión no es válida o expiró. Vuelve a entrar.\"}";

    @Bean
    SecurityFilterChain cadena(HttpSecurity http, JwtService jwt, AdminRepository admins) throws Exception {
        http
                // La API no usa cookies: el token va en la cabecera Authorization, así que no hay CSRF.
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.POST, "/api/login").permitAll()
                        .requestMatchers("/api/salud", "/error").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.setCharacterEncoding("UTF-8");
                    res.getWriter().write(NO_AUTENTICADO);
                }))
                .addFilterBefore(new FiltroToken(jwt, admins), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Lee "Authorization: Bearer …" y, si el token es válido, autentica al administrador. */
    static class FiltroToken extends OncePerRequestFilter {
        private final JwtService jwt;
        private final AdminRepository admins;

        FiltroToken(JwtService jwt, AdminRepository admins) {
            this.jwt = jwt;
            this.admins = admins;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                throws ServletException, IOException {
            String cabecera = req.getHeader("Authorization");
            if (cabecera != null && cabecera.startsWith("Bearer ")) {
                jwt.validar(cabecera.substring(7))
                        .flatMap(admins::findById)
                        .ifPresent(admin -> SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(admin.getUsuario(), null, List.of())));
            }
            chain.doFilter(req, res);
        }
    }
}
