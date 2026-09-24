import { Injectable } from '@angular/core';
import { ConfiguracionService } from './configuracion.service';
import { Configuracion } from '../Models/Configuracion';

export interface ItemComprobante {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ComprobanteData {
  numero: string;
  cliente: string;
  documento?: string;              // DNI o RUC del cliente
  tipoComprobante?: string;        // 'Boleta' | 'Factura'
  fecha: string | Date;
  tipoPago: string;
  items: ItemComprobante[];
  subtotal: number;
  igv: number;
  total: number;
}

/** Genera e imprime la boleta/factura en una ventana (se puede "Guardar como PDF"). */
@Injectable({ providedIn: 'root' })
export class ComprobanteService {

  private config: Configuracion | null = null;

  constructor(private cfg: ConfiguracionService) {}

  /** Cargar los datos de la empresa por adelantado (llamar en ngOnInit). */
  precargar(): void {
    if (!this.config) {
      this.cfg.obtener().subscribe({ next: c => this.config = c, error: () => {} });
    }
  }

  emitir(data: ComprobanteData): void {
    const emp: Configuracion = this.config || {
      nombreEmpresa: 'Ferretería Progresol Charito',
      direccion: 'Av. Principal 123, Lima',
      ruc: '20123456789',
      serieBoleta: 'B001',
      serieFactura: 'F001'
    };
    this.abrir(emp, data);
  }

  private abrir(emp: Configuracion, d: ComprobanteData): void {
    // Prioriza el tipo elegido; si no viene, lo deduce del número (F = factura)
    const esFactura = d.tipoComprobante
      ? d.tipoComprobante.toLowerCase() === 'factura'
      : (d.numero || '').toUpperCase().startsWith('F');
    const titulo = esFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
    const etiquetaDoc = esFactura ? 'RUC' : 'Documento';
    const fecha = new Date(d.fecha).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let filas = '';
    d.items.forEach(i => {
      filas += `<tr>
        <td>${i.cantidad}</td>
        <td>${this.esc(i.nombre)}</td>
        <td class="r">S/ ${i.precioUnitario.toFixed(2)}</td>
        <td class="r">S/ ${i.subtotal.toFixed(2)}</td>
      </tr>`;
    });

    const html = `
      <div class="empresa">
        <h1>${this.esc(emp.nombreEmpresa || 'Ferretería')}</h1>
        <p>${this.esc(emp.direccion || '')}</p>
        <p>RUC: ${this.esc(emp.ruc || '')}</p>
      </div>
      <div class="doc">
        <div class="doc-tit">${titulo}</div>
        <div class="doc-num">${this.esc(d.numero)}</div>
      </div>
      <div class="datos">
        <p><b>Cliente:</b> ${this.esc(d.cliente)}</p>
        ${d.documento ? `<p><b>${etiquetaDoc}:</b> ${this.esc(d.documento)}</p>` : ''}
        <p><b>Fecha y hora:</b> ${fecha}</p>
        <p><b>Forma de pago:</b> ${this.esc(d.tipoPago)}</p>
      </div>
      <table class="items">
        <thead><tr><th>Cant.</th><th>Descripción</th><th class="r">P. Unit.</th><th class="r">Importe</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="totales">
        <div><span>Op. Gravada:</span><span>S/ ${d.subtotal.toFixed(2)}</span></div>
        <div><span>IGV (18%):</span><span>S/ ${d.igv.toFixed(2)}</span></div>
        <div class="grande"><span>TOTAL:</span><span>S/ ${d.total.toFixed(2)}</span></div>
      </div>
      <p class="pie">Representación impresa del comprobante electrónico. ¡Gracias por su compra!</p>`;

    const win = window.open('', '_blank', 'width=420,height=640');
    if (!win) return;
    win.document.write(`<html><head><title>${titulo} ${this.esc(d.numero)}</title>
      <style>
        *{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box}
        body{padding:18px;color:#1e293b;font-size:13px}
        .empresa{text-align:center;border-bottom:2px dashed #cbd5e1;padding-bottom:8px}
        .empresa h1{font-size:18px;margin:0;color:#1e293b}
        .empresa p{margin:2px 0;color:#475569;font-size:12px}
        .doc{border:1px solid #1e293b;border-radius:8px;text-align:center;padding:6px;margin:10px 0}
        .doc-tit{font-weight:700;font-size:13px}
        .doc-num{font-size:15px;font-weight:800;color:#2b6cb0}
        .datos p{margin:3px 0}
        table.items{width:100%;border-collapse:collapse;margin:10px 0}
        table.items th{border-bottom:1px solid #94a3b8;text-align:left;padding:4px;font-size:11px}
        table.items td{padding:4px;border-bottom:1px dotted #e2e8f0;font-size:12px}
        .r{text-align:right}
        .totales{margin-top:8px;border-top:2px dashed #cbd5e1;padding-top:8px}
        .totales div{display:flex;justify-content:space-between;padding:2px 0}
        .totales .grande{font-size:16px;font-weight:800;border-top:1px solid #1e293b;padding-top:5px;margin-top:4px}
        .pie{text-align:center;color:#64748b;font-size:11px;margin-top:14px}
      </style></head><body>${html}
      <script>window.onload=function(){window.print();}</script></body></html>`);
    win.document.close();
  }

  private esc(s: any): string {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
