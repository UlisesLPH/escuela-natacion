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

import com.escuelanatacion.repo.CuotasRepository;
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
    @Autowired CuotasRepository cuotas;
    @Autowired org.springframework.transaction.support.TransactionTemplate tx;

    private String token;

    @BeforeEach
    void preparar() throws Exception {
        estudiantes.deleteAll();
        horarios.deleteAll();
        cuotas.deleteAll();
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

    /**
     * Alumno inscrito en la fecha dada (AAAA-MM-DD); su día de pago es ese mismo día.
     * La API siempre inscribe con la fecha de hoy, así que la fecha de prueba se fija directo en la BD.
     */
    private long estudiante(String nombre, String inscripcion, long... horariosIds) throws Exception {
        String ids = java.util.Arrays.toString(horariosIds);
        long id = crear("/api/estudiantes", """
                {"nombre":"%s","apellidos":"Pérez","mensualidad":800,"horarios":%s}
                """.formatted(nombre, ids)).get("id").asLong();
        tx.executeWithoutResult(t -> estudiantes.findById(id).orElseThrow()
                .setFechaInscripcion(LocalDate.parse(inscripcion)));
        return id;
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
        long e = estudiante("Luis", "2026-01-10", h);

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
    void pagaElDiaDeSuInscripcionDesdeElMesSiguiente() throws Exception {
        long e = estudiante("Luis", "2026-11-24");
        mvc.perform(conSesion(get("/api/estudiantes/" + e)))
                .andExpect(jsonPath("$.fecha_inscripcion").value("2026-11-24"))
                .andExpect(jsonPath("$.dia_pago").value(24))
                .andExpect(jsonPath("$.primer_pago").value("2026-12-24"));
    }

    @Test
    void sinFechaDeInscripcionSeTomaHoy() throws Exception {
        LocalDate hoy = LocalDate.now();
        long e = crear("/api/estudiantes", "{\"nombre\":\"Sin fecha\",\"mensualidad\":700}").get("id").asLong();
        mvc.perform(conSesion(get("/api/estudiantes/" + e)))
                .andExpect(jsonPath("$.fecha_inscripcion").value(hoy.toString()))
                .andExpect(jsonPath("$.dia_pago").value(hoy.getDayOfMonth()));
    }

    @Test
    void elPanelMuestraQuienPagaHoy() throws Exception {
        LocalDate hoy = LocalDate.now();
        // Inscrito hace un año el mismo día: hoy le toca pagar.
        estudiante("Ana", hoy.minusYears(1).toString());
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
    void laFechaDeInscripcionNoSePuedeElegir() throws Exception {
        String hoy = LocalDate.now().toString();
        // Aunque manden otra fecha (p. ej. ayer), se inscribe con la de hoy…
        long e = crear("/api/estudiantes", """
                {"nombre":"Beto","fecha_inscripcion":"%s","mensualidad":500}
                """.formatted(LocalDate.now().minusDays(1))).get("id").asLong();
        mvc.perform(conSesion(get("/api/estudiantes/" + e))).andExpect(jsonPath("$.fecha_inscripcion").value(hoy));
        // …y al editar tampoco cambia.
        mvc.perform(conSesion(put("/api/estudiantes/" + e)).content("""
                        {"nombre":"Beto","fecha_inscripcion":"2020-01-01","mensualidad":500}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fecha_inscripcion").value(hoy));
    }

    @Test
    void respetaElCupo() throws Exception {
        long h = horario(1);
        estudiante("Ana", "2026-01-05", h);
        mvc.perform(conSesion(post("/api/estudiantes")).content("""
                        {"nombre":"Beto","mensualidad":500,"horarios":[%d]}
                        """.formatted(h)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errores[0]", containsString("no tiene cupo")));
    }

    @Test
    void editarYDarDeBaja() throws Exception {
        long e = estudiante("Ana", "2026-01-10");
        mvc.perform(conSesion(put("/api/estudiantes/" + e)).content("""
                        {"nombre":"Ana María","mensualidad":900,"activo":false,"horarios":[]}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false))
                .andExpect(jsonPath("$.fecha_inscripcion").value("2026-01-10"))
                .andExpect(jsonPath("$.dia_pago").value(10));
        mvc.perform(conSesion(get("/api/estudiantes"))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(conSesion(get("/api/estudiantes").param("inactivos", "1"))).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void eliminarHorarioConservaAlumnosYEliminarAlumno() throws Exception {
        long h = horario(5);
        long e = estudiante("Ana", "2026-01-10", h);

        mvc.perform(conSesion(delete("/api/horarios/" + h))).andExpect(status().isNoContent());
        mvc.perform(conSesion(get("/api/estudiantes/" + e))).andExpect(jsonPath("$.horarios", hasSize(0)));

        mvc.perform(conSesion(delete("/api/estudiantes/" + e))).andExpect(status().isNoContent());
        mvc.perform(conSesion(get("/api/estudiantes/" + e))).andExpect(status().isNotFound());
    }

    // ---- Cuotas ---------------------------------------------------------------

    @Test
    void lasCuotasInicialesSon250y850() throws Exception {
        mvc.perform(conSesion(get("/api/cuotas")))
                .andExpect(jsonPath("$.inscripcion").value(250.0))
                .andExpect(jsonPath("$.mensualidad").value(850.0));
    }

    @Test
    void unAlumnoNuevoTomaLasCuotasVigentes() throws Exception {
        JsonNode e = crear("/api/estudiantes", "{\"nombre\":\"Nuevo\"}");
        org.assertj.core.api.Assertions.assertThat(e.get("mensualidad").decimalValue()).isEqualByComparingTo("850");
        org.assertj.core.api.Assertions.assertThat(e.get("cuota_inscripcion").decimalValue()).isEqualByComparingTo("250");
    }

    @Test
    void cambiarCuotasYAplicarALosAlumnosActivos() throws Exception {
        long e = estudiante("Ana", "2026-01-10");
        mvc.perform(conSesion(put("/api/cuotas")).content("""
                        {"inscripcion":300,"mensualidad":900,"aplicar_a_todos":false}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actualizados").value(0));
        mvc.perform(conSesion(get("/api/estudiantes/" + e))).andExpect(jsonPath("$.mensualidad").value(800.0));

        mvc.perform(conSesion(put("/api/cuotas")).content("""
                        {"inscripcion":300,"mensualidad":900,"aplicar_a_todos":true}
                        """))
                .andExpect(jsonPath("$.actualizados").value(1));
        mvc.perform(conSesion(get("/api/estudiantes/" + e))).andExpect(jsonPath("$.mensualidad").value(900.0));
        mvc.perform(conSesion(get("/api/cuotas"))).andExpect(jsonPath("$.inscripcion").value(300.0));
    }

    @Test
    void validaLasCuotas() throws Exception {
        mvc.perform(conSesion(put("/api/cuotas")).content("{\"inscripcion\":-1,\"mensualidad\":850}"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ---- Facturación ------------------------------------------------------------

    private static final String FACTURA_OK = """
            {"requiere":true,"rfc":"gomr800101ab1","razon_social":"Rosa Gómez Ruiz","regimen_fiscal":"605",
             "codigo_postal":"03100","uso_cfdi":"D10","correo":"rosa@example.com"}""";

    @Test
    void guardaLosDatosFiscalesYLosNormaliza() throws Exception {
        JsonNode e = crear("/api/estudiantes",
                "{\"nombre\":\"Leo\",\"factura\":" + FACTURA_OK + "}");
        org.assertj.core.api.Assertions.assertThat(e.at("/factura/requiere").asBoolean()).isTrue();
        org.assertj.core.api.Assertions.assertThat(e.at("/factura/rfc").asText()).isEqualTo("GOMR800101AB1");
        org.assertj.core.api.Assertions.assertThat(e.at("/factura/razon_social").asText()).isEqualTo("ROSA GÓMEZ RUIZ");
        org.assertj.core.api.Assertions.assertThat(e.at("/factura/tipo_persona").asText()).isEqualTo("fisica");
        org.assertj.core.api.Assertions.assertThat(e.at("/factura/uso_texto").asText()).contains("colegiaturas");
    }

    @Test
    void validaLosDatosFiscales() throws Exception {
        mvc.perform(conSesion(post("/api/estudiantes")).content("""
                        {"nombre":"Leo","factura":{"requiere":true,"rfc":"MAL","razon_social":"",
                         "regimen_fiscal":"999","codigo_postal":"123","uso_cfdi":"","correo":"no-es-correo"}}
                        """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errores", hasSize(6)));
    }

    @Test
    void elRegimenDebeCorresponderAlTipoDePersona() throws Exception {
        // RFC de persona moral (12) con régimen de sueldos y salarios (solo personas físicas).
        mvc.perform(conSesion(post("/api/estudiantes")).content("""
                        {"nombre":"Leo","factura":{"requiere":true,"rfc":"ABC010101AB1","razon_social":"ACME",
                         "regimen_fiscal":"605","codigo_postal":"03100","uso_cfdi":"G03","correo":"a@b.mx"}}
                        """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errores[0]", containsString("no aplica a persona moral")));
    }

    @Test
    void sinFacturaNoSeValidaNada() throws Exception {
        crear("/api/estudiantes", "{\"nombre\":\"Leo\",\"factura\":{\"requiere\":false,\"rfc\":\"MAL\"}}");
    }

    @Test
    void listaLosPagosPorFacturar() throws Exception {
        crear("/api/estudiantes", "{\"nombre\":\"Sin factura\"}");
        crear("/api/estudiantes", "{\"nombre\":\"Leo\",\"factura\":" + FACTURA_OK + "}");
        mvc.perform(conSesion(get("/api/facturacion")))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].alumno").value("Leo"))
                .andExpect(jsonPath("$[0].concepto", containsString("Inscripción y mensualidad")))
                .andExpect(jsonPath("$[0].importe").value(1100.0))
                .andExpect(jsonPath("$[0].cuando").value("hoy"))
                .andExpect(jsonPath("$[0].factura.rfc").value("GOMR800101AB1"));
    }

    @Test
    void losCatalogosDelSatEstanDisponibles() throws Exception {
        mvc.perform(conSesion(get("/api/catalogos/sat")))
                .andExpect(jsonPath("$.regimenes[?(@.clave=='626')].moral").value(true))
                .andExpect(jsonPath("$.usos_cfdi[?(@.clave=='G03')].descripcion").value("Gastos en general"));
    }
}
