// src/app/Pages/clientes/clientes.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { FormsModule }                           from '@angular/forms';
import { RouterLink }                            from '@angular/router';
import { Cliente }                               from '../../Models/Cliente';
import { ClienteService }                        from '../../Services/cliente.service';

@Component({
  selector:    'app-clientes',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './clientes.component.html',
  styleUrls:   ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit {

  clientes:          Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  busqueda    = '';
  cargando    = true;
  error       = '';

  mostrarModal   = false;
  modoEdicion    = false;
  clienteEditId: number | null = null;

  form: Cliente = this.formVacio();

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef          // ← igual que Productos
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando = true;
    this.error    = '';

    this.clienteService.getAll().subscribe({
      next: (data) => {
        console.log('Clientes recibidos:', data);
        this.clientes          = data;
        this.clientesFiltrados = data;
        this.cargando          = false;
        this.cdr.detectChanges();           // ← fuerza actualización vista
      },
      error: (err) => {
        console.error('Error clientes:', err);
        this.error    = 'No se pudo conectar con el servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  buscar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.clientesFiltrados = this.clientes.filter(c =>
      c.nombre.toLowerCase().includes(q)                  ||
      (c.numeroDocumento ?? '').includes(q)               ||
      (c.telefono ?? '').includes(q)
    );
  }

  abrirModalNuevo(): void {
    this.form          = this.formVacio();
    this.modoEdicion   = false;
    this.clienteEditId = null;
    this.mostrarModal  = true;
    this.error         = '';
  }

  abrirModalEditar(c: Cliente): void {
    this.form = {
      nombre:          c.nombre,
      tipoDocumento:   c.tipoDocumento,
      numeroDocumento: c.numeroDocumento,
      telefono:        c.telefono,
      email:           c.email,
    };
    this.modoEdicion   = true;
    this.clienteEditId = c.id!;
    this.mostrarModal  = true;
    this.error         = '';
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.error        = '';
  }

  guardar(): void {
    if (!this.form.nombre.trim()) {
      this.error = 'El nombre del cliente es obligatorio.';
      return;
    }

    // Validación de documento según el tipo
    const doc = (this.form.numeroDocumento ?? '').trim();
    if (this.form.tipoDocumento === 'DNI') {
      if (!/^\d{8}$/.test(doc)) { this.error = 'El DNI debe tener exactamente 8 dígitos numéricos.'; return; }
    } else if (this.form.tipoDocumento === 'RUC') {
      if (!/^\d{20}$/.test(doc)) { this.error = 'El RUC debe tener exactamente 20 dígitos numéricos.'; return; }
    }

    // Unicidad del documento (excluye el propio registro al editar)
    if (doc) {
      const duplicado = this.clientes.some(c =>
        (c.numeroDocumento ?? '').trim() === doc && c.id !== this.clienteEditId);
      if (duplicado) { this.error = `Ya existe un cliente con el documento ${doc}.`; return; }
    }

    if (this.modoEdicion && this.clienteEditId !== null) {
      this.clienteService.update(this.clienteEditId, this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarClientes(); },
        error: (e) => { this.error = (e?.error && typeof e.error === 'string') ? e.error : 'Error al actualizar el cliente.'; this.cdr.detectChanges(); },
      });
    } else {
      this.clienteService.create(this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarClientes(); },
        error: (e) => { this.error = (e?.error && typeof e.error === 'string') ? e.error : 'Error al crear el cliente.'; this.cdr.detectChanges(); },
      });
    }
  }

  eliminar(c: Cliente): void {
    if (!confirm(`¿Eliminar al cliente "${c.nombre}"?`)) return;
    this.clienteService.delete(c.id!).subscribe({
      next: () => this.cargarClientes(),
      error: () => { this.error = 'Error al eliminar el cliente.'; },
    });
  }

  private formVacio(): Cliente {
    return {
      nombre:          '',
      tipoDocumento:   'DNI',
      numeroDocumento: '',
      telefono:        '',
      email:           '',
    };
  }
}