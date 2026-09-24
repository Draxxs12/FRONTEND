import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterLink }        from '@angular/router';
import { Subject }           from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ProductoService }   from '../../Services/producto.service';
import { CategoriaService }  from '../../Services/categoria.service';
import { Producto, ProductoForm } from '../../Models/Producto';
import { Categoria }         from '../../Models/Categoria';

@Component({
  selector:    'app-productos',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './productos.component.html',
  styleUrls:   ['./productos.component.css']
})
export class ProductosComponent implements OnInit, OnDestroy {

  productos:          Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias:         Categoria[] = [];
  busqueda  = '';
  cargando  = false;
  error     = '';

  mostrarModal       = false;
  modoEdicion        = false;
  productoEditandoId: number | null = null;
  form: ProductoForm = this.formVacio();

  // ✅ Subject para debounce — emite cada vez que el usuario escribe
  private busquedaSubject = new Subject<string>();
  private destroy$        = new Subject<void>();

  constructor(
    private productoService:  ProductoService,
    private categoriaService: CategoriaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();

    // ✅ Escucha cambios en el buscador con 300ms de espera
    this.busquedaSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(texto => {
      this.filtrarLocal(texto);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error    = '';
    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos          = data;
        this.productosFiltrados = data;
        this.cargando           = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error    = 'No se pudo conectar con el servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next:  (data) => this.categorias = data,
      error: () => console.error('Error cargando categorías')
    });
  }

  // ✅ Solo emite al Subject — no llama al servidor
  buscar(): void {
    this.busquedaSubject.next(this.busqueda);
  }

  // ✅ Filtra el array local sin petición HTTP
  private filtrarLocal(texto: string): void {
    const q = texto.toLowerCase().trim();
    if (!q) {
      this.productosFiltrados = this.productos;
    } else {
      this.productosFiltrados = this.productos.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.codigo && p.codigo.toLowerCase().includes(q))
      );
    }
    this.cdr.detectChanges();
  }

  abrirModalNuevo(): void {
    this.modoEdicion       = false;
    this.productoEditandoId = null;
    this.form              = this.formVacio();
    this.mostrarModal      = true;
    this.error             = '';
  }

  abrirModalEditar(p: Producto): void {
    this.modoEdicion        = true;
    this.productoEditandoId = p.id;
    this.form = {
      codigo:       p.codigo,
      nombre:       p.nombre,
      categoria:    p.categoria ? { id: p.categoria.id } : null,
      precioCompra: p.precioCompra,
      precioVenta:  p.precioVenta,
      stock:        p.stock,
      stockMinimo:  p.stockMinimo,
      activo:       p.activo
    };
    this.mostrarModal = true;
    this.error        = '';
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.error        = '';
  }

  guardar(): void {
    if (!this.form.nombre || !this.form.precioVenta) {
      this.error = 'Nombre y precio de venta son obligatorios.';
      return;
    }
    const compra = Number(this.form.precioCompra) || 0;
    const venta  = Number(this.form.precioVenta)  || 0;
    if (venta < compra) {
      this.error = `El precio de venta (S/ ${venta}) no puede ser menor que el de compra (S/ ${compra}). Estarías vendiendo con pérdida.`;
      return;
    }
    if (this.modoEdicion && this.productoEditandoId !== null) {
      this.productoService.actualizar(this.productoEditandoId, this.form).subscribe({
        next:  () => { this.cerrarModal(); this.cargarProductos(); },
        error: (e) => { this.error = this.msgError(e, 'Error al actualizar el producto.'); this.cdr.detectChanges(); }
      });
    } else {
      this.productoService.crear(this.form).subscribe({
        next:  () => { this.cerrarModal(); this.cargarProductos(); },
        error: (e) => { this.error = this.msgError(e, 'Error al crear el producto.'); this.cdr.detectChanges(); }
      });
    }
  }

  eliminar(p: Producto): void {
    if (!confirm(`¿Desactivar el producto "${p.nombre}"?`)) return;
    this.productoService.eliminar(p.id).subscribe({
      next:  () => this.cargarProductos(),
      error: () => { this.error = 'Error al eliminar el producto.'; }
    });
  }

  stockClass(p: Producto): string {
    if (p.stock <= 0)             return 'badge-danger';
    if (p.stock <= p.stockMinimo) return 'badge-warning';
    return 'badge-success';
  }

  private msgError(e: any, fallback: string): string {
    return (e?.error && typeof e.error === 'string') ? e.error : fallback;
  }

  private formVacio(): ProductoForm {
    return {
      codigo:       '',
      nombre:       '',
      categoria:    null,
      precioCompra: 0,
      precioVenta:  0,
      stock:        0,
      stockMinimo:  5,
      activo:       true
    };
  }
}