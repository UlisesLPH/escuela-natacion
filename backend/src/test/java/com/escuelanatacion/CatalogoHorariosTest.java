package com.escuelanatacion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.escuelanatacion.config.CatalogoHorarios;
import com.escuelanatacion.model.Horario;
import com.escuelanatacion.repo.HorarioRepository;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class CatalogoHorariosTest {

    @Test
    @SuppressWarnings("unchecked")
    void cargaLosDiezHorariosDeLaEscuelaCuandoNoHayNinguno() {
        HorarioRepository repo = mock(HorarioRepository.class);
        when(repo.count()).thenReturn(0L);

        new CatalogoHorarios(repo, true, 10).run();

        ArgumentCaptor<List<Horario>> captor = ArgumentCaptor.forClass(List.class);
        verify(repo).saveAll(captor.capture());
        List<Horario> h = captor.getValue();

        assertThat(h).hasSize(10);
        assertThat(h).filteredOn(x -> x.getDias().equals("lun,mie,vie")).extracting(Horario::getHoraInicio)
                .containsExactly(LocalTime.of(16, 0), LocalTime.of(17, 0), LocalTime.of(18, 0),
                        LocalTime.of(19, 0), LocalTime.of(20, 0));
        assertThat(h).filteredOn(x -> x.getDias().equals("mar,jue")).extracting(Horario::getHoraInicio)
                .containsExactly(LocalTime.of(16, 0), LocalTime.of(17, 0), LocalTime.of(18, 0));
        assertThat(h).filteredOn(x -> x.getDias().equals("sab")).extracting(Horario::getHoraInicio)
                .containsExactly(LocalTime.of(8, 0), LocalTime.of(9, 0));
        assertThat(h).allSatisfy(x -> {
            assertThat(x.getHoraFin()).isEqualTo(x.getHoraInicio().plusHours(1));
            assertThat(x.getCupo()).isEqualTo(10);
        });
        assertThat(h.get(0).getNombre()).isEqualTo("Lun · Mié · Vie 4 pm – 5 pm");
        assertThat(h.get(8).getNombre()).isEqualTo("Sábado 8 am – 9 am");
    }

    @Test
    void noTocaNadaSiYaHayHorarios() {
        HorarioRepository repo = mock(HorarioRepository.class);
        when(repo.count()).thenReturn(3L);
        new CatalogoHorarios(repo, true, 10).run();
        verify(repo, never()).saveAll(any());
    }
}
