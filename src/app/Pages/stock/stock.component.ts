import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../Services/producto.service';
import { InventarioService } from '../../Services/inventario.service';
import { AuthService } from '../../Services/auth.service';
import { Producto } from '../../Models/Producto';
import { MovimientoInventario } from '../../Models/Inventario';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit {

  tab: 'actual' | 'movimientos' = 'actual';
  productos: Producto[] = [];
  filtrados: Producto[] = [];
  movimientos: MovimientoInventario[] = [];
  busqueda = '';

  mostrarModal = false;
  productoSel: Producto | null = null;
  nuevoStock = 0;
  motivo = '';
  mensaje = ''; esError = false;

  constructor(
    private productoService: ProductoService,
    private inventarioService: InventarioService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.productoService.listar().subscribe(d => { this.productos = d; this.filtrar(); this.cdr.detectChanges(); });
    this.inventarioService.listar().subscribe(m => { this.movimientos = m.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); this.cdr.detectChanges(); });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.filtrados = !q ? this.productos : this.productos.filter(p =>
      p.nombre.toLowerCase().includes(q) || (p.codigo && p.codigo.toLowerCase().includes(q)));
  }

  estado(p: Producto): { txt: string; cls: string } {
    if (p.stock <= 0) return { txt: 'Agotado', cls: 'badge-danger' };
    if (p.stock <= p.stockMinimo) return { txt: 'Stock bajo', cls: 'badge-warning' };
    return { txt: 'Disponible', cls: 'badge-success' };
  }

  abrirAjuste(p: Producto): void { this.productoSel = p; this.nuevoStock = p.stock; this.motivo = ''; this.mostrarModal = true; }
  cerrar(): void { this.mostrarModal = false; }

  guardarAjuste(): void {
    if (!this.productoSel) return;
    this.inventarioService.ajustar({
      usuarioId: this.auth.getUsuarioId(),
      productoId: this.productoSel.id,
      nuevoStock: this.nuevoStock,
      motivo: this.motivo
    }).subscribe({
      next: () => { this.cerrar(); this.cargar(); this.notificar('Stock ajustado.', false); },
      error: (e) => this.notificar((e?.error && typeof e.error === 'string') ? e.error : 'Error al ajustar.', true)
    });
  }

  private notificar(m: string, err: boolean): void {
    this.mensaje = m; this.esError = err; this.cdr.detectChanges();
    setTimeout(() => { this.mensaje = ''; this.cdr.detectChanges(); }, 4000);
  }
}
