// ARCHIVO: dashboard.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }          from '@angular/common';
import { RouterLink }            from '@angular/router';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption, XAXisComponentOption, SeriesOption } from 'echarts';
import { forkJoin, of }          from 'rxjs';
import { catchError }            from 'rxjs/operators';

import { ProductoService } from '../../Services/producto.service';
import { ClienteService }  from '../../Services/cliente.service';
import { VentaService }    from '../../Services/venta.service';
import { CompraService }   from '../../Services/compra.service';
import { Producto }        from '../../Models/Producto';
import { Venta }           from '../../Models/Venta';
import { Compra }          from '../../Models/Compra';

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [CommonModule, NgxEchartsDirective, RouterLink],
  providers:   [provideEchartsCore({ echarts: () => import('echarts') })],
  templateUrl: './dashboard.component.html',
  styleUrls:   ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  productos:             Producto[] = [];
  productosStockCritico: Producto[] = [];

  totalProductos = 0;
  totalStockBajo = 0;
  totalClientes  = 0;
  ventasHoy      = 0;

  barChartOptions!:         EChartsOption;
  pieChartOptions!:         EChartsOption;
  mainLineChartOptions!:    EChartsOption;
  miniLineVentasOptions!:   EChartsOption;
  miniLineComprasOptions!:  EChartsOption;
  proveedoresChartOptions!: EChartsOption;

  constructor(
    private productoService: ProductoService,
    private clienteService:  ClienteService,
    private ventaService:    VentaService,
    private compraService:   CompraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatosEChartsEstaticos();
    this.cargarDatosReales();
  }

  cargarDatosReales(): void {
    forkJoin({
      productos:   this.productoService.listar().pipe(catchError(() => of([] as Producto[]))),
      clientes:    this.clienteService.getAll().pipe(catchError(() => of([] as any[]))),
      ventas:      this.ventaService.listar().pipe(catchError(() => of([] as Venta[]))),
      topClientes: this.ventaService.topClientes().pipe(catchError(() => of([] as { nombre: string; total: number }[]))),
      compras:     this.compraService.getAll().pipe(catchError(() => of([] as Compra[])))
    }).subscribe({
      next: ({ productos, clientes, ventas, topClientes, compras }) => {

        // — Productos
        this.productos             = productos;
        this.totalProductos        = productos.filter(p => p.activo).length;
        this.productosStockCritico = productos.filter(
          p => p.activo && p.stock <= p.stockMinimo
        );
        this.totalStockBajo = this.productosStockCritico.length;

        // — Clientes
        this.totalClientes = clientes.length;

        // — Ventas de hoy (fecha LOCAL, no UTC, para que cuente las ventas del día)
        const hoy = this.fechaLocal(new Date());
        this.ventasHoy = ventas
          .filter(v => v.estado === 'Completada' && (v.createdAt || '').slice(0, 10) === hoy)
          .reduce((acc, v) => acc + v.total, 0);

        // — Gráficos
        this.actualizarGraficoLinea(ventas);
        this.actualizarGraficoCategorias();
        this.actualizarGraficoDona(topClientes);
        this.actualizarGraficoProveedores(compras);
        this.actualizarMiniCompras(compras);

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando métricas:', err)
    });
  }

  // — Barras: productos por categoría
  private actualizarGraficoCategorias(): void {
    const conteo: { [key: string]: number } = {};
    this.productos.forEach(p => {
      if (p.activo && p.categoria) {
        const cat = p.categoria.nombre || 'Sin categoría';
        conteo[cat] = (conteo[cat] || 0) + 1;
      }
    });
    const nombres    = Object.keys(conteo);
    const cantidades = Object.values(conteo);

    this.barChartOptions = {
      ...this.barChartOptions,
      xAxis: {
        ...(this.barChartOptions.xAxis as XAXisComponentOption),
        data: nombres.length ? nombres : ['Sin productos']
      },
      series: [{
        type: 'bar', barWidth: '40%',
        data: cantidades.length ? cantidades : [0],
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: (p: any) => {
            const c = ['#9abcd9','#66e1ca','#2c3e50','#74b9ff','#ca9eff','#55efc4'];
            return c[p.dataIndex % c.length];
          }
        }
      }] as SeriesOption[]
    };
  }

  // — Línea: ventas últimos 7 días
  private actualizarGraficoLinea(ventas: Venta[]): void {
    const dias: string[]    = [];
    const totales: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key   = this.fechaLocal(d);
      const label = d.toLocaleDateString('es-PE', { weekday: 'short' });
      dias.push(label);
      const total = ventas
        .filter(v => v.estado === 'Completada' && v.createdAt?.startsWith(key))
        .reduce((acc, v) => acc + v.total, 0);
      totales.push(Math.round(total * 100) / 100);
    }

    this.mainLineChartOptions = {
      tooltip: { trigger: 'axis' },
      xAxis:   { type: 'category', data: dias },
      yAxis:   { type: 'value' },
      series:  [{
        type: 'line', smooth: true, data: totales,
        lineStyle: { color: '#4a00e0', width: 3 },
        areaStyle: { color: 'rgba(74,0,224,0.08)' }
      }]
    };

    this.miniLineVentasOptions = {
      xAxis:  { type: 'category', data: dias.slice(-4), show: false },
      yAxis:  { type: 'value', show: false },
      series: [{
        type: 'line', smooth: true, data: totales.slice(-4),
        showSymbol: false, lineStyle: { color: '#16db93' }
      }]
    };
  }

  // — Dona: top clientes por ventas (datos reales)
  private actualizarGraficoDona(
    data: { nombre: string; total: number }[]
  ): void {
    const colores = ['#2d3436','#74b9ff','#55efc4','#a29bfe','#fd79a8','#fdcb6e'];
    this.pieChartOptions = {
      tooltip: { trigger: 'item', formatter: '{b}: S/ {c} ({d}%)' },
      legend:  { orient: 'vertical', left: 'right', top: 'center',
                 textStyle: { fontSize: 11 } },
      series: [{
        type: 'pie', radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: data.length ? data.map((item, i) => ({
          value: Math.round(item.total * 100) / 100,
          name:  item.nombre,
          itemStyle: { color: colores[i % colores.length] }
        })) : [{ value: 0, name: 'Sin datos' }]
      }]
    };
  }

  // — Barras horizontales: top proveedores por monto (datos reales)
  private actualizarGraficoProveedores(compras: Compra[]): void {
    const conteo: { [key: string]: number } = {};
    compras.forEach(c => {
      if (c.proveedor?.empresa && c.total) {
        const nombre = c.proveedor.empresa;
        conteo[nombre] = (conteo[nombre] || 0) + Number(c.total);
      }
    });

    const sorted  = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const nombres = sorted.map(e => e[0]);
    const valores = sorted.map(e => Math.round(e[1] * 100) / 100);
    const colores = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe'];

    this.proveedoresChartOptions = {
      ...this.proveedoresChartOptions,
      yAxis: {
        type: 'category',
        data: nombres.length ? nombres : ['Sin compras registradas'],
        axisLabel: { fontSize: 12, color: '#475569' },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar', barWidth: '50%',
        data: valores.length ? valores.map((v, i) => ({
          value: v,
          itemStyle: { color: colores[i % colores.length], borderRadius: [0, 8, 8, 0] }
        })) : [{ value: 0 }],
        label: {
          show: true, position: 'right',
          formatter: (p: any) => `S/ ${(p.value / 1000).toFixed(1)}k`,
          color: '#475569', fontSize: 11
        }
      }] as SeriesOption[]
    };
  }

  // — Mini línea: compras últimos 4 días (datos reales)
  private actualizarMiniCompras(compras: Compra[]): void {
    const dias: string[]    = [];
    const totales: number[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = this.fechaLocal(d);
      dias.push(d.toLocaleDateString('es-PE', { weekday: 'short' }));
      const total = compras
        .filter(c => c.createdAt?.startsWith(key))
        .reduce((acc, c) => acc + Number(c.total || 0), 0);
      totales.push(Math.round(total * 100) / 100);
    }

    this.miniLineComprasOptions = {
      xAxis:  { type: 'category', data: dias, show: false },
      yAxis:  { type: 'value', show: false },
      series: [{
        type: 'line', smooth: true, data: totales,
        showSymbol: false, lineStyle: { color: '#f15bb5' }
      }]
    };
  }

  trackById(_: number, prod: Producto): number { return prod.id; }

  /** Fecha local en formato YYYY-MM-DD (evita el desfase de zona horaria de toISOString). */
  private fechaLocal(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private cargarDatosEChartsEstaticos(): void {
    this.barChartOptions = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category', data: [],
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { interval: 0, rotate: 35,
                     overflow: 'truncate', width: 90, fontSize: 11 }
      } as XAXisComponentOption,
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [{ type: 'bar', data: [] }] as SeriesOption[]
    };

    this.mainLineChartOptions = {
      tooltip: { trigger: 'axis' },
      xAxis:   { type: 'category', data: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'] },
      yAxis:   { type: 'value' },
      series:  [{ type: 'line', smooth: true, data: [0,0,0,0,0,0,0],
                  lineStyle: { color: '#4a00e0', width: 3 },
                  areaStyle: { color: 'rgba(74,0,224,0.08)' } }]
    };

    this.miniLineVentasOptions = {
      xAxis:  { type: 'category', data: ['','','',''], show: false },
      yAxis:  { type: 'value', show: false },
      series: [{ type: 'line', smooth: true, data: [0,0,0,0],
                 showSymbol: false, lineStyle: { color: '#16db93' } }]
    };

    this.miniLineComprasOptions = {
      xAxis:  { type: 'category', data: ['','','',''], show: false },
      yAxis:  { type: 'value', show: false },
      series: [{ type: 'line', smooth: true, data: [0,0,0,0],
                 showSymbol: false, lineStyle: { color: '#f15bb5' } }]
    };

    this.pieChartOptions = {
      tooltip: { trigger: 'item', formatter: '{b}: S/ {c} ({d}%)' },
      legend:  { orient: 'vertical', left: 'right', top: 'center' },
      series:  [{ type: 'pie', radius: ['50%', '70%'],
                  label: { show: false }, data: [] }]
    };

    this.proveedoresChartOptions = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const d = params[0];
          return `<b>${d.name}</b><br/>S/ ${d.value.toLocaleString('es-PE',
            { minimumFractionDigits: 2 })}`;
        }
      },
      grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: (val: number) => `S/ ${(val / 1000).toFixed(0)}k` },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      yAxis: {
        type: 'category', data: [],
        axisLabel: { fontSize: 12, color: '#475569' },
        axisLine: { show: false }, axisTick: { show: false }
      },
      series: [{ type: 'bar', data: [] }] as SeriesOption[]
    };
  }
}