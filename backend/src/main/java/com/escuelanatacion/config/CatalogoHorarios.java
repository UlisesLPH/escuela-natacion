package com.escuelanatacion.config;

import com.escuelanatacion.model.Horario;
import com.escuelanatacion.repo.HorarioRepository;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Catálogo de horarios de la escuela. Se carga solo la primera vez, cuando la tabla de horarios
 * está vacía; después se pueden editar, agregar o quitar desde la aplicación.
 */
@Component
@Order(2)
public class CatalogoHorarios implements CommandLineRunner {

    private static final Logger LOG = LoggerFactory.getLogger(CatalogoHorarios.class);

    /** Grupos de días con las horas de inicio de cada clase (todas duran una hora). */
    private record Bloque(String dias, String etiqueta, int... horas) {
    }

    private static final List<Bloque> CATALOGO = List.of(
            new Bloque("lun,mie,vie", "Lun · Mié · Vie", 16, 17, 18, 19, 20),
            new Bloque("mar,jue", "Mar · Jue", 16, 17, 18),
            new Bloque("sab", "Sábado", 8, 9));

    private final HorarioRepository horarios;
    private final boolean activo;
    private final int cupo;

    public CatalogoHorarios(HorarioRepository horarios,
                            @Value("${app.catalogo-horarios:true}") boolean activo,
                            @Value("${app.cupo-por-horario:10}") int cupo) {
        this.horarios = horarios;
        this.activo = activo;
        this.cupo = cupo;
    }

    @Override
    public void run(String... args) {
        if (!activo || horarios.count() > 0) {
            return;
        }
        List<Horario> nuevos = new ArrayList<>();
        for (Bloque b : CATALOGO) {
            for (int h : b.horas()) {
                Horario horario = new Horario();
                horario.setDias(b.dias());
                horario.setHoraInicio(LocalTime.of(h, 0));
                horario.setHoraFin(LocalTime.of(h + 1, 0));
                horario.setNombre(b.etiqueta() + " " + hora12(h) + " – " + hora12(h + 1));
                horario.setCupo(cupo);
                nuevos.add(horario);
            }
        }
        horarios.saveAll(nuevos);
        LOG.info("Catálogo de horarios cargado: {} horarios.", nuevos.size());
    }

    /** 16 → "4 pm", 9 → "9 am". */
    static String hora12(int h) {
        int h12 = h % 12 == 0 ? 12 : h % 12;
        return h12 + (h < 12 ? " am" : " pm");
    }
}
