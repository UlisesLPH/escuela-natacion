package com.escuelanatacion.web;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ManejoErrores {

    @ExceptionHandler(ValidacionException.class)
    ResponseEntity<Map<String, Object>> validacion(ValidacionException e) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of("errores", e.getErrores()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, Object>> estado(ResponseStatusException e) {
        String mensaje = e.getStatusCode() == HttpStatus.NOT_FOUND ? "No encontrado." : "Solicitud no válida.";
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", mensaje));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<Map<String, Object>> malFormado(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", "Los datos enviados no tienen el formato esperado."));
    }

    public static ResponseStatusException noEncontrado() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
}
