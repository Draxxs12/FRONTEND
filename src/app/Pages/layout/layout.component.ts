import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../Services/auth.service';
import { puede } from '../../Settings/permisos';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {

  nombre = 'Usuario';
  rol = '';
  inicial = 'U';
  tituloSeccion = 'Dashboard';

  // Estado de los grupos desplegables
  grupos = {
    ventas: true,
    inventario: true,
    abastecimiento: true,
    administracion: true
  };

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.nombre = this.auth.getNombre() || 'Usuario';
    this.rol = this.auth.getRol() || '';
    this.inicial = this.nombre.charAt(0).toUpperCase();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        let r = this.route;
        while (r.firstChild) r = r.firstChild;
        return r.snapshot.data['titulo'] || 'Dashboard';
      })
    ).subscribe(titulo => { this.tituloSeccion = titulo; this.cdr.detectChanges(); });
  }

  toggle(grupo: 'ventas' | 'inventario' | 'abastecimiento' | 'administracion'): void {
    this.grupos[grupo] = !this.grupos[grupo];
  }

  // ── Permisos: qué ve cada rol en el menú ──────────────────
  ver(ruta: string): boolean { return puede(this.rol, ruta); }
  grupoVentas(): boolean { return this.ver('punto-de-venta') || this.ver('historial-ventas') || this.ver('devoluciones'); }
  grupoInventario(): boolean { return this.ver('productos') || this.ver('categorias') || this.ver('stock'); }
  grupoAbastecimiento(): boolean { return this.ver('compras') || this.ver('proveedores'); }
  grupoAdmin(): boolean { return this.ver('usuarios') || this.ver('configuracion') || this.ver('mantenimiento'); }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
