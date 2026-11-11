   import { test, expect } from '@playwright/test';

   test.describe('Demostración: pantalla de inicio de sesión', () => {
     test('muestra el formulario de login', async ({ page }) => {
       await page.goto('/login');
       await expect(page.getByRole('heading', { name: 'Sistema Ferretería' })).toBeVisible();
       await expect(page.getByPlaceholder('Ingrese correo')).toBeVisible();
       await expect(page.getByRole('button', { name: 'Ingresar al Sistema' })).toBeVisible();
     });
     test('con los campos vacíos pide correo y contraseña', async ({ page }) => {
       await page.goto('/login');
       await page.getByRole('button', { name: 'Ingresar al Sistema' }).click();
       await expect(page.getByText('Ingresa tu correo y contraseña.')).toBeVisible();
     });
     test('una ruta protegida sin sesión redirige al login', async ({ page }) => {
       await page.goto('/dashboard');
       await expect(page).toHaveURL(/\/login$/);
     });
     test('"¿Olvidaste tu contraseña?" abre la recuperación', async ({ page }) => {
       await page.goto('/login');
       await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
       await expect(page.getByText('Recuperar contraseña')).toBeVisible();
     });
   });