package com.escuelanatacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderBy;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Estudiante {

    /** Días de anticipación con los que un pago se considera «próximo». */
    public static final int DIAS_AVISO = 7;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, length = 120)
    private String apellidos = "";

    private LocalDate fechaNacimiento;

    @Column(length = 30)
    private String telefono;

    @Column(length = 120)
    private String email;

    @Column(length = 120)
    private String tutor;

    /**
     * Día del mes en que le toca pagar. Siempre es el día de la fecha de inscripción
     * (se guarda para ordenar y consultar; ver {@link #setFechaInscripcion}).
     */
    @Column(nullable = false)
    private int diaPago = 1;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal mensualidad = BigDecimal.ZERO;

    /** Lo que pagó de inscripción al entrar (una sola vez). */
    @Column(precision = 10, scale = 2)
    private BigDecimal cuotaInscripcion;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(length = 2000)
    private String notas;

    @Column(nullable = false)
    private LocalDateTime creado = LocalDateTime.now();

    /**
     * Día en que se inscribió. Define el día de pago de cada mes, y el mes de la inscripción ya está
     * cubierto: el primer pago es el mes siguiente. Si falta (registros viejos) se usa la fecha de alta.
     */
    private LocalDate fechaInscripcion;

    /** Datos para facturar sus pagos; {@code requiere=false} si no pide factura. */
    @Embedded
    private DatosFiscales factura = new DatosFiscales();

    @ManyToMany
    @JoinTable(name = "horario_estudiante",
            joinColumns = @JoinColumn(name = "estudiante_id"),
            inverseJoinColumns = @JoinColumn(name = "horario_id"))
    @OrderBy("horaInicio ASC")
    private List<Horario> horarios = new ArrayList<>();

    public String nombreCompleto() {
        return (nombre + " " + (apellidos == null ? "" : apellidos)).trim();
    }

    public Integer edad() {
        return fechaNacimiento == null ? null : Period.between(fechaNacimiento, LocalDate.now()).getYears();
    }

    /** Al fijar la inscripción, el día de pago pasa a ser ese mismo día del mes. */
    public void setFechaInscripcion(LocalDate fechaInscripcion) {
        this.fechaInscripcion = fechaInscripcion;
        if (fechaInscripcion != null) {
            this.diaPago = fechaInscripcion.getDayOfMonth();
        }
    }

    public LocalDate inscripcion() {
        return fechaInscripcion != null ? fechaInscripcion : creado.toLocalDate();
    }

    /** Día del mes en que paga: el mismo día en que se inscribió. */
    public int diaDePago() {
        return inscripcion().getDayOfMonth();
    }

    /**
     * Fecha en que se paga la mensualidad de {@code mes}. Si ese mes no tiene el día
     * (p. ej. 30 o 31 en febrero, o 31 en abril), el pago se recorre al día 1 del mes siguiente.
     */
    public LocalDate fechaLimite(YearMonth mes) {
        int dia = diaDePago();
        return dia <= mes.lengthOfMonth() ? mes.atDay(dia) : mes.plusMonths(1).atDay(1);
    }

    /**
     * Primer pago: el mes de la inscripción ya está cubierto, así que es el del mes siguiente.
     * Ej.: inscrito el 24 de noviembre → primer pago el 24 de diciembre.
     */
    public LocalDate primerPago() {
        return fechaLimite(YearMonth.from(inscripcion()).plusMonths(1));
    }

    /** La siguiente fecha en que le toca pagar, contando hoy y nunca antes del primer pago. */
    public LocalDate proximoPago(LocalDate hoy) {
        YearMonth primerMes = YearMonth.from(inscripcion()).plusMonths(1);
        // Se empieza un mes atrás: el pago de febrero recorrido puede caer el 1 de este mes.
        YearMonth mes = YearMonth.from(hoy).minusMonths(1);
        if (mes.isBefore(primerMes)) {
            mes = primerMes;
        }
        LocalDate fecha = fechaLimite(mes);
        while (fecha.isBefore(hoy)) {
            mes = mes.plusMonths(1);
            fecha = fechaLimite(mes);
        }
        return fecha;
    }

    /** Nunca null: Hibernate deja el objeto vacío en null cuando todas sus columnas lo están. */
    public DatosFiscales getFactura() {
        if (factura == null) {
            factura = new DatosFiscales();
        }
        return factura;
    }

    /**
     * Mes que cubre un pago. Normalmente es el mes de la fecha, salvo cuando el pago se recorrió
     * al día 1 porque el mes no tenía el día (p. ej. el 1 de marzo paga febrero).
     */
    public YearMonth mesQueCubre(LocalDate fechaPago) {
        YearMonth mes = YearMonth.from(fechaPago);
        return fechaPago.getDayOfMonth() == 1 && diaDePago() != 1 ? mes.minusMonths(1) : mes;
    }

    public long diasParaPago(LocalDate hoy) {
        return ChronoUnit.DAYS.between(hoy, proximoPago(hoy));
    }

    /** hoy, pronto (en los próximos {@value #DIAS_AVISO} días) o programado. */
    public String estadoPago(LocalDate hoy) {
        long dias = diasParaPago(hoy);
        if (dias == 0) {
            return "hoy";
        }
        return dias <= DIAS_AVISO ? "pronto" : "programado";
    }
}
