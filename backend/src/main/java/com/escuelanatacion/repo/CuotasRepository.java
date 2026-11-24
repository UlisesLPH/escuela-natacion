package com.escuelanatacion.repo;

import com.escuelanatacion.model.Cuotas;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CuotasRepository extends JpaRepository<Cuotas, Long> {

    /** Las cuotas vigentes; si aún no existen, las iniciales (250 / 850) sin guardar. */
    default Cuotas vigentes() {
        return findById(Cuotas.ID).orElseGet(Cuotas::new);
    }
}
