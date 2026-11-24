package com.escuelanatacion.model;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Catálogos del SAT para CFDI 4.0 que se usan al capturar los datos de facturación.
 * Cada clave indica si aplica a personas físicas (RFC de 13 caracteres) y/o morales (12).
 */
public final class CatalogosSat {

    public record Clave(String clave, String descripcion, boolean fisica, boolean moral) {
        public boolean aplicaA(boolean esFisica) {
            return esFisica ? fisica : moral;
        }
    }

    /** c_RegimenFiscal. */
    public static final List<Clave> REGIMENES = List.of(
            new Clave("601", "General de Ley Personas Morales", false, true),
            new Clave("603", "Personas Morales con Fines no Lucrativos", false, true),
            new Clave("605", "Sueldos y Salarios e Ingresos Asimilados a Salarios", true, false),
            new Clave("606", "Arrendamiento", true, false),
            new Clave("607", "Régimen de Enajenación o Adquisición de Bienes", true, false),
            new Clave("608", "Demás ingresos", true, false),
            new Clave("610", "Residentes en el Extranjero sin Establecimiento Permanente en México", true, true),
            new Clave("611", "Ingresos por Dividendos (socios y accionistas)", true, false),
            new Clave("612", "Personas Físicas con Actividades Empresariales y Profesionales", true, false),
            new Clave("614", "Ingresos por intereses", true, false),
            new Clave("615", "Régimen de los ingresos por obtención de premios", true, false),
            new Clave("616", "Sin obligaciones fiscales", true, false),
            new Clave("620", "Sociedades Cooperativas de Producción que optan por diferir sus ingresos", false, true),
            new Clave("621", "Incorporación Fiscal", true, false),
            new Clave("622", "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras", false, true),
            new Clave("623", "Opcional para Grupos de Sociedades", false, true),
            new Clave("624", "Coordinados", false, true),
            new Clave("625", "Actividades Empresariales con ingresos a través de Plataformas Tecnológicas", true, false),
            new Clave("626", "Régimen Simplificado de Confianza", true, true));

    /** c_UsoCFDI (los que tienen sentido para cuotas de una escuela). */
    public static final List<Clave> USOS_CFDI = List.of(
            new Clave("G03", "Gastos en general", true, true),
            new Clave("G01", "Adquisición de mercancías", true, true),
            new Clave("D10", "Pagos por servicios educativos (colegiaturas)", true, false),
            new Clave("D01", "Honorarios médicos, dentales y gastos hospitalarios", true, false),
            new Clave("D02", "Gastos médicos por incapacidad o discapacidad", true, false),
            new Clave("S01", "Sin efectos fiscales", true, true),
            new Clave("CP01", "Pagos", true, true));

    /** RFC de persona moral (12) o física (13), incluidos los genéricos como XAXX010101000. */
    private static final Pattern RFC = Pattern.compile(
            "^[A-ZÑ&]{3,4}\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])[A-Z\\d]{2}[A\\d]$");
    private static final Pattern CP = Pattern.compile("^\\d{5}$");

    private CatalogosSat() {
    }

    public static boolean rfcValido(String rfc) {
        return rfc != null && RFC.matcher(rfc).matches();
    }

    public static boolean esPersonaFisica(String rfc) {
        return rfc != null && rfc.length() == 13;
    }

    public static boolean cpValido(String cp) {
        return cp != null && CP.matcher(cp).matches();
    }

    public static Optional<Clave> regimen(String clave) {
        return REGIMENES.stream().filter(c -> c.clave().equals(clave)).findFirst();
    }

    public static Optional<Clave> uso(String clave) {
        return USOS_CFDI.stream().filter(c -> c.clave().equals(clave)).findFirst();
    }
}
