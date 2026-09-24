import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timeout } from 'rxjs/operators';
import { AuthService } from '../../Services/auth.service';

type Pantalla = 'login' | 'mfa' | 'forgot' | 'reset';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  pantalla: Pantalla = 'login';
  email = '';
  password = '';
  codigo = '';
  nuevaPassword = '';
  mostrarPassword = false;
  mostrarNuevaPassword = false;
  error = '';
  mensaje = '';
  cargando = false;
  challengeToken = '';
  correoVerificacion = '';

  constructor(private authService: AuthService, private router: Router) {}

  ingresar(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Ingresa tu correo y contraseña.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.authService.login({ email: this.email.trim(), password: this.password })
      .pipe(timeout(8000))
      .subscribe({
        next: res => {
          this.cargando = false;
          this.challengeToken = res.challengeToken;
          this.correoVerificacion = res.email;
          this.codigo = '';
          this.pantalla = 'mfa';
          this.mensaje = 'Hemos enviado un código de 6 dígitos al correo registrado.';
        },
        error: err => {
          this.cargando = false;
          this.mostrarError(err);
        }
      });
  }

  verificarMfa(): void {
    if (!/^\d{6}$/.test(this.codigo)) {
      this.error = 'Ingresa el código de 6 dígitos recibido por correo.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.authService.verifyMfa(this.challengeToken, this.codigo).pipe(timeout(8000)).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.cargando = false;
        this.mostrarError(err);
      }
    });
  }

  iniciarRecuperacion(): void {
    this.pantalla = 'forgot';
    this.error = '';
    this.mensaje = '';
    this.password = '';
  }

  enviarCodigoRecuperacion(): void {
    if (!this.email.trim()) {
      this.error = 'Ingresa el correo registrado.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.authService.forgotPassword(this.email.trim()).pipe(timeout(8000)).subscribe({
      next: res => {
        this.cargando = false;
        if (res.challengeToken) {
          this.challengeToken = res.challengeToken;
          this.pantalla = 'reset';
          this.mensaje = 'Si el correo está registrado, recibirás un código para recuperar tu contraseña.';
        } else {
          this.mensaje = res.message;
        }
      },
      error: err => {
        this.cargando = false;
        this.mostrarError(err);
      }
    });
  }

  restablecerPassword(): void {
    if (!/^\d{6}$/.test(this.codigo)) {
      this.error = 'Ingresa el código de 6 dígitos recibido por correo.';
      return;
    }
    if (this.nuevaPassword.length < 8) {
      this.error = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.authService.resetPassword(this.challengeToken, this.codigo, this.nuevaPassword)
      .pipe(timeout(8000))
      .subscribe({
        next: res => {
          this.cargando = false;
          this.pantalla = 'login';
          this.password = '';
          this.nuevaPassword = '';
          this.codigo = '';
          this.mensaje = res.message + ' Ahora puedes iniciar sesión.';
        },
        error: err => {
          this.cargando = false;
          this.mostrarError(err);
        }
      });
  }

  volverLogin(): void {
    this.pantalla = 'login';
    this.error = '';
    this.mensaje = '';
    this.codigo = '';
    this.challengeToken = '';
  }

  toggleMostrarPassword(): void { this.mostrarPassword = !this.mostrarPassword; }
  toggleMostrarNuevaPassword(): void { this.mostrarNuevaPassword = !this.mostrarNuevaPassword; }

  private mostrarError(err: any): void {
    if (err?.name === 'TimeoutError') {
      this.error = 'El servidor no respondió. Verifica que el backend esté corriendo en http://localhost:8080.';
    } else if (err?.status === 401) {
      this.error = err?.error || 'Correo, contraseña o código incorrectos.';
    } else if (err?.status === 429) {
      this.error = err?.error || 'Demasiados intentos. Solicita un nuevo código.';
    } else if (err?.status === 503) {
      this.error = err?.error || 'No se pudo enviar el correo de verificación.';
    } else if (err?.status === 0) {
      this.error = 'No se pudo conectar con el backend. ¿Está encendido en el puerto 8080?';
    } else {
      this.error = err?.error || 'Error del servidor (' + (err?.status ?? '?') + ').';
    }
  }
}
