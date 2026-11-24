package com.escuelanatacion.web;

import com.escuelanatacion.model.CatalogosSat;
import com.escuelanatacion.model.DatosFiscales;
import com.escuelanatacion.model.Estudiante;
import com.escuelanatacion.model.Horario;
import com.fasterxml.jackson.annotation.JsonProperty;
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
                                String tutor, int diaPago, LocalDate fechaInscripcion, LocalDate primerPago,
                                LocalDate proximoPago, long diasParaPago, BigDecimal mensualidad,
                                BigDecimal cuotaInscripcion, boolean activo, String notas, String estado,
                                List<HorarioRef> horarios, LocalDate creado, FacturaDto factura) {
        static EstudianteDto de(Estudiante e, LocalDate hoy) {
            return new EstudianteDto(e.getId(), e.getNombre(), e.getApellidos(), e.nombreCompleto(),
                    e.getFechaNacimiento(), e.edad(), e.getTelefono(), e.getEmail(), e.getTutor(),
                    e.diaDePago(), e.inscripcion(), e.primerPago(), e.proximoPago(hoy), e.diasParaPago(hoy),
                    e.getMensualidad(), e.getCuotaInscripcion(), e.isActivo(), e.getNotas(), e.estadoPago(hoy),
                    e.getHorarios().stream().map(HorarioRef::de).toList(), e.getCreado().toLocalDate(),
                    FacturaDto.de(e.getFactura()));
        }
    }

    /** Datos de facturación con la descripción de las claves del SAT. */
    public record FacturaDto(boolean requiere, String rfc, String razonSocial, String tipoPersona,
                             String regimenFiscal, String regimenTexto, String codigoPostal, String usoCfdi,
                             String usoTexto, String correo) {
        static FacturaDto de(DatosFiscales f) {
            String tipo = f.getRfc() == null ? null : CatalogosSat.esPersonaFisica(f.getRfc()) ? "fisica" : "moral";
            return new FacturaDto(f.pideFactura(), f.getRfc(), f.getRazonSocial(), tipo, f.getRegimenFiscal(),
                    CatalogosSat.regimen(f.getRegimenFiscal()).map(CatalogosSat.Clave::descripcion).orElse(null),
                    f.getCodigoPostal(), f.getUsoCfdi(),
                    CatalogosSat.uso(f.getUsoCfdi()).map(CatalogosSat.Clave::descripcion).orElse(null),
                    f.getCorreo());
        }
    }

    /** Un pago de un alumno que pide factura: qué concepto, cuánto y cuándo. */
    public record PorFacturar(Long estudianteId, String alumno, String concepto, BigDecimal importe,
                              LocalDate fecha, long dias, String cuando, FacturaDto factura) {
    }

    public record CatalogosSatDto(List<CatalogosSat.Clave> regimenes, List<CatalogosSat.Clave> usosCfdi) {
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
                                 String email, String tutor, BigDecimal mensualidad,
                                 BigDecimal cuotaInscripcion, Boolean activo, String notas, List<Long> horarios,
                                 FacturaForm factura) {
    }

    public record FacturaForm(Boolean requiere, String rfc, String razonSocial, String regimenFiscal,
                              String codigoPostal, String usoCfdi, String correo) {
    }

    /** Cuotas vigentes; {@code actualizados} = alumnos a los que se les cambió la mensualidad. */
    public record CuotasDto(BigDecimal inscripcion, BigDecimal mensualidad, int actualizados) {
    }

    public record CuotasForm(BigDecimal inscripcion, BigDecimal mensualidad,
                             @JsonProperty("aplicar_a_todos") Boolean aplicarATodos) {
    }

    public record HorarioForm(String nombre, List<String> dias, String horaInicio, String horaFin, String nivel,
                              String instructor, Integer cupo) {
    }
}
