package com.escuelanatacion.web;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

/** Ayudas para limpiar y convertir los campos que llegan en los formularios. */
final class Campos {

    private Campos() {
    }

    /** Recorta espacios y el largo máximo; devuelve null si queda vacío. */
    static String texto(String valor, int largo) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.strip();
        if (limpio.length() > largo) {
            limpio = limpio.substring(0, largo);
        }
        return limpio.isEmpty() ? null : limpio;
    }

    static boolean vacio(String valor) {
        return valor == null || valor.isBlank();
    }

    /** Convierte "AAAA-MM-DD"; si no es válida agrega el error y devuelve null. */
    static LocalDate fecha(String valor, String error, List<String> errores) {
        if (vacio(valor)) {
            return null;
        }
        try {
            return LocalDate.parse(valor.strip());
        } catch (DateTimeParseException e) {
            errores.add(error);
            return null;
        }
    }

    static LocalTime hora(String valor) {
        if (vacio(valor)) {
            return null;
        }
        try {
            String v = valor.strip();
            return LocalTime.parse(v.length() > 5 ? v.substring(0, 5) : v);
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
