package com.escuelanatacion.web;

import com.escuelanatacion.model.Estudiante;
import com.escuelanatacion.model.Horario;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Objetos que entran y salen de la API (en JSON quedan en snake_case). */
public final class Dto {

    private Dto() {
    }

    // ---- Salida -------------------------------------------------------------

    public record HorarioRef(Long id, String nombre, String rango, String diasTexto, String nivel) {
        static HorarioRef de(Horario h) {
            return new HorarioRef(h.getId(), h.getNombre(), h.rango(), h.diasTexto(), h.getNivel());
        }
    }

    public record HorarioDto(Long id, String nombre, List<String> dias, String diasTexto, String horaInicio,
                             String horaFin, String rango, String nivel, String instructor, int cupo,
                             long ocupados, boolean lleno) {
        static HorarioDto de(Horario h) {
            return new HorarioDto(h.getId(), h.getNombre(), h.listaDias(), h.diasTexto(), h.horaInicioTexto(),
                    h.horaFinTexto(), h.rango(), h.getNivel(), h.getInstructor(), h.getCupo(), h.ocupados(),
                    h.lleno());
        }
    }

    /**
     * Alumno con su próxima fecha de pago. La web no cobra ni registra pagos:
     * solo indica cuándo le toca pagar.
     */
    public record EstudianteDto(Long id, String nombre, String apellidos, String nombreCompleto,
                                LocalDate fechaNacimiento, Integer edad, String telefono, String email,
                                String tutor, int diaPago, LocalDate proximoPago, long diasParaPago,
                                BigDecimal mensualidad, boolean activo, String notas, String estado,
                                List<HorarioRef> horarios, LocalDate creado) {
        static EstudianteDto de(Estudiante e, LocalDate hoy) {
            return new EstudianteDto(e.getId(), e.getNombre(), e.getApellidos(), e.nombreCompleto(),
                    e.getFechaNacimiento(), e.edad(), e.getTelefono(), e.getEmail(), e.getTutor(),
                    e.getDiaPago(), e.proximoPago(hoy), e.diasParaPago(hoy), e.getMensualidad(), e.isActivo(),
                    e.getNotas(), e.estadoPago(hoy), e.getHorarios().stream().map(HorarioRef::de).toList(),
                    e.getCreado().toLocalDate());
        }
    }

    public record HorarioDetalle(@JsonUnwrapped HorarioDto horario, List<EstudianteDto> estudiantes) {
        static HorarioDetalle de(Horario h) {
            LocalDate hoy = LocalDate.now();
            return new HorarioDetalle(HorarioDto.de(h),
                    h.getEstudiantes().stream().map(e -> EstudianteDto.de(e, hoy)).toList());
        }
    }

    public record AlumnoRef(Long id, String nombreCompleto) {
    }

    public record ClaseHoy(@JsonUnwrapped HorarioDto horario, List<AlumnoRef> alumnos) {
    }

    public record Panel(LocalDate fecha, int activos, long paganHoy, long paganPronto, BigDecimal ingresoMensual,
                        long horarios, List<ClaseHoy> clasesHoy, List<EstudianteDto> proximosPagos) {
    }

    public record Sesion(String token, String usuario) {
    }

    // ---- Entrada ------------------------------------------------------------

    public record LoginForm(String usuario, String password) {
    }

    public record EstudianteForm(String nombre, String apellidos, String fechaNacimiento, String telefono,
                                 String email, String tutor, Integer diaPago, BigDecimal mensualidad,
                                 Boolean activo, String notas, List<Long> horarios) {
    }

    public record HorarioForm(String nombre, List<String> dias, String horaInicio, String horaFin, String nivel,
                              String instructor, Integer cupo) {
    }
}
