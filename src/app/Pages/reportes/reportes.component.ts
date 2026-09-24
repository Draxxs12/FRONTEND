import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService, LibroMayor, AuditoriaStock } from '../../Services/reporte.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent {

  desde = this.primerDiaMes();
  hasta = this.hoy();

  libro: LibroMayor | null = null;
  auditoria: AuditoriaStock | null = null;
  vista: 'ninguna' | 'libro' | 'stock' = 'ninguna';
  mensaje = ''; esError = false;

  // IA
  analisisIa = '';
  fuenteIa = '';
  tituloIa = '';
  cargandoIa = false;
  cargandoIaStock = false;

  constructor(private reporteService: ReporteService, private cdr: ChangeDetectorRef) {}

  analizarIA(): void {
    this.cargandoIa = true; this.analisisIa = ''; this.cdr.detectChanges();
    this.reporteService.analisisIa(this.desde, this.hasta).subscribe({
      next: (r) => { this.analisisIa = r.analisis; this.fuenteIa = r.fuente; this.tituloIa = 'Análisis financiero'; this.cargandoIa = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoIa = false; this.notificar('No se pudo generar el análisis con IA.', true); }
    });
  }

  analizarIAStock(): void {
    this.cargandoIaStock = true; this.analisisIa = ''; this.cdr.detectChanges();
    this.reporteService.analisisIaStock().subscribe({
      next: (r) => { this.analisisIa = r.analisis; this.fuenteIa = r.fuente; this.tituloIa = 'Diagnóstico de almacén'; this.cargandoIaStock = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoIaStock = false; this.notificar('No se pudo generar el análisis con IA.', true); }
    });
  }

  // ---- Libro Mayor ----
  verLibro(): void {
    this.reporteService.libroMayor(this.desde, this.hasta).subscribe({
      next: (r) => { this.libro = r; this.vista = 'libro'; this.cdr.detectChanges(); },
      error: () => this.notificar('Error al generar el reporte.', true)
    });
  }

  excelLibro(): void {
    this.reporteService.libroMayor(this.desde, this.hasta).subscribe(r => {
      const filas: string[][] = [['LIBRO MAYOR FINANCIERO', `${r.desde || ''} a ${r.hasta || ''}`]];
      filas.push([], ['Total Ingresos', String(r.totalIngresos)], ['Total Egresos', String(r.totalEgresos)],
        ['Cuentas por Pagar', String(r.cuentasPorPagar)], ['Utilidad Bruta', String(r.utilidadBruta)], []);
      filas.push(['VENTAS'], ['Fecha', 'Comprobante', 'Cliente', 'Total']);
      r.ventas.forEach(v => filas.push([v.fecha, v.comprobante, v.cliente, String(v.total)]));
      filas.push([], ['COMPRAS'], ['Fecha', 'Orden', 'Proveedor', 'Estado', 'Total']);
      r.compras.forEach(c => filas.push([c.fecha, c.orden, c.proveedor, c.estado, String(c.total)]));
      this.descargarCSV(filas, `libro-mayor_${r.desde}_${r.hasta}.csv`);
    });
  }

  pdfLibro(): void {
    this.reporteService.libroMayor(this.desde, this.hasta).subscribe(r => {
      let html = `<h1>Libro Mayor Financiero</h1><p>Periodo: ${r.desde} a ${r.hasta}</p>
        <ul><li>Total Ingresos: S/ ${r.totalIngresos}</li><li>Total Egresos: S/ ${r.totalEgresos}</li>
        <li>Cuentas por Pagar: S/ ${r.cuentasPorPagar}</li><li><b>Utilidad Bruta: S/ ${r.utilidadBruta}</b></li></ul>
        <h3>Ventas</h3><table><tr><th>Fecha</th><th>Comprobante</th><th>Cliente</th><th>Total</th></tr>`;
      r.ventas.forEach(v => html += `<tr><td>${v.fecha}</td><td>${v.comprobante}</td><td>${v.cliente}</td><td>S/ ${v.total}</td></tr>`);
      html += `</table><h3>Compras</h3><table><tr><th>Fecha</th><th>Orden</th><th>Proveedor</th><th>Estado</th><th>Total</th></tr>`;
      r.compras.forEach(c => html += `<tr><td>${c.fecha}</td><td>${c.orden}</td><td>${c.proveedor}</td><td>${c.estado}</td><td>S/ ${c.total}</td></tr>`);
      html += `</table>`;
      this.imprimir(html);
    });
  }

  // ---- Auditoría de Almacén ----
  verStock(): void {
    this.reporteService.auditoriaStock().subscribe({
      next: (r) => { this.auditoria = r; this.vista = 'stock'; this.cdr.detectChanges(); },
      error: () => this.notificar('Error al generar la auditoría.', true)
    });
  }

  excelStock(): void {
    this.reporteService.auditoriaStock().subscribe(r => {
      const filas: string[][] = [['AUDITORÍA DE ALMACÉN'], ['Capital almacenado', String(r.capitalAlmacenado)], [],
        ['Código', 'Producto', 'Categoría', 'Stock', 'Stock Mín.', 'P. Compra', 'Valor Stock']];
      r.productos.forEach(p => filas.push([p.codigo, p.nombre, p.categoria, String(p.stock), String(p.stockMinimo), String(p.precioCompra), String(p.valorStock)]));
      this.descargarCSV(filas, 'auditoria-stock.csv');
    });
  }

  pdfStock(): void {
    this.reporteService.auditoriaStock().subscribe(r => {
      let html = `<h1>Auditoría de Almacén</h1><p><b>Capital almacenado: S/ ${r.capitalAlmacenado}</b></p>
        <table><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Valor</th></tr>`;
      r.productos.forEach(p => html += `<tr><td>${p.codigo}</td><td>${p.nombre}</td><td>${p.categoria}</td><td>${p.stock}</td><td>S/ ${p.valorStock}</td></tr>`);
      html += `</table>`;
      this.imprimir(html);
    });
  }

  // ---- Utilidades ----
  private descargarCSV(filas: string[][], nombre: string): void {
    const csv = filas.map(f => f.map(c => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private imprimir(contenido: string): void {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { this.notificar('Habilita las ventanas emergentes para exportar a PDF.', true); return; }
    win.document.write(`<html><head><title>Reporte — Ferretería Progresol Charito</title>
      <style>body{font-family:Segoe UI,sans-serif;padding:30px;color:#1e293b}h1{color:#2b6cb0}
      table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #e2e8f0;padding:7px;text-align:left;font-size:13px}
      th{background:#f1f5f9}</style></head><body>${contenido}
      <script>window.onload=function(){window.print();}</script></body></html>`);
    win.document.close();
  }

  private hoy(): string { return new Date().toISOString().slice(0, 10); }
  private primerDiaMes(): string { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
  private notificar(m: string, err: boolean): void {
    this.mensaje = m; this.esError = err; this.cdr.detectChanges();
    setTimeout(() => { this.mensaje = ''; this.cdr.detectChanges(); }, 4000);
  }
}
