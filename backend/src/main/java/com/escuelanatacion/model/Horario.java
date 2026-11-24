package com.escuelanatacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderBy;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Horario {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    /** Códigos separados por coma, por ejemplo "lun,mie,vie". */
    @Column(nullable = false, length = 40)
    private String dias;

    @Column(nullable = false)
    private LocalTime horaInicio;

    @Column(nullable = false)
    private LocalTime horaFin;

    @Column(length = 40)
    private String nivel;

    @Column(length = 120)
    private String instructor;

    @Column(nullable = false)
    private int cupo = 10;

    @ManyToMany(mappedBy = "horarios")
    @OrderBy("nombre ASC, apellidos ASC")
    private List<Estudiante> estudiantes = new ArrayList<>();

    public List<String> listaDias() {
        if (dias == null || dias.isBlank()) {
            return List.of();
        }
        return Arrays.stream(dias.split(",")).filter(d -> !d.isBlank()).toList();
    }

    public String diasTexto() {
        return listaDias().stream().map(d -> Calendario.NOMBRE_DIA.getOrDefault(d, d))
                .collect(Collectors.joining(", "));
    }

    public String horaInicioTexto() {
        return horaInicio == null ? null : horaInicio.format(HH_MM);
    }

    public String horaFinTexto() {
        return horaFin == null ? null : horaFin.format(HH_MM);
    }

    public String rango() {
        return horaInicioTexto() + " – " + horaFinTexto();
    }

    public long ocupados() {
        return estudiantes.stream().filter(Estudiante::isActivo).count();
    }

    public boolean lleno() {
        return ocupados() >= cupo;
    }

    public boolean esElDia(LocalDate fecha) {
        return listaDias().contains(Calendario.codigoDia(fecha));
    }
}
