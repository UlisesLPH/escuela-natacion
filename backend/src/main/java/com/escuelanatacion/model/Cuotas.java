package com.escuelanatacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

/**
 * Cuotas vigentes de la escuela (un solo registro, id = 1). Son los montos que se proponen
 * al inscribir a un alumno nuevo: inscripción (una sola vez) y mensualidad.
 */
@Entity
@Getter
@Setter
public class Cuotas {

    public static final long ID = 1L;
    public static final BigDecimal INSCRIPCION_INICIAL = new BigDecimal("250.00");
    public static final BigDecimal MENSUALIDAD_INICIAL = new BigDecimal("850.00");

    @Id
    private Long id = ID;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal inscripcion = INSCRIPCION_INICIAL;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal mensualidad = MENSUALIDAD_INICIAL;
}
