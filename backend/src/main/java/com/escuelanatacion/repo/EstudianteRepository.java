package com.escuelanatacion.repo;

import com.escuelanatacion.model.Estudiante;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    List<Estudiante> findAllByOrderByNombreAscApellidosAsc();

    List<Estudiante> findByActivoTrueOrderByNombreAscApellidosAsc();
}
