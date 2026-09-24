// src/app/Pages/login/login.component.ts

import { Component }        from '@angular/core';
import { CommonModule }     from '@angular/common';
import { FormsModule }      from '@angular/forms';
import { Router }           from '@angular/router';
import { timeout }          from 'rxjs/operators';
import { AuthService }      from '../../Services/auth.service';

@Component({
  selector:    'app-login',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls:   ['./login.component.css'],
})
export class LoginComponent {

  email     = '';
  password  = '';
  mostrarPassword = false;
  error     = '';
  cargando  = false;

  constructor(private authService: AuthService, private router: Router) {}

  ingresar(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;
    this.error    = '';

    this.authService.login({ email: this.email, password: this.password })
      .pipe(timeout(8000))   // corta la espera a los 8 s para no quedarse colgado
      .subscribe({
        next: () => {
          this.cargando = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.cargando = false;
          if (err?.name === 'TimeoutError') {
            this.error = 'El servidor no respondió. Verifica que el backend esté corriendo en http://localhost:8080.';
          } else if (err?.status === 401) {
            this.error = 'Correo o contraseña incorrectos.';
          } else if (err?.status === 0) {
            this.error = 'No se pudo conectar con el backend. ¿Está encendido en el puerto 8080?';
          } else {
            this.error = 'Error del servidor (' + (err?.status ?? '?') + '). Revisa la consola del backend.';
          }
        },
      });
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}