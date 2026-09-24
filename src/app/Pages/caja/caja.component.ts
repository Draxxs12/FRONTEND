import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CajaService } from '../../Services/caja.service';
import { AuthService } from '../../Services/auth.service';
import { Caja, MovimientoCaja } from '../../Models/Caja';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent implements OnInit {

  caja: Caja | null = null;
  movimientos: MovimientoCaja[] = [];
  historial: Caja[] = [];

  montoInicial = 0;
  observaciones = '';
  movimiento: MovimientoCaja = { tipo: 'Egreso', monto: 0, descripcion: '' };

  mensaje = ''; esError = false;

  constructor(private cajaService: CajaService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cajaService.actual().subscribe({
      next: (c) => {
        this.caja = c;
        if (c?.id) this.cajaService.movimientos(c.id).subscribe(m => { this.movimientos = m; this.cdr.detectChanges(); });
        else this.movimientos = [];
        this.cdr.detectChanges();
      }
    });
    this.cajaService.historial().subscribe(h => { this.historial = h; this.cdr.detectChanges(); });
  }

  abrir(): void {
    this.cajaService.abrir(this.auth.getUsuarioId(), this.montoInicial).subscribe({
      next: () => { this.montoInicial = 0; this.notificar('Caja abierta correctamente.', false); this.cargar(); },
      error: (e) => this.notificar(this.msg(e), true)
    });
  }

  cerrar(): void {
    this.cajaService.cerrar(this.observaciones).subscribe({
      next: () => { this.observaciones = ''; this.notificar('Caja cerrada correctamente.', false); this.cargar(); },
      error: (e) => this.notificar(this.msg(e), true)
    });
  }

  registrarMovimiento(): void {
    if (!this.movimiento.monto || this.movimiento.monto <= 0) { this.notificar('Ingresa un monto válido.', true); return; }
    this.cajaService.registrarMovimiento(this.movimiento).subscribe({
      next: () => { this.movimiento = { tipo: 'Egreso', monto: 0, descripcion: '' }; this.notificar('Movimiento registrado.', false); this.cargar(); },
      error: (e) => this.notificar(this.msg(e), true)
    });
  }

  private msg(e: any): string { return (e?.error && typeof e.error === 'string') ? e.error : 'Ocurrió un error.'; }
  private notificar(m: string, err: boolean): void {
    this.mensaje = m; this.esError = err; this.cdr.detectChanges();
    setTimeout(() => { this.mensaje = ''; this.cdr.detectChanges(); }, 4000);
  }
}
