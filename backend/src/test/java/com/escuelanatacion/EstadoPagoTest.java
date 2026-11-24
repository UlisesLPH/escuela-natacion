package com.escuelanatacion;

import static org.assertj.core.api.Assertions.assertThat;

import com.escuelanatacion.model.Estudiante;
import java.time.LocalDate;
import java.time.YearMonth;
import org.junit.jupiter.api.Test;

class EstadoPagoTest {

    private static Estudiante conDiaDePago(int dia) {
        Estudiante e = new Estudiante();
        e.setNombre("Ana");
        e.setDiaPago(dia);
        return e;
    }

    @Test
    void elProximoPagoEsEsteMesSiAunNoLlega() {
        Estudiante e = conDiaDePago(10);
        assertThat(e.proximoPago(LocalDate.of(2026, 3, 1))).isEqualTo(LocalDate.of(2026, 3, 10));
        assertThat(e.proximoPago(LocalDate.of(2026, 3, 10))).isEqualTo(LocalDate.of(2026, 3, 10));
    }

    @Test
    void siYaPasoElDiaElProximoPagoEsElMesSiguiente() {
        Estudiante e = conDiaDePago(10);
        assertThat(e.proximoPago(LocalDate.of(2026, 3, 11))).isEqualTo(LocalDate.of(2026, 4, 10));
        assertThat(e.proximoPago(LocalDate.of(2026, 12, 20))).isEqualTo(LocalDate.of(2027, 1, 10));
    }

    @Test
    void clasificaSegunLosDiasQueFaltan() {
        Estudiante e = conDiaDePago(10);
        assertThat(e.estadoPago(LocalDate.of(2026, 3, 10))).isEqualTo("hoy");
        assertThat(e.estadoPago(LocalDate.of(2026, 3, 5))).isEqualTo("pronto");
        assertThat(e.estadoPago(LocalDate.of(2026, 3, 3))).isEqualTo("pronto");
        assertThat(e.estadoPago(LocalDate.of(2026, 3, 1))).isEqualTo("programado");
        assertThat(e.diasParaPago(LocalDate.of(2026, 3, 1))).isEqualTo(9);
    }

    @Test
    void elDia31EnFebreroUsaElUltimoDia() {
        assertThat(conDiaDePago(31).fechaLimite(YearMonth.of(2026, 2))).isEqualTo(LocalDate.of(2026, 2, 28));
        assertThat(conDiaDePago(31).fechaLimite(YearMonth.of(2028, 2))).isEqualTo(LocalDate.of(2028, 2, 29));
        assertThat(conDiaDePago(31).proximoPago(LocalDate.of(2026, 2, 15))).isEqualTo(LocalDate.of(2026, 2, 28));
    }
}
