import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { FormsModule }                           from '@angular/forms';
import { RouterLink }                            from '@angular/router';
import { Compra, DetalleCompra }                 from '../../Models/Compra';
import { Proveedor }                             from '../../Models/Proveedor';
import { Producto }                              from '../../Models/Producto';
import { CompraService }                         from '../../Services/compra.service';
import { ProveedorService }                      from '../../Services/proveedor.service';
import { ProductoService }                       from '../../Services/producto.service';

@Component({
  selector:    'app-compras',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './compras.component.html',
  styleUrls:   ['./compras.component.css'],
})
export class ComprasComponent implements OnInit {

  compras:     Compra[]    = [];
  proveedores: Proveedor[] = [];
  productos:   Producto[]  = [];
  cargando     = true;
  error        = '';

  mostrarModal  = false;
  modoEdicion   = false;
  compraEditId: number | null = null;

  form: Compra = this.formVacio();

  constructor(
    private compraService:    CompraService,
    private proveedorService: ProveedorService,
    private productoService:  ProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarProductos();
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.compraService.getAll().subscribe({
      next: (data) => {
        this.compras  = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error    = 'No se pudo conectar con el servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  cargarProveedores(): void {
    this.proveedorService.getAll().subscribe({
      next: (data) => { this.proveedores = data; },
      error: () => {}
    });
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: (data: Producto[]) => { this.productos = data; },
      error: () => {}
    });
  }

  abrirModalNuevo(): void {
    this.form         = this.formVacio();
    this.modoEdicion  = false;
    this.compraEditId = null;
    this.mostrarModal = true;
    this.error        = '';
  }

  abrirModalEditar(c: Compra): void {
    this.form = {
      ...c,
      proveedorId: c.proveedor?.id,
      detalles: (c.detalles ?? []).map(d => ({
        ...d,
        productoId: d.producto?.id
      }))
    };
    this.modoEdicion  = true;
    this.compraEditId = c.id!;
    this.mostrarModal = true;
    this.error        = '';
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.error        = '';
  }

  // ── Manejo de líneas de detalle ──────────────────────────────────
  agregarLinea(): void {
    this.form.detalles = this.form.detalles ?? [];
    this.form.detalles.push({
      productoId:     undefined,
      cantidad:       1,
      precioUnitario: 0,
      subtotal:       0
    });
  }

  eliminarLinea(i: number): void {
    this.form.detalles!.splice(i, 1);
    this.recalcular();
  }

  onProductoLinea(i: number): void {
    const linea = this.form.detalles![i];
    const prod  = this.productos.find(p => p.id === Number(linea.productoId));
    if (prod) {
      linea.precioUnitario = prod.precioCompra ?? 0;
      linea.producto       = prod;
    }
    this.recalcular();
  }

  recalcular(): void {
    let sub = 0;
    for (const d of this.form.detalles ?? []) {
      d.subtotal = (d.cantidad ?? 0) * (d.precioUnitario ?? 0);
      sub += d.subtotal;
    }
    this.form.subtotal = sub;
    this.form.igv      = sub * 0.18;
    this.form.total    = sub + this.form.igv;
  }

  guardar(): void {
    if (!this.form.proveedorId) {
      this.error = 'Selecciona un proveedor.';
      return;
    }
    if (!this.form.detalles || this.form.detalles.length === 0) {
      this.error = 'Agrega al menos un producto a la compra.';
      return;
    }

    const payload = {
      proveedor:     { id: this.form.proveedorId },
      usuario:       { id: 1 },
      tipoPago:      this.form.tipoPago,
      estado:        this.form.estado,
      fechaEsperada: this.form.fechaEsperada || null,
      observaciones: this.form.observaciones || '',
      detalles: this.form.detalles.map(d => ({
        ...(d.id ? { id: d.id } : {}),
        producto:       { id: d.productoId },
        cantidad:       d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal:       d.subtotal
      }))
    };

    if (this.modoEdicion && this.compraEditId !== null) {
      this.compraService.update(this.compraEditId, payload as any).subscribe({
        next: () => { this.cerrarModal(); this.cargar(); },
        error: () => { this.error = 'Error al actualizar la compra.'; },
      });
    } else {
      this.compraService.create(payload as any).subscribe({
        next: () => { this.cerrarModal(); this.cargar(); },
        error: () => { this.error = 'Error al crear la compra.'; },
      });
    }
  }

  eliminar(c: Compra): void {
    if (!confirm(`¿Eliminar la orden "${c.numeroOrden}"?`)) return;
    this.compraService.delete(c.id!).subscribe({
      next: () => this.cargar(),
      error: () => { this.error = 'Error al eliminar la compra.'; },
    });
  }

  badgeEstado(estado: string): string {
    const map: Record<string, string> = {
      'Pendiente': 'badge-warning',
      'Recibida':  'badge-success',
      'Anulada':   'badge-danger',
    };
    return map[estado] ?? 'badge-warning';
  }

  private formVacio(): Compra {
    return {
      proveedorId:   undefined,
      tipoPago:      'Efectivo',
      estado:        'Pendiente',
      fechaEsperada: '',
      observaciones: '',
      detalles:      []
    };
  }
}