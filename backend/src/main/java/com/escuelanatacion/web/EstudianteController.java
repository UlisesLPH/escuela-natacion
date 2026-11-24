package com.escuelanatacion.web;

import com.escuelanatacion.model.CatalogosSat;
import com.escuelanatacion.model.DatosFiscales;
import com.escuelanatacion.model.Estudiante;
import com.escuelanatacion.model.Horario;
import com.escuelanatacion.repo.CuotasRepository;
import com.escuelanatacion.repo.EstudianteRepository;
import com.escuelanatacion.repo.HorarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estudiantes")
@Transactional
public class EstudianteController {

    private final EstudianteRepository estudiantes;
    private final HorarioRepository horarios;
    private final CuotasRepository cuotas;

    public EstudianteController(EstudianteRepository estudiantes, HorarioRepository horarios,
                                CuotasRepository cuotas) {
        this.estudiantes = estudiantes;
        this.horarios = horarios;
        this.cuotas = cuotas;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Dto.EstudianteDto> listar(@RequestParam(defaultValue = "") String q,
                                          @RequestParam(required = false) Long horario,
                                          @RequestParam(defaultValue = "") String estado,
                                          @RequestParam(defaultValue = "0") String inactivos) {
        LocalDate hoy = LocalDate.now();
        String busqueda = q.strip().toLowerCase(Locale.ROOT);
        List<Estudiante> base = "1".equals(inactivos)
                ? estudiantes.findAllByOrderByNombreAscApellidosAsc()
                : estudiantes.findByActivoTrueOrderByNombreAscApellidosAsc();

        Stream<Estudiante> flujo = base.stream();
        if (!busqueda.isEmpty()) {
            flujo = flujo.filter(e -> Stream.of(e.nombreCompleto(), e.getTutor(), e.getTelefono())
                    .anyMatch(c -> c != null && c.toLowerCase(Locale.ROOT).contains(busqueda)));
        }
        if (horario != null) {
            flujo = flujo.filter(e -> e.getHorarios().stream().anyMatch(h -> h.getId().equals(horario)));
        }
        return flujo.map(e -> Dto.EstudianteDto.de(e, hoy))
                .filter(d -> estado.isEmpty() || d.estado().equals(estado))
                .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public Dto.EstudianteDto ver(@PathVariable Long id) {
        return Dto.EstudianteDto.de(obtener(id), LocalDate.now());
    }

    @PostMapping
    public ResponseEntity<Dto.EstudianteDto> crear(@RequestBody Dto.EstudianteForm form) {
        return ResponseEntity.status(HttpStatus.CREATED).body(guardar(new Estudiante(), form, true));
    }

    @PutMapping("/{id}")
    public Dto.EstudianteDto editar(@PathVariable Long id, @RequestBody Dto.EstudianteForm form) {
        return guardar(obtener(id), form, false);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        estudiantes.delete(obtener(id));
        return ResponseEntity.noContent().build();
    }

    private Estudiante obtener(Long id) {
        return estudiantes.findById(id).orElseThrow(ManejoErrores::noEncontrado);
    }

    private Dto.EstudianteDto guardar(Estudiante e, Dto.EstudianteForm f, boolean nuevo) {
        List<String> errores = new ArrayList<>();

        String nombre = Campos.texto(f.nombre(), 80);
        if (nombre == null) {
            errores.add("El nombre es obligatorio.");
        }
        // Si no las mandan: al crear se usan las cuotas vigentes; al editar se conservan.
        BigDecimal mensualidad = f.mensualidad() != null ? f.mensualidad()
                : nuevo ? cuotas.vigentes().getMensualidad() : e.getMensualidad();
        if (mensualidad.signum() < 0) {
            errores.add("La mensualidad debe ser un número mayor o igual a 0.");
        }
        BigDecimal inscripcionCuota = f.cuotaInscripcion() != null ? f.cuotaInscripcion()
                : nuevo ? cuotas.vigentes().getInscripcion() : e.getCuotaInscripcion();
        if (inscripcionCuota != null && inscripcionCuota.signum() < 0) {
            errores.add("La inscripción debe ser un número mayor o igual a 0.");
        }
        LocalDate nacimiento = Campos.fecha(f.fechaNacimiento(), "La fecha de nacimiento no es válida.", errores);
        if (nacimiento != null && nacimiento.isAfter(LocalDate.now())) {
            errores.add("La fecha de nacimiento no puede ser futura.");
        }
        DatosFiscales factura = datosFiscales(f.factura(), errores);

        // La fecha de inscripción no se captura: es el día en que se registra y no cambia al editar.
        LocalDate inscripcion = nuevo ? LocalDate.now() : e.inscripcion();

        boolean activo = nuevo || f.activo() == null || f.activo();
        List<Horario> elegidos = f.horarios() == null || f.horarios().isEmpty()
                ? List.of() : horarios.findAllById(f.horarios());
        Set<Long> actuales = e.getHorarios().stream().map(Horario::getId).collect(Collectors.toSet());
        for (Horario h : elegidos) {
            if (activo && !actuales.contains(h.getId()) && h.lleno()) {
                errores.add("El horario «%s» ya no tiene cupo (%d/%d).".formatted(h.getNombre(), h.ocupados(), h.getCupo()));
            }
        }
        if (!errores.isEmpty()) {
            throw new ValidacionException(errores);
        }

        e.setNombre(nombre);
        String apellidos = Campos.texto(f.apellidos(), 120);
        e.setApellidos(apellidos == null ? "" : apellidos);
        e.setFechaNacimiento(nacimiento);
        e.setTelefono(Campos.texto(f.telefono(), 30));
        e.setEmail(Campos.texto(f.email(), 120));
        e.setTutor(Campos.texto(f.tutor(), 120));
        e.setFechaInscripcion(inscripcion); // también fija el día de pago
        e.setMensualidad(mensualidad);
        e.setCuotaInscripcion(inscripcionCuota);
        e.setFactura(factura);
        e.setActivo(activo);
        e.setNotas(Campos.texto(f.notas(), 2000));
        e.setHorarios(new ArrayList<>(elegidos));
        return Dto.EstudianteDto.de(estudiantes.save(e), LocalDate.now());
    }

    /** Valida los datos de facturación; si no pide factura, se guardan vacíos. */
    static DatosFiscales datosFiscales(Dto.FacturaForm f, List<String> errores) {
        DatosFiscales d = new DatosFiscales();
        if (f == null || !Boolean.TRUE.equals(f.requiere())) {
            return d;
        }
        d.setRequiere(true);

        String rfc = Campos.texto(f.rfc(), 20);
        rfc = rfc == null ? null : rfc.toUpperCase(java.util.Locale.ROOT).replaceAll("[\\s-]", "");
        if (!CatalogosSat.rfcValido(rfc)) {
            errores.add("El RFC no es válido (12 caracteres para persona moral, 13 para persona física).");
        }
        String nombre = Campos.texto(f.razonSocial(), 254);
        if (nombre == null) {
            errores.add("Escribe el nombre o razón social tal como aparece en la constancia de situación fiscal.");
        }
        String cp = Campos.texto(f.codigoPostal(), 10);
        if (!CatalogosSat.cpValido(cp)) {
            errores.add("El código postal del domicilio fiscal debe tener 5 dígitos.");
        }
        String correo = Campos.texto(f.correo(), 120);
        if (correo == null || !correo.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            errores.add("Escribe un correo válido para enviar la factura.");
        }

        boolean fisica = CatalogosSat.esPersonaFisica(rfc);
        boolean rfcOk = CatalogosSat.rfcValido(rfc);
        var regimen = CatalogosSat.regimen(f.regimenFiscal());
        if (regimen.isEmpty()) {
            errores.add("Selecciona el régimen fiscal.");
        } else if (rfcOk && !regimen.get().aplicaA(fisica)) {
            errores.add("El régimen fiscal %s no aplica a persona %s.".formatted(regimen.get().clave(), fisica ? "física" : "moral"));
        }
        var uso = CatalogosSat.uso(f.usoCfdi());
        if (uso.isEmpty()) {
            errores.add("Selecciona el uso del CFDI.");
        } else if (rfcOk && !uso.get().aplicaA(fisica)) {
            errores.add("El uso de CFDI %s no aplica a persona %s.".formatted(uso.get().clave(), fisica ? "física" : "moral"));
        }

        d.setRfc(rfc);
        d.setRazonSocial(nombre == null ? null : nombre.toUpperCase(java.util.Locale.ROOT));
        d.setCodigoPostal(cp);
        d.setRegimenFiscal(f.regimenFiscal());
        d.setUsoCfdi(f.usoCfdi());
        d.setCorreo(correo);
        return d;
    }
}
