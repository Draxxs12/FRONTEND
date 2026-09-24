import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../Services/producto.service';
import { ClienteService } from '../../Services/cliente.service';
import { VentaService } from '../../Services/venta.service';
import { AuthService } from '../../Services/auth.service';
import { ComprobanteService } from '../../Services/comprobante.service';
import { Producto } from '../../Models/Producto';
import { Cliente } from '../../Models/Cliente';

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './punto-venta.component.html',
  styleUrls: ['./punto-venta.component.css']
})
export class PuntoVentaComponent implements OnInit {

  productos: Producto[] = [];
  filtrados: Producto[] = [];
  clientes: Cliente[] = [];

  busqueda = '';
  clienteId: number | null = null;
  tipoComprobante = 'Boleta';
  tipoPago = 'Efectivo';
  montoRecibido = 0;
  rucFactura = '';

  carrito: ItemCarrito[] = [];

  get clienteSeleccionado(): Cliente | undefined {
    return this.clientes.find(c => c.id === this.clienteId);
  }
  get documentoCliente(): string {
    return this.clienteSeleccionado?.numeroDocumento || '';
  }

  cargando = false;
  mensaje = '';
  esError = false;

  constructor(
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private ventaService: VentaService,
    private auth: AuthService,
    private comprobante: ComprobanteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.comprobante.precargar();
    this.productoService.listar().subscribe({
      next: (data) => { this.productos = data; this.filtrados = data; this.cdr.detectChanges(); },
      error: () => this.notificar('No se pudieron cargar los productos.', true)
    });
    this.clienteService.getAll().subscribe({
      next: (data) => {
        this.clientes = data;
        const general = data.find(c => c.nombre.toLowerCase().includes('general'));
        this.clienteId = general?.id ?? (data[0]?.id ?? null);
        this.cdr.detectChanges();
      }
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.filtrados = !q ? this.productos : this.productos.filter(p =>
      p.nombre.toLowerCase().includes(q) || (p.codigo && p.codigo.toLowerCase().includes(q)));
  }

  agregar(p: Producto): void {
    if (p.stock <= 0) { this.notificar(`Sin stock: ${p.nombre}`, true); return; }
    const item = this.carrito.find(i => i.producto.id === p.id);
    if (item) {
      if (item.cantidad < p.stock) item.cantidad++;
      else this.notificar(`Stock máximo alcanzado para ${p.nombre}`, true);
    } else {
      this.carrito.push({ producto: p, cantidad: 1 });
    }
  }

  cambiar(item: ItemCarrito, delta: number): void {
    const nueva = item.cantidad + delta;
    if (nueva <= 0) { this.quitar(item); return; }
    if (nueva > item.producto.stock) { this.notificar('No hay suficiente stock.', true); return; }
    item.cantidad = nueva;
  }

  quitar(item: ItemCarrito): void {
    this.carrito = this.carrito.filter(i => i !== item);
  }

  vaciar(): void { this.carrito = []; this.montoRecibido = 0; }

  get subtotal(): number {
    return this.carrito.reduce((a, i) => a + i.producto.precioVenta * i.cantidad, 0);
  }
  get igv(): number { return this.subtotal * 0.18; }
  get total(): number { return this.subtotal + this.igv; }
  get cambio(): number { return Math.max(0, (Number(this.montoRecibido) || 0) - this.total); }
  get pagoInsuficiente(): boolean {
    return (Number(this.montoRecibido) || 0) < this.total;
  }

  proforma(): void {
    if (!this.carrito.length) { this.notificar('El carrito está vacío.', true); return; }
    const cliente = this.clientes.find(c => c.id === this.clienteId)?.nombre || 'Cliente General';
    let filas = '';
    this.carrito.forEach(i => filas += `<tr><td>${i.producto.nombre}</td><td>${i.cantidad}</td><td>S/ ${i.producto.precioVenta.toFixed(2)}</td><td>S/ ${(i.producto.precioVenta * i.cantidad).toFixed(2)}</td></tr>`);
    const html = `<h1>PROFORMA</h1><p><b>Ferretería Progresol Charito</b></p><p>Cliente: ${cliente}</p>
      <p>Fecha: ${new Date().toLocaleString('es-PE')}</p>
      <table><tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr>${filas}</table>
      <p>Subtotal: S/ ${this.subtotal.toFixed(2)}</p><p>IGV (18%): S/ ${this.igv.toFixed(2)}</p>
      <h2>TOTAL: S/ ${this.total.toFixed(2)}</h2>
      <p style="color:#888"><i>Documento no válido como comprobante de pago.</i></p>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) { this.notificar('Habilita las ventanas emergentes para generar la proforma.', true); return; }
    win.document.write(`<html><head><title>Proforma — Progresol Charito</title>
      <style>body{font-family:Segoe UI,sans-serif;padding:30px;color:#1e293b}h1{color:#2b6cb0}
      table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #e2e8f0;padding:7px;text-align:left}th{background:#f1f5f9}</style>
      </head><body>${html}<script>window.onload=function(){window.print();}</script></body></html>`);
    win.document.close();
  }

  registrar(): void {
    if (this.carrito.length === 0) { this.notificar('El carrito está vacío.', true); return; }
    if (!this.clienteId) { this.notificar('Selecciona un cliente antes de registrar la venta.', true); return; }
    const recibido = Number(this.montoRecibido) || 0;
    if (recibido < this.total) {
      this.notificar(`El monto recibido (S/ ${recibido.toFixed(2)}) es menor al total a pagar (S/ ${this.total.toFixed(2)}).`, true);
      return;
    }
    // Documento del cliente: para factura usa el RUC ingresado (o el del cliente)
    const documento = this.tipoComprobante === 'Factura'
      ? (this.rucFactura.trim() || this.documentoCliente)
      : this.documentoCliente;
    if (this.tipoComprobante === 'Factura' && !documento) {
      this.notificar('Ingresa el RUC del cliente para emitir una factura.', true);
      return;
    }
    this.cargando = true;
    const payload = {
      usuarioId: this.auth.getUsuarioId(),
      venta: {
        cliente: this.clienteId ? { id: this.clienteId } : null,
        tipoPago: this.tipoPago,
        tipoComprobante: this.tipoComprobante,
        rucCliente: documento
      },
      detalles: this.carrito.map(i => ({
        producto: { id: i.producto.id! },
        cantidad: i.cantidad,
        precioUnitario: i.producto.precioVenta
      }))
    };
    this.ventaService.registrar(payload).subscribe({
      next: (venta) => {
        this.cargando = false;
        this.notificar(`✅ Venta ${venta.numeroComprobante} registrada. Total S/ ${venta.total.toFixed(2)}`, false);

        // Emitir la boleta/factura en PDF automáticamente
        const nombreCliente = this.clientes.find(c => c.id === this.clienteId)?.nombre || 'Cliente General';
        this.comprobante.emitir({
          numero: venta.numeroComprobante,
          cliente: nombreCliente,
          documento: documento,
          tipoComprobante: this.tipoComprobante,
          fecha: venta.createdAt || new Date(),
          tipoPago: this.tipoPago,
          items: this.carrito.map(i => ({
            nombre: i.producto.nombre,
            cantidad: i.cantidad,
            precioUnitario: i.producto.precioVenta,
            subtotal: i.producto.precioVenta * i.cantidad
          })),
          subtotal: this.subtotal,
          igv: this.igv,
          total: this.total
        });

        this.vaciar();
        // Refresca stock
        this.productoService.listar().subscribe(d => { this.productos = d; this.filtrar(); this.cdr.detectChanges(); });
      },
      error: (err) => { this.cargando = false; this.notificar(err.message || 'Error al registrar la venta.', true); }
    });
  }

  private notificar(msg: string, error: boolean): void {
    this.mensaje = msg; this.esError = error;
    this.cdr.detectChanges();
    setTimeout(() => { this.mensaje = ''; this.cdr.detectChanges(); }, 4000);
  }
}
