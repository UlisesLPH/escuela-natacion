package com.escuelanatacion;

import static org.assertj.core.api.Assertions.assertThat;

import com.escuelanatacion.model.Estudiante;
import java.time.LocalDate;
import java.time.YearMonth;
import org.junit.jupiter.api.Test;

class EstadoPagoTest {

    private static Estudiante inscritoEl(int anio, int mes, int dia) {
        Estudiante e = new Estudiante();
        e.setNombre("Ana");
        e.setFechaInscripcion(LocalDate.of(anio, mes, dia));
        return e;
    }

    private static LocalDate f(int anio, int mes, int dia) {
        return LocalDate.of(anio, mes, dia);
    }

    // ---- El día de pago es el día de la inscripción --------------------------

    @Test
    void elDiaDePagoEsElDiaDeLaInscripcion() {
        Estudiante e = inscritoEl(2026, 11, 24);
        assertThat(e.diaDePago()).isEqualTo(24);
        assertThat(e.getDiaPago()).isEqualTo(24);
    }

    @Test
    void inscritoEl24DeNoviembrePagaEl24DeDiciembre() {
        Estudiante e = inscritoEl(2026, 11, 24);
        LocalDate hoy = f(2026, 11, 24);
        assertThat(e.primerPago()).isEqualTo(f(2026, 12, 24));
        assertThat(e.proximoPago(hoy)).isEqualTo(f(2026, 12, 24));
        assertThat(e.diasParaPago(hoy)).isEqualTo(30);
        assertThat(e.estadoPago(hoy)).isEqualTo("programado");
    }

    @Test
    void despuesDelPrimerPagoSigueElMismoDiaCadaMes() {
        Estudiante e = inscritoEl(2026, 11, 24);
        assertThat(e.proximoPago(f(2026, 12, 25))).isEqualTo(f(2027, 1, 24));
        assertThat(e.proximoPago(f(2027, 1, 24))).isEqualTo(f(2027, 1, 24));
    }

    @Test
    void clasificaSegunLosDiasQueFaltan() {
        Estudiante e = inscritoEl(2020, 1, 10);
        assertThat(e.estadoPago(f(2026, 3, 10))).isEqualTo("hoy");
        assertThat(e.estadoPago(f(2026, 3, 5))).isEqualTo("pronto");
        assertThat(e.estadoPago(f(2026, 3, 3))).isEqualTo("pronto");
        assertThat(e.estadoPago(f(2026, 3, 1))).isEqualTo("programado");
        assertThat(e.diasParaPago(f(2026, 3, 1))).isEqualTo(9);
    }

    // ---- Meses que no tienen ese día: se recorre al día 1 del mes siguiente ---

    @Test
    void sinDia30EnFebreroSeRecorreAl1DeMarzo() {
        Estudiante e = inscritoEl(2026, 1, 30);
        assertThat(e.fechaLimite(YearMonth.of(2026, 2))).isEqualTo(f(2026, 3, 1));
        assertThat(e.primerPago()).isEqualTo(f(2026, 3, 1));
        // El de marzo sí existe: 30 de marzo.
        assertThat(e.proximoPago(f(2026, 3, 2))).isEqualTo(f(2026, 3, 30));
    }

    @Test
    void elPagoRecorridoCaeHoyEl1DeMarzo() {
        Estudiante e = inscritoEl(2025, 6, 30);
        assertThat(e.proximoPago(f(2026, 2, 15))).isEqualTo(f(2026, 3, 1));
        assertThat(e.estadoPago(f(2026, 3, 1))).isEqualTo("hoy");
    }

    @Test
    void elDia31SeRecorreEnLosMesesDe30Dias() {
        Estudiante e = inscritoEl(2026, 1, 31);
        assertThat(e.fechaLimite(YearMonth.of(2026, 2))).isEqualTo(f(2026, 3, 1));
        assertThat(e.fechaLimite(YearMonth.of(2026, 3))).isEqualTo(f(2026, 3, 31));
        assertThat(e.fechaLimite(YearMonth.of(2026, 4))).isEqualTo(f(2026, 5, 1));
        assertThat(e.proximoPago(f(2026, 4, 15))).isEqualTo(f(2026, 5, 1));
    }

    @Test
    void enAnioBisiestoEl29DeFebreroSiExiste() {
        assertThat(inscritoEl(2028, 1, 29).primerPago()).isEqualTo(f(2028, 2, 29));
        assertThat(inscritoEl(2027, 1, 29).primerPago()).isEqualTo(f(2027, 3, 1));
    }

    @Test
    void sinFechaDeInscripcionUsaLaFechaDeAlta() {
        Estudiante e = new Estudiante();
        e.setNombre("Viejo");
        e.setCreado(f(2026, 11, 24).atTime(10, 0));
        assertThat(e.diaDePago()).isEqualTo(24);
        assertThat(e.primerPago()).isEqualTo(f(2026, 12, 24));
    }

    @Test
    void elPagoRecorridoAl1DeMarzoCubreFebrero() {
        Estudiante e = inscritoEl(2026, 1, 30);
        assertThat(e.mesQueCubre(f(2026, 3, 1))).isEqualTo(YearMonth.of(2026, 2));
        assertThat(e.mesQueCubre(f(2026, 3, 30))).isEqualTo(YearMonth.of(2026, 3));
        assertThat(inscritoEl(2026, 1, 1).mesQueCubre(f(2026, 3, 1))).isEqualTo(YearMonth.of(2026, 3));
    }
}
