package com.escuelanatacion.repo;

import com.escuelanatacion.model.Admin;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsuario(String usuario);
}
