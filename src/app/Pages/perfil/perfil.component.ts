import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, PerfilResponse } from '../../Services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  perfil: PerfilResponse | null = null;
  cargando = true;
  error = '';
  mensaje = '';

  mostrarCambio = false;
  pasoCambio: 'password' | 'codigo' = 'password';
  contrasenaActual = '';
  nuevaPassword = '';
  confirmarPassword = '';
  codigo = '';
  challengeToken = '';
  correoVerificacion = '';
  guardando = false;

  constructor(private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargando = true;
    this.error = '';
    this.auth.getMiPerfil().subscribe({
      next: p => {
        this.perfil = p;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.cargando = false;
        this.error = err?.error || 'No se pudo cargar tu perfil.';
        this.cdr.detectChanges();
      }
    });
  }

  abrirCambioPassword(): void {
    this.mostrarCambio = true;
    this.pasoCambio = 'password';
    this.contrasenaActual = '';
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.codigo = '';
    this.challengeToken = '';
    this.error = '';
    this.mensaje = '';
  }

  cancelarCambio(): void {
    this.mostrarCambio = false;
    this.error = '';
    this.mensaje = '';
  }

  solicitarCodigo(): void {
    if (!this.contrasenaActual) {
      this.error = 'Ingresa tu contraseña actual.';
      return;
    }
    if (this.nuevaPassword.length < 8) {
      this.error = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.error = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.auth.solicitarCambioPassword(this.contrasenaActual).subscribe({
      next: res => {
        this.guardando = false;
        this.challengeToken = res.challengeToken;
        this.correoVerificacion = res.email;
        this.pasoCambio = 'codigo';
        this.mensaje = 'Enviamos un código de 6 dígitos a tu correo registrado.';
        this.cdr.detectChanges();
      },
      error: err => {
        this.guardando = false;
        this.error = err?.error || 'No se pudo enviar el código de verificación.';
        this.cdr.detectChanges();
      }
    });
  }

  confirmarCambio(): void {
    if (!/^\d{6}$/.test(this.codigo)) {
      this.error = 'Ingresa el código de 6 dígitos.';
      return;
    }
    if (this.nuevaPassword.length < 8) {
      this.error = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.error = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.auth.confirmarCambioPassword(this.challengeToken, this.codigo, this.nuevaPassword).subscribe({
      next: res => {
        this.guardando = false;
        this.mensaje = res.message + ' Debes usar la nueva contraseña en tu próximo inicio de sesión.';
        this.mostrarCambio = false;
        this.contrasenaActual = '';
        this.nuevaPassword = '';
        this.confirmarPassword = '';
        this.codigo = '';
        this.challengeToken = '';
        this.cdr.detectChanges();
      },
      error: err => {
        this.guardando = false;
        this.error = err?.error || 'No se pudo actualizar la contraseña.';
        this.cdr.detectChanges();
      }
    });
  }

  reenviarCodigo(): void {
    this.solicitarCodigo();
  }
}
