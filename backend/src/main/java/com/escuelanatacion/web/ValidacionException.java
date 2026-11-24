package com.escuelanatacion.web;

import java.util.List;

/** Errores de datos capturados por el usuario; se responden con 422. */
public class ValidacionException extends RuntimeException {

    private final transient List<String> errores;

    public ValidacionException(List<String> errores) {
        super(String.join(" ", errores));
        this.errores = List.copyOf(errores);
    }

    public List<String> getErrores() {
        return errores;
    }
}
