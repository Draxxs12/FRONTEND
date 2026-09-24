import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DevolucionService } from '../../Services/devolucion.service';
import { VentaService } from '../../Services/venta.service';
import { AuthService } from '../../Services/auth.service';
import { Devolucion } from '../../Models/Devolucion';
import { Venta, DetalleVenta } from '../../Models/Venta';

interface LineaDev extends DetalleVenta { devolver: number; }

@Component({
  selector: 'app-devoluciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devoluciones.component.html',
  styleUrls: ['./devoluciones.component.css']
})
export class DevolucionesComponent implements OnInit {

  devoluciones: Devolucion[] = [];
  ventas: Venta[] = [];

  mostrarModal = false;
  ventaSelId: number | null = null;
  lineas: LineaDev[] = [];
  motivo = '';
  tipoReembolso = 'Efectivo';
  mensaje = ''; esError = false;

  constructor(
    private devolucionService: DevolucionService,
    private ventaService: VentaService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.devolucionService.listar().subscribe(d => { this.devoluciones = d; this.cdr.detectChanges(); });
    this.ventaService.listar().subscribe(v => { this.ventas = v.filter(x => x.estado === 'Completada'); this.cdr.detectChanges(); });
  }

  abrirNueva(): void {
    this.ventaSelId = null; this.lineas = []; this.motivo = ''; this.tipoReembolso = 'Efectivo';
    this.mostrarModal = true;
  }
  cerrar(): void { this.mostrarModal = false; }

  cargarDetalle(): void {
    if (!this.ventaSelId) { this.lineas = []; return; }
    this.ventaService.obtenerDetalle(this.ventaSelId).subscribe(det => {
      this.lineas = det.map(d => ({ ...d, devolver: 0 }));
      this.cdr.detectChanges();
    });
  }

  get totalReembolso(): number {
    return this.lineas.reduce((a, l) => a + (l.devolver > 0 ? l.devolver * l.precioUnitario : 0), 0);
  }

  registrar(): void {
    const detalles = this.lineas
      .filter(l => l.devolver > 0 && l.producto)
      .map(l => ({ producto: { id: l.producto!.id }, cantidad: l.devolver, precioUnitario: l.precioUnitario }));
    if (!this.ventaSelId || detalles.length === 0) { this.notificar('Selecciona una venta e indica cantidades a devolver.', true); return; }

    this.devolucionService.crear({
      usuarioId: this.auth.getUsuarioId(),
      ventaId: this.ventaSelId,
      motivo: this.motivo,
      tipoReembolso: this.tipoReembolso,
      detalles
    }).subscribe({
      next: () => { this.cerrar(); this.cargar(); this.notificar('Devolución registrada.', false); },
      error: (e) => this.notificar((e?.error && typeof e.error === 'string') ? e.error : 'Error al registrar.', true)
    });
  }

  private notificar(m: string, err: boolean): void {
    this.mensaje = m; this.esError = err; this.cdr.detectChanges();
    setTimeout(() => { this.mensaje = ''; this.cdr.detectChanges(); }, 4000);
  }
}
