import { Component, computed, input } from '@angular/core';

/** Círculo con las iniciales del alumno; el color sale de su nombre y siempre es el mismo. */
@Component({
  selector: 'app-avatar',
  template: `<span class="av" [style.width.px]="tam()" [style.height.px]="tam()" [style.font-size.px]="tam() * .38"
    [style.background]="fondo()" [style.color]="tinta()">{{ iniciales() }}</span>`,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    .av { display: inline-grid; place-items: center; border-radius: 50%; font-weight: 800; letter-spacing: .02em; }
  `,
})
export class AvatarComponent {
  nombre = input.required<string>();
  tam = input(40);

  private tono = computed(() => {
    let h = 0;
    for (const c of this.nombre()) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  });
  fondo = computed(() => `hsl(${this.tono()} 75% 92%)`);
  tinta = computed(() => `hsl(${this.tono()} 55% 30%)`);
  iniciales = computed(() =>
    this.nombre().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join(''),
  );
}
