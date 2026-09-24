import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '../../Services/configuracion.service';
import { Configuracion } from '../../Models/Configuracion';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html'
})
export class ConfiguracionComponent implements OnInit {

  cfg: Configuracion = { nombreEmpresa: '', direccion: '', ruc: '', serieBoleta: '', serieFactura: '' };
  mensaje = ''; esError = false; guardando = false;

  constructor(private configuracionService: ConfiguracionService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.configuracionService.obtener().subscribe({
      next: (c) => { this.cfg = c; this.cdr.detectChanges(); },
      error: () => this.notificar('No se pudo cargar la configuración.', true)
    });
  }

  guardar(): void {
    this.guardando = true;
    this.configuracionService.guardar(this.cfg).subscribe({
      next: (c) => { this.cfg = c; this.guardando = false; this.notificar('Cambios guardados correctamente.', false); },
      error: () => { this.guardando = false; this.notificar('Error al guardar los cambios.', true); }
    });
  }

  private notificar(m: string, err: boolean): void {
    this.mensaje = m; this.esError = err; this.cdr.detectChanges();
    setTimeout(() => { this.mensaje = ''; this.cdr.detectChanges(); }, 4000);
  }
}
