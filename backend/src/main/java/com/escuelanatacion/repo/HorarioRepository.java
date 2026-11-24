package com.escuelanatacion.repo;

import com.escuelanatacion.model.Horario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorarioRepository extends JpaRepository<Horario, Long> {
    List<Horario> findAllByOrderByHoraInicioAscNombreAsc();
}
