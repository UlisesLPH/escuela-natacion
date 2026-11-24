package com.escuelanatacion.web;

import com.escuelanatacion.model.Estudiante;
import com.escuelanatacion.model.Horario;
import com.escuelanatacion.repo.EstudianteRepository;
import com.escuelanatacion.repo.HorarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
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
@RequestMapping("/api/estudiantes")
@Transactional
public class EstudianteController {

    private final EstudianteRepository estudiantes;
    private final HorarioRepository horarios;

    public EstudianteController(EstudianteRepository estudiantes, HorarioRepository horarios) {
        this.estudiantes = estudiantes;
        this.horarios = horarios;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Dto.EstudianteDto> listar(@RequestParam(defaultValue = "") String q,
                                          @RequestParam(required = false) Long horario,
                                          @RequestParam(defaultValue = "") String estado,
                                          @RequestParam(defaultValue = "0") String inactivos) {
        LocalDate hoy = LocalDate.now();
        String busqueda = q.strip().toLowerCase(Locale.ROOT);
        List<Estudiante> base = "1".equals(inactivos)
                ? estudiantes.findAllByOrderByNombreAscApellidosAsc()
                : estudiantes.findByActivoTrueOrderByNombreAscApellidosAsc();

        Stream<Estudiante> flujo = base.stream();
        if (!busqueda.isEmpty()) {
            flujo = flujo.filter(e -> Stream.of(e.nombreCompleto(), e.getTutor(), e.getTelefono())
                    .anyMatch(c -> c != null && c.toLowerCase(Locale.ROOT).contains(busqueda)));
        }
        if (horario != null) {
            flujo = flujo.filter(e -> e.getHorarios().stream().anyMatch(h -> h.getId().equals(horario)));
        }
        return flujo.map(e -> Dto.EstudianteDto.de(e, hoy))
                .filter(d -> estado.isEmpty() || d.estado().equals(estado))
                .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public Dto.EstudianteDto ver(@PathVariable Long id) {
        return Dto.EstudianteDto.de(obtener(id), LocalDate.now());
    }

    @PostMapping
    public ResponseEntity<Dto.EstudianteDto> crear(@RequestBody Dto.EstudianteForm form) {
        return ResponseEntity.status(HttpStatus.CREATED).body(guardar(new Estudiante(), form, true));
    }

    @PutMapping("/{id}")
    public Dto.EstudianteDto editar(@PathVariable Long id, @RequestBody Dto.EstudianteForm form) {
        return guardar(obtener(id), form, false);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        estudiantes.delete(obtener(id));
        return ResponseEntity.noContent().build();
    }

    private Estudiante obtener(Long id) {
        return estudiantes.findById(id).orElseThrow(ManejoErrores::noEncontrado);
    }

    private Dto.EstudianteDto guardar(Estudiante e, Dto.EstudianteForm f, boolean nuevo) {
        List<String> errores = new ArrayList<>();

        String nombre = Campos.texto(f.nombre(), 80);
        if (nombre == null) {
            errores.add("El nombre es obligatorio.");
        }
        Integer dia = f.diaPago();
        if (dia == null || dia < 1 || dia > 31) {
            errores.add("El día de pago debe estar entre 1 y 31.");
        }
        BigDecimal mensualidad = f.mensualidad();
        if (mensualidad == null || mensualidad.signum() < 0) {
            errores.add("La mensualidad debe ser un número mayor o igual a 0.");
        }
        LocalDate nacimiento = Campos.fecha(f.fechaNacimiento(), "La fecha de nacimiento no es válida.", errores);
        if (nacimiento != null && nacimiento.isAfter(LocalDate.now())) {
            errores.add("La fecha de nacimiento no puede ser futura.");
        }

        boolean activo = nuevo || f.activo() == null || f.activo();
        List<Horario> elegidos = f.horarios() == null || f.horarios().isEmpty()
                ? List.of() : horarios.findAllById(f.horarios());
        Set<Long> actuales = e.getHorarios().stream().map(Horario::getId).collect(Collectors.toSet());
        for (Horario h : elegidos) {
            if (activo && !actuales.contains(h.getId()) && h.lleno()) {
                errores.add("El horario «%s» ya no tiene cupo (%d/%d).".formatted(h.getNombre(), h.ocupados(), h.getCupo()));
            }
        }
        if (!errores.isEmpty()) {
            throw new ValidacionException(errores);
        }

        e.setNombre(nombre);
        String apellidos = Campos.texto(f.apellidos(), 120);
        e.setApellidos(apellidos == null ? "" : apellidos);
        e.setFechaNacimiento(nacimiento);
        e.setTelefono(Campos.texto(f.telefono(), 30));
        e.setEmail(Campos.texto(f.email(), 120));
        e.setTutor(Campos.texto(f.tutor(), 120));
        e.setDiaPago(dia);
        e.setMensualidad(mensualidad);
        e.setActivo(activo);
        e.setNotas(Campos.texto(f.notas(), 2000));
        e.setHorarios(new ArrayList<>(elegidos));
        return Dto.EstudianteDto.de(estudiantes.save(e), LocalDate.now());
    }
}
