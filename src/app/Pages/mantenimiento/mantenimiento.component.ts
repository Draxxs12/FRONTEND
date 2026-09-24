import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ProductoService } from '../../Services/producto.service';
import { ClienteService } from '../../Services/cliente.service';
import { VentaService } from '../../Services/venta.service';
import { UsuarioService } from '../../Services/usuario.service';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mantenimiento.component.html'
})
export class MantenimientoComponent implements OnInit {

  totProductos = 0; totClientes = 0; totVentas = 0; totUsuarios = 0;
  estadoConexion: 'ok' | 'error' | 'verificando' = 'verificando';
  ultima = new Date();

  constructor(
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private ventaService: VentaService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.verificar(); }

  verificar(): void {
    this.estadoConexion = 'verificando';
    forkJoin({
      productos: this.productoService.listar(),
      clientes: this.clienteService.getAll(),
      ventas: this.ventaService.listar(),
      usuarios: this.usuarioService.listar()
    }).subscribe({
      next: ({ productos, clientes, ventas, usuarios }) => {
        this.totProductos = productos.length;
        this.totClientes = clientes.length;
        this.totVentas = ventas.length;
        this.totUsuarios = usuarios.length;
        this.estadoConexion = 'ok';
        this.ultima = new Date();
        this.cdr.detectChanges();
      },
      error: () => { this.estadoConexion = 'error'; this.cdr.detectChanges(); }
    });
  }
}
