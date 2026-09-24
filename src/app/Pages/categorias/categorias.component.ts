import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../Services/categoria.service';
import { ProductoService } from '../../Services/producto.service';
import { Categoria } from '../../Models/Categoria';
import { Producto } from '../../Models/Producto';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {

  categorias: Categoria[] = [];
  productos: Producto[] = [];
  expandida: number | null = null;
  mostrarModal = false;
  modoEdicion = false;
  form: Categoria = { nombre: '' };
  mensaje = ''; esError = false;

  constructor(
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.categoriaService.listar().subscribe(d => { this.categorias = d; this.cdr.detectChanges(); });
    this.productoService.listar().subscribe(p => { this.productos = p; this.cdr.detectChanges(); });
  }

  productosDe(catId?: number): Producto[] {
    if (catId == null) return [];
    return this.productos.filter(p => p.categoria?.id === catId);
  }

  toggleExpandir(catId?: number): void {
    this.expandida = (this.expandida === catId) ? null : (catId ?? null);
  }

  abrirNuevo(): void { this.modoEdicion = false; this.form = { nombre: '' }; this.mostrarModal = true; }
  abrirEditar(c: Categoria): void { this.modoEdicion = true; this.form = { ...c }; this.mostrarModal = true; }
  cerrar(): void { this.mostrarModal = false; }

  guardar(): void {
    if (!this.form.nombre.trim()) { this.notificar('El nombre es obligatorio.', true); return; }
    const obs = this.modoEdicion && this.form.id != null
      ? this.categoriaService.actualizar(this.form.id, this.form)
      : this.categoriaService.crear({ nombre: this.form.nombre });
    obs.subscribe({
      next: () => { this.cerrar(); this.cargar(); this.notificar('Categoría guardada.', false); },
      error: () => this.notificar('Error al guardar.', true)
    });
  }

  eliminar(c: Categoria): void {
    if (c.id == null || !confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    this.categoriaService.eliminar(c.id).subscribe({
      next: () => this.cargar(),
      error: () => this.notificar('No se pudo eliminar (puede tener productos asociados).', true)
    });
  }

  private notificar(m: string, err: boolean): void {
    this.mensaje = m; this.esError = err; this.cdr.detectChanges();
    setTimeout(() => { this.mensaje = ''; this.cdr.detectChanges(); }, 4000);
  }
}
