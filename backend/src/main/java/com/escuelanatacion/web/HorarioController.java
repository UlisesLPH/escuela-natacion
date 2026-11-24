package com.escuelanatacion.web;

import com.escuelanatacion.model.Calendario;
import com.escuelanatacion.model.Horario;
import com.escuelanatacion.repo.HorarioRepository;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/horarios")
@Transactional
public class HorarioController {

    private final HorarioRepository horarios;

    public HorarioController(HorarioRepository horarios) {
        this.horarios = horarios;
    }

    /** Agrupa por días (L-M-V, luego M-J, luego sábado…) y dentro de cada grupo por hora. */
    private static final Comparator<Horario> ORDEN = Comparator
            .comparingInt((Horario h) -> h.listaDias().isEmpty() ? 99 : Calendario.DIAS.indexOf(h.listaDias().get(0)))
            .thenComparing(Horario::getDias)
            .thenComparing(Horario::getHoraInicio)
            .thenComparing(Horario::getNombre);

    @GetMapping
    @Transactional(readOnly = true)
    public List<Dto.HorarioDto> listar(@RequestParam(defaultValue = "") String dia) {
        return horarios.findAll().stream()
                .filter(h -> !Calendario.DIAS.contains(dia) || h.listaDias().contains(dia))
                .sorted(ORDEN)
                .map(Dto.HorarioDto::de)
                .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public Dto.HorarioDetalle ver(@PathVariable Long id) {
        return Dto.HorarioDetalle.de(obtener(id));
    }

    @PostMapping
    public ResponseEntity<Dto.HorarioDetalle> crear(@RequestBody Dto.HorarioForm form) {
        return ResponseEntity.status(HttpStatus.CREATED).body(guardar(new Horario(), form, true));
    }

    @PutMapping("/{id}")
    public Dto.HorarioDetalle editar(@PathVariable Long id, @RequestBody Dto.HorarioForm form) {
        return guardar(obtener(id), form, false);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        Horario h = obtener(id);
        // El estudiante es dueño de la relación: se le quita el horario antes de borrarlo.
        h.getEstudiantes().forEach(e -> e.getHorarios().remove(h));
        horarios.delete(h);
        return ResponseEntity.noContent().build();
    }

    private Horario obtener(Long id) {
        return horarios.findById(id).orElseThrow(ManejoErrores::noEncontrado);
    }

    private Dto.HorarioDetalle guardar(Horario h, Dto.HorarioForm f, boolean nuevo) {
        List<String> errores = new ArrayList<>();

        String nombre = Campos.texto(f.nombre(), 120);
        if (nombre == null) {
            errores.add("El nombre del grupo es obligatorio.");
        }
        List<String> elegidos = f.dias() == null ? List.of() : f.dias();
        List<String> dias = Calendario.DIAS.stream().filter(elegidos::contains).toList();
        if (dias.isEmpty()) {
            errores.add("Selecciona al menos un día.");
        }
        LocalTime inicio = Campos.hora(f.horaInicio());
        LocalTime fin = Campos.hora(f.horaFin());
        if (inicio == null || fin == null) {
            errores.add("Indica la hora de inicio y de fin.");
        } else if (!fin.isAfter(inicio)) {
            errores.add("La hora de fin debe ser posterior a la de inicio.");
        }
        Integer cupo = f.cupo();
        if (cupo == null || cupo < 1 || cupo > 500) {
            errores.add("El cupo debe ser un número entre 1 y 500.");
        } else if (!nuevo && cupo < h.ocupados()) {
            errores.add("El cupo no puede ser menor a los %d alumnos inscritos.".formatted(h.ocupados()));
        }
        if (!errores.isEmpty()) {
            throw new ValidacionException(errores);
        }

        h.setNombre(nombre);
        h.setDias(String.join(",", dias));
        h.setHoraInicio(inicio);
        h.setHoraFin(fin);
        h.setNivel(Campos.texto(f.nivel(), 40));
        h.setInstructor(Campos.texto(f.instructor(), 120));
        h.setCupo(cupo);
        return Dto.HorarioDetalle.de(horarios.save(h));
    }
}
