package com.escuelanatacion.model;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Días de la semana usados por los horarios. */
public final class Calendario {

    public static final List<String> DIAS = List.of("lun", "mar", "mie", "jue", "vie", "sab", "dom");
    public static final Map<String, String> NOMBRE_DIA = Map.of(
            "lun", "Lunes", "mar", "Martes", "mie", "Miércoles", "jue", "Jueves",
            "vie", "Viernes", "sab", "Sábado", "dom", "Domingo");

    private Calendario() {
    }

    public static String codigoDia(LocalDate fecha) {
        return DIAS.get(fecha.getDayOfWeek().getValue() - 1);
    }
}
