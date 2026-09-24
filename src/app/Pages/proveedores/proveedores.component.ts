import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Proveedor } from '../../Models/Proveedor';
import { ProveedorService } from '../../Services/proveedor.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css'],
})
export class ProveedoresComponent implements OnInit {

  proveedores:         Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  cargando  = true;
  error     = '';
  busqueda  = '';

  mostrarModal    = false;
  modoEdicion     = false;
  proveedorEditId: number | null = null;

  form: Proveedor = this.formVacio();

  constructor(
    private proveedorService: ProveedorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.proveedorService.getAll().subscribe({
      next: (data) => {
        this.proveedores         = data;
        this.proveedoresFiltrados = data;
        this.cargando            = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error    = 'No se pudo conectar con el servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  buscar(): void {
    const q = this.busqueda.toLowerCase();
    this.proveedoresFiltrados = this.proveedores.filter(p =>
      p.empresa.toLowerCase().includes(q) ||
      (p.ruc      ?? '').toLowerCase().includes(q) ||
      (p.contacto ?? '').toLowerCase().includes(q)
    );
  }

  abrirModalNuevo(): void {
    this.form           = this.formVacio();
    this.modoEdicion    = false;
    this.proveedorEditId = null;
    this.mostrarModal   = true;
    this.error          = '';
  }

  abrirModalEditar(p: Proveedor): void {
    this.form           = { ...p };
    this.modoEdicion    = true;
    this.proveedorEditId = p.id!;
    this.mostrarModal   = true;
    this.error          = '';
  }

  cerrarModal(): void { this.mostrarModal = false; this.error = ''; }

  guardar(): void {
    if (!this.form.empresa?.trim()) {
      this.error = 'El nombre de empresa es obligatorio.';
      return;
    }
    if (this.modoEdicion && this.proveedorEditId !== null) {
      this.proveedorService.update(this.proveedorEditId, this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargar(); },
        error: (e) => { this.error = (e?.error && typeof e.error === 'string') ? e.error : 'Error al actualizar el proveedor.'; this.cdr.detectChanges(); },
      });
    } else {
      this.proveedorService.create(this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargar(); },
        error: (e) => { this.error = (e?.error && typeof e.error === 'string') ? e.error : 'Error al crear el proveedor.'; this.cdr.detectChanges(); },
      });
    }
  }

  eliminar(p: Proveedor): void {
    if (!confirm(`¿Eliminar el proveedor "${p.empresa}"?`)) return;
    this.proveedorService.delete(p.id!).subscribe({
      next: () => this.cargar(),
      error: () => { this.error = 'Error al eliminar el proveedor.'; },
    });
  }

  private formVacio(): Proveedor {
    return { empresa: '', ruc: '', contacto: '', telefono: '', email: '', direccion: '', activo: true };
  }
}