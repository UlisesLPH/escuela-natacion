package com.escuelanatacion.web;

import com.escuelanatacion.model.Estudiante;
import com.escuelanatacion.repo.EstudianteRepository;
import com.escuelanatacion.repo.HorarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PanelController {

    private final EstudianteRepository estudiantes;
    private final HorarioRepository horarios;

    public PanelController(EstudianteRepository estudiantes, HorarioRepository horarios) {
        this.estudiantes = estudiantes;
        this.horarios = horarios;
    }

    @GetMapping("/api/panel")
    @Transactional(readOnly = true)
    public Dto.Panel panel() {
        LocalDate hoy = LocalDate.now();
        List<Estudiante> activos = estudiantes.findByActivoTrueOrderByNombreAscApellidosAsc();

        List<Dto.EstudianteDto> proximos = activos.stream()
                .filter(e -> e.diasParaPago(hoy) <= Estudiante.DIAS_AVISO)
                .sorted(Comparator.comparingLong((Estudiante e) -> e.diasParaPago(hoy))
                        .thenComparing(Estudiante::nombreCompleto))
                .map(e -> Dto.EstudianteDto.de(e, hoy))
                .toList();

        List<Dto.ClaseHoy> clasesHoy = horarios.findAllByOrderByHoraInicioAscNombreAsc().stream()
                .filter(h -> h.esElDia(hoy))
                .map(h -> new Dto.ClaseHoy(Dto.HorarioDto.de(h), h.getEstudiantes().stream()
                        .filter(Estudiante::isActivo)
                        .map(e -> new Dto.AlumnoRef(e.getId(), e.nombreCompleto()))
                        .toList()))
                .toList();

        BigDecimal ingreso = activos.stream().map(Estudiante::getMensualidad).reduce(BigDecimal.ZERO, BigDecimal::add);
        long hoyN = proximos.stream().filter(e -> e.diasParaPago() == 0).count();

        return new Dto.Panel(hoy, activos.size(), hoyN, proximos.size() - hoyN, ingreso, horarios.count(),
                clasesHoy, proximos);
    }
}
