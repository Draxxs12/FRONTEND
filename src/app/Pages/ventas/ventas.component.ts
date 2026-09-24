import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VentaService } from '../../Services/venta.service';
import { AuthService } from '../../Services/auth.service';
import { ComprobanteService } from '../../Services/comprobante.service';
import { Venta, DetalleVenta } from '../../Models/Venta';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit {

  ventas: Venta[] = [];
  cargando = false;
  error = '';

  fechaInicio = '';
  fechaFin = '';
  estadoFiltro = 'Todos';

  mostrarModal = false;
  ventaSeleccionada: Venta | null = null;
  detalles: DetalleVenta[] = [];
  cargandoDetalle = false;
  estadoEdit = 'Completada';

  // ✅ Inyecta ChangeDetectorRef igual que en productos
  constructor(
    private ventaService: VentaService,
    private auth: AuthService,
    private comprobante: ComprobanteService,
    private cdr: ChangeDetectorRef
  ) {}

  /** Genera/imprime la boleta o factura de una venta. */
  verBoleta(v: Venta): void {
    this.ventaService.obtenerDetalle(v.id).subscribe({
      next: (det) => {
        this.comprobante.emitir({
          numero: v.numeroComprobante,
          cliente: v.cliente?.nombre || 'Cliente General',
          documento: v.rucCliente,
          tipoComprobante: v.tipoComprobante,
          fecha: v.createdAt,
          tipoPago: v.tipoPago,
          items: det.map(d => ({
            nombre: d.producto?.nombre || '—',
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            subtotal: d.subtotal
          })),
          subtotal: v.subtotal,
          igv: v.igv,
          total: v.total
        });
      },
      error: (err: Error) => { this.error = err.message; this.cdr.detectChanges(); }
    });
  }

  anular(): void {
    if (this.ventaSeleccionada) this.anularVenta(this.ventaSeleccionada);
  }

  guardarEstado(): void {
    const v = this.ventaSeleccionada;
    if (!v) { this.cerrarModal(); return; }
    if (this.estadoEdit === 'Anulada' && v.estado === 'Completada') {
      this.anularVenta(v);
    } else {
      this.cerrarModal();
    }
  }

  anularVenta(v: Venta): void {
    if (v.estado !== 'Completada') return;
    if (!confirm(`¿Anular la venta ${v.numeroComprobante}? Se devolverá el stock al inventario.`)) return;
    this.ventaService.anular(v.id, this.auth.getUsuarioId()).subscribe({
      next: () => { this.cerrarModal(); this.cargarVentas(); },
      error: (err: Error) => { this.error = err.message; this.cerrarModal(); this.cdr.detectChanges(); }
    });
  }

  ngOnInit(): void {
    this.comprobante.precargar();
    this.cargarVentas();
  }

  cargarVentas(): void {
  this.cargando = true;
  this.error    = '';
  this.ventaService.listar().subscribe({
    next: (data) => {
      this.ventas   = data;
      this.cargando = false;
      this.cdr.detectChanges();
    },
    error: (err: Error) => {
      this.error    = err.message; // ← antes era string genérico
      this.cargando = false;
      this.cdr.detectChanges();
    }
  });
}

  get ventasFiltradas(): Venta[] {
    return this.ventas.filter(v => {
      const porEstado = this.estadoFiltro === 'Todos' || v.estado === this.estadoFiltro;
      const porFechaInicio = !this.fechaInicio || v.createdAt >= this.fechaInicio;
      const porFechaFin = !this.fechaFin || v.createdAt <= this.fechaFin + 'T23:59:59';
      return porEstado && porFechaInicio && porFechaFin;
    });
  }

  get totalVentas(): number {
    return this.ventasFiltradas
      .filter(v => v.estado === 'Completada')
      .reduce((acc, v) => acc + v.total, 0);
  }

  get numVentas(): number {
    return this.ventasFiltradas.filter(v => v.estado === 'Completada').length;
  }

  get numAnuladas(): number {
    return this.ventasFiltradas.filter(v => v.estado === 'Anulada').length;
  }

  verDetalle(v: Venta): void {
    this.ventaSeleccionada = v;
    this.estadoEdit        = v.estado;
    this.mostrarModal      = true;
    this.cargandoDetalle   = true;
    this.cdr.detectChanges();
    this.ventaService.obtenerDetalle(v.id).subscribe({
      next: (data) => {
        this.detalles        = data;
        this.cargandoDetalle = false;
        this.cdr.detectChanges();
      },
      error: (err: Error) => {
        this.error           = err.message;
        this.cargandoDetalle = false;
        this.detalles        = [];
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.ventaSeleccionada = null;
    this.detalles = [];
    this.estadoEdit = 'Completada';
    this.cdr.detectChanges();
  }

  estadoClass(estado: string): string {
    if (estado === 'Completada') return 'badge-completada';
    if (estado === 'Anulada') return 'badge-anulada';
    return 'badge-pendiente';
  }

  limpiarFiltros(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.estadoFiltro = 'Todos';
    this.cdr.detectChanges();
  }
}
