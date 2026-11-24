import { Component, computed, input } from '@angular/core';
import { ESTADOS, EstadoPago } from '../core/models';

@Component({
  selector: 'app-estado',
  template: `<span class="pill" [class]="'pill tono-' + info().tono">{{ info().texto }}</span>`,
})
export class EstadoPillComponent {
  estado = input.required<EstadoPago>();
  info = computed(() => ESTADOS[this.estado()]);
}
