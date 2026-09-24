import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../Services/usuario.service';
import { Usuario, UsuarioForm, Rol } from '../../Models/Usuario';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  mostrarModal = false;
  modoEdicion = false;
  editId: number | null = null;
  form: UsuarioForm = this.vacio();
  mensaje = ''; esError = false;

  constructor(private usuarioService: UsuarioService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
    this.usuarioService.roles().subscribe(r => { this.roles = r; this.cdr.detectChanges(); });
  }

  cargar(): void { this.usuarioService.listar().subscribe(d => { this.usuarios = d; this.cdr.detectChanges(); }); }

  nuevoRol(): void {
    const nombre = prompt('Nombre del nuevo rol:');
    if (!nombre || !nombre.trim()) return;
    this.usuarioService.crearRol(nombre.trim()).subscribe({
      next: (rol) => {
        this.usuarioService.roles().subscribe(r => { this.roles = r; this.form.rolId = rol.id; this.cdr.detectChanges(); });
        this.notificar('Rol creado.', false);
      },
      error: (e) => this.notificar((e?.error && typeof e.error === 'string') ? e.error : 'Error al crear el rol.', true)
    });
  }

  abrirNuevo(): void { this.modoEdicion = false; this.editId = null; this.form = this.vacio(); this.mostrarModal = true; }
  abrirEditar(u: Usuario): void {
    this.modoEdicion = true; this.editId = u.id ?? null;
    this.form = { nombre: u.nombre, email: u.email, password: '', rolId: u.rol?.id ?? null, activo: u.activo ?? true };
    this.mostrarModal = true;
  }
  cerrar(): void { this.mostrarModal = false; }

  guardar(): void {
    if (!this.form.nombre.trim() || !this.form.email.trim() || !this.form.rolId) {
      this.notificar('Nombre, email y rol son obligatorios.', true); return;
    }
    if (!this.modoEdicion && !this.form.password) { this.notificar('La contraseña es obligatoria.', true); return; }
    const obs = this.modoEdicion && this.editId
      ? this.usuarioService.actualizar(this.editId, this.form)
      : this.usuarioService.crear(this.form);
    obs.subscribe({
      next: () => { this.cerrar(); this.cargar(); this.notificar('Usuario guardado.', false); },
      error: (e) => this.notificar((e?.error && typeof e.error === 'string') ? e.error : 'Error al guardar.', true)
    });
  }

  eliminar(u: Usuario): void {
    if (!u.id || !confirm(`¿Desactivar al usuario "${u.nombre}"?`)) return;
    this.usuarioService.eliminar(u.id).subscribe({ next: () => this.cargar() });
  }

  private vacio(): UsuarioForm { return { nombre: '', email: '', password: '', rolId: null, activo: true }; }
  private notificar(m: string, err: boolean): void {
    this.mensaje = m; this.esError = err; this.cdr.detectChanges();
    setTimeout(() => { this.mensaje = ''; this.cdr.detectChanges(); }, 4000);
  }
}
