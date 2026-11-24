package com.escuelanatacion.model;

import jakarta.persistence.Column;
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

    /** Día del mes en que le toca pagar (1–31). */
    @Column(nullable = false)
    private int diaPago = 1;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal mensualidad = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(length = 2000)
    private String notas;

    @Column(nullable = false)
    private LocalDateTime creado = LocalDateTime.now();

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

    /** Fecha de pago de un mes; si el día no existe (p. ej. 31 en febrero) se usa el último. */
    public LocalDate fechaLimite(YearMonth mes) {
        return mes.atDay(Math.min(diaPago, mes.lengthOfMonth()));
    }

    /** La siguiente fecha en que le toca pagar, contando hoy. */
    public LocalDate proximoPago(LocalDate hoy) {
        YearMonth mes = YearMonth.from(hoy);
        LocalDate esteMes = fechaLimite(mes);
        return esteMes.isBefore(hoy) ? fechaLimite(mes.plusMonths(1)) : esteMes;
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
