package com.escuelanatacion.config;

import com.escuelanatacion.model.Admin;
import com.escuelanatacion.repo.AdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Crea el administrador de ADMIN_USER / ADMIN_PASSWORD la primera vez que arranca la API. */
@Component
public class AdminInicial implements CommandLineRunner {

    private static final Logger LOG = LoggerFactory.getLogger(AdminInicial.class);

    private final AdminRepository admins;
    private final PasswordEncoder encoder;
    private final String usuario;
    private final String password;

    public AdminInicial(AdminRepository admins, PasswordEncoder encoder,
                        @Value("${app.admin.usuario}") String usuario,
                        @Value("${app.admin.password}") String password) {
        this.admins = admins;
        this.encoder = encoder;
        this.usuario = usuario;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (admins.findByUsuario(usuario).isEmpty()) {
            Admin admin = new Admin();
            admin.setUsuario(usuario);
            admin.setPasswordHash(encoder.encode(password));
            admins.save(admin);
            LOG.info("Administrador «{}» creado.", usuario);
        }
    }
}
