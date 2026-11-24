package com.escuelanatacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

/** Datos para emitir la factura (CFDI 4.0) de las cuotas de un alumno. */
@Embeddable
@Getter
@Setter
public class DatosFiscales {

    /** Si el alumno (o su tutor) pide factura de la inscripción y las mensualidades. */
    @Column(name = "factura_requiere")
    private Boolean requiere = false;

    @Column(name = "factura_rfc", length = 13)
    private String rfc;

    @Column(name = "factura_razon_social", length = 254)
    private String razonSocial;

    /** Clave del catálogo c_RegimenFiscal del SAT, p. ej. "605". */
    @Column(name = "factura_regimen", length = 3)
    private String regimenFiscal;

    @Column(name = "factura_cp", length = 5)
    private String codigoPostal;

    /** Clave del catálogo c_UsoCFDI del SAT, p. ej. "G03". */
    @Column(name = "factura_uso_cfdi", length = 4)
    private String usoCfdi;

    @Column(name = "factura_correo", length = 120)
    private String correo;

    public boolean pideFactura() {
        return Boolean.TRUE.equals(requiere);
    }
}
