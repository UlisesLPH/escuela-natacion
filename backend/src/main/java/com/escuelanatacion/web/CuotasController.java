package com.escuelanatacion.web;

import com.escuelanatacion.model.Cuotas;
import com.escuelanatacion.model.Estudiante;
import com.escuelanatacion.repo.CuotasRepository;
import com.escuelanatacion.repo.EstudianteRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Cuotas vigentes: inscripción y mensualidad que se proponen a los alumnos nuevos. */
@RestController
@RequestMapping("/api/cuotas")
@Transactional
public class CuotasController {

    private final CuotasRepository cuotas;
    private final EstudianteRepository estudiantes;

    public CuotasController(CuotasRepository cuotas, EstudianteRepository estudiantes) {
        this.cuotas = cuotas;
        this.estudiantes = estudiantes;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public Dto.CuotasDto ver() {
        Cuotas c = cuotas.vigentes();
        return new Dto.CuotasDto(c.getInscripcion(), c.getMensualidad(), 0);
    }

    /**
     * Cambia las cuotas. Con {@code aplicar_a_todos} también actualiza la mensualidad
     * de los alumnos activos; si no, solo aplica a los que se inscriban después.
     */
    @PutMapping
    public Dto.CuotasDto guardar(@RequestBody Dto.CuotasForm f) {
        List<String> errores = new ArrayList<>();
        if (f.inscripcion() == null || f.inscripcion().signum() < 0) {
            errores.add("La inscripción debe ser un número mayor o igual a 0.");
        }
        if (f.mensualidad() == null || f.mensualidad().signum() < 0) {
            errores.add("La mensualidad debe ser un número mayor o igual a 0.");
        }
        if (!errores.isEmpty()) {
            throw new ValidacionException(errores);
        }

        Cuotas c = cuotas.vigentes();
        c.setInscripcion(f.inscripcion());
        c.setMensualidad(f.mensualidad());
        cuotas.save(c);

        int actualizados = 0;
        if (Boolean.TRUE.equals(f.aplicarATodos())) {
            for (Estudiante e : estudiantes.findByActivoTrueOrderByNombreAscApellidosAsc()) {
                if (e.getMensualidad().compareTo(f.mensualidad()) != 0) {
                    e.setMensualidad(f.mensualidad());
                    actualizados++;
                }
            }
        }
        return new Dto.CuotasDto(c.getInscripcion(), c.getMensualidad(), actualizados);
    }
}
