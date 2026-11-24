package com.escuelanatacion;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.escuelanatacion.repo.EstudianteRepository;
import com.escuelanatacion.repo.HorarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest
@AutoConfigureMockMvc
class ApiTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired EstudianteRepository estudiantes;
    @Autowired HorarioRepository horarios;

    private String token;

    @BeforeEach
    void preparar() throws Exception {
        estudiantes.deleteAll();
        horarios.deleteAll();
        String r = mvc.perform(post("/api/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"admin\",\"password\":\"secreto\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        token = json.readTree(r).get("token").asText();
    }

    private MockHttpServletRequestBuilder conSesion(MockHttpServletRequestBuilder req) {
        return req.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
    }

    private JsonNode crear(String ruta, String cuerpo) throws Exception {
        String r = mvc.perform(conSesion(post(ruta)).content(cuerpo))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(r);
    }

    private long horario(int cupo) throws Exception {
        return crear("/api/horarios", """
                {"nombre":"Delfines","dias":["mar","jue"],"hora_inicio":"16:00","hora_fin":"17:00","cupo":%d}
                """.formatted(cupo)).get("id").asLong();
    }

    private long estudiante(String nombre, int diaPago, long... horariosIds) throws Exception {
        String ids = java.util.Arrays.toString(horariosIds);
        return crear("/api/estudiantes", """
                {"nombre":"%s","apellidos":"Pérez","dia_pago":%d,"mensualidad":800,"horarios":%s}
                """.formatted(nombre, diaPago, ids)).get("id").asLong();
    }

    @Test
    void sinTokenResponde401() throws Exception {
        for (String ruta : new String[] {"/api/panel", "/api/estudiantes", "/api/horarios"}) {
            mvc.perform(get(ruta)).andExpect(status().isUnauthorized());
        }
        mvc.perform(get("/api/panel").header("Authorization", "Bearer falso")).andExpect(status().isUnauthorized());
    }

    @Test
    void loginIncorrecto() throws Exception {
        mvc.perform(post("/api/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"admin\",\"password\":\"mal\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("incorrectos")));
    }

    @Test
    void creaHorarioYEstudianteYLoListaEnElHorario() throws Exception {
        long h = horario(5);
        long e = estudiante("Luis", 10, h);

        mvc.perform(conSesion(get("/api/estudiantes/" + e)))
                .andExpect(jsonPath("$.nombre_completo").value("Luis Pérez"))
                .andExpect(jsonPath("$.dia_pago").value(10))
                .andExpect(jsonPath("$.proximo_pago", notNullValue()))
                .andExpect(jsonPath("$.horarios[0].id").value(h));
        mvc.perform(conSesion(get("/api/horarios/" + h)))
                .andExpect(jsonPath("$.dias_texto").value("Martes, Jueves"))
                .andExpect(jsonPath("$.ocupados").value(1))
                .andExpect(jsonPath("$.estudiantes[0].nombre_completo").value("Luis Pérez"));
        mvc.perform(conSesion(get("/api/estudiantes").param("horario", String.valueOf(h))))
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void elPanelMuestraQuienPagaHoy() throws Exception {
        estudiante("Ana", LocalDate.now().getDayOfMonth());
        mvc.perform(conSesion(get("/api/panel")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activos").value(1))
                .andExpect(jsonPath("$.pagan_hoy").value(1))
                .andExpect(jsonPath("$.proximos_pagos[0].estado").value("hoy"))
                .andExpect(jsonPath("$.proximos_pagos[0].dias_para_pago").value(0));
    }

    @Test
    void validaElHorario() throws Exception {
        mvc.perform(conSesion(post("/api/horarios")).content("""
                        {"nombre":"X","dias":["lun"],"hora_inicio":"09:00","hora_fin":"08:00","cupo":5}
                        """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errores[0]", containsString("posterior")));
    }

    @Test
    void validaElDiaDePago() throws Exception {
        mvc.perform(conSesion(post("/api/estudiantes")).content("""
                        {"nombre":"Beto","dia_pago":32,"mensualidad":500}
                        """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errores[0]", containsString("día de pago")));
    }

    @Test
    void respetaElCupo() throws Exception {
        long h = horario(1);
        estudiante("Ana", 5, h);
        mvc.perform(conSesion(post("/api/estudiantes")).content("""
                        {"nombre":"Beto","dia_pago":1,"mensualidad":500,"horarios":[%d]}
                        """.formatted(h)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errores[0]", containsString("no tiene cupo")));
    }

    @Test
    void editarYDarDeBaja() throws Exception {
        long e = estudiante("Ana", 10);
        mvc.perform(conSesion(put("/api/estudiantes/" + e)).content("""
                        {"nombre":"Ana María","dia_pago":15,"mensualidad":900,"activo":false,"horarios":[]}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false))
                .andExpect(jsonPath("$.dia_pago").value(15));
        mvc.perform(conSesion(get("/api/estudiantes"))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(conSesion(get("/api/estudiantes").param("inactivos", "1"))).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void eliminarHorarioConservaAlumnosYEliminarAlumno() throws Exception {
        long h = horario(5);
        long e = estudiante("Ana", 10, h);

        mvc.perform(conSesion(delete("/api/horarios/" + h))).andExpect(status().isNoContent());
        mvc.perform(conSesion(get("/api/estudiantes/" + e))).andExpect(jsonPath("$.horarios", hasSize(0)));

        mvc.perform(conSesion(delete("/api/estudiantes/" + e))).andExpect(status().isNoContent());
        mvc.perform(conSesion(get("/api/estudiantes/" + e))).andExpect(status().isNotFound());
    }
}
