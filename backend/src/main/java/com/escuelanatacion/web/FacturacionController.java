package com.escuelanatacion.web;

import com.escuelanatacion.model.CatalogosSat;
import com.escuelanatacion.model.Estudiante;
import com.escuelanatacion.repo.EstudianteRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Facturación: a quién hay que facturar, por qué concepto y por cuánto. La aplicación no emite
 * el CFDI; reúne los datos para capturarlos en el portal de facturación.
 */
@RestController
@Transactional(readOnly = true)
public class FacturacionController {

    private static final Locale ES = Locale.forLanguageTag("es-MX");

    private final EstudianteRepository estudiantes;

    public FacturacionController(EstudianteRepository estudiantes) {
        this.estudiantes = estudiantes;
    }

    @GetMapping("/api/catalogos/sat")
    public Dto.CatalogosSatDto catalogos() {
        return new Dto.CatalogosSatDto(CatalogosSat.REGIMENES, CatalogosSat.USOS_CFDI);
    }

    /** Próximo pago a facturar de cada alumno activo que pide factura, del más cercano al más lejano. */
    @GetMapping("/api/facturacion")
    public List<Dto.PorFacturar> porFacturar() {
        LocalDate hoy = LocalDate.now();
        return estudiantes.findByActivoTrueOrderByNombreAscApellidosAsc().stream()
                .filter(e -> e.getFactura().pideFactura())
                .map(e -> pendiente(e, hoy))
                .sorted(Comparator.comparing(Dto.PorFacturar::fecha).thenComparing(Dto.PorFacturar::alumno))
                .toList();
    }

    static Dto.PorFacturar pendiente(Estudiante e, LocalDate hoy) {
        Dto.FacturaDto factura = Dto.FacturaDto.de(e.getFactura());
        if (e.inscripcion().equals(hoy)) {
            // Se inscribió hoy: paga inscripción + la mensualidad de este mes.
            BigDecimal inscripcion = e.getCuotaInscripcion() == null ? BigDecimal.ZERO : e.getCuotaInscripcion();
            return new Dto.PorFacturar(e.getId(), e.nombreCompleto(),
                    "Inscripción y mensualidad de " + mes(YearMonth.from(hoy)),
                    inscripcion.add(e.getMensualidad()), hoy, 0, "hoy", factura);
        }
        LocalDate fecha = e.proximoPago(hoy);
        return new Dto.PorFacturar(e.getId(), e.nombreCompleto(),
                "Mensualidad de " + mes(e.mesQueCubre(fecha)),
                e.getMensualidad(), fecha, e.diasParaPago(hoy), e.estadoPago(hoy), factura);
    }

    static String mes(YearMonth m) {
        return m.getMonth().getDisplayName(TextStyle.FULL, ES) + " " + m.getYear();
    }
}
