import { expect, test } from '@playwright/test';

test('algorithm selector exposes core benchmark routes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Deutsch-Jozsa|Quantum Fourier Transform|VQE|QAOA/i).first()).toBeVisible();
});

test('Formula Studio scenario loader and project actions are visible', async ({ page }) => {
  await page.goto('/formulas');
  await page.getByRole('button', { name: /Studio/i }).click();
  await expect(page.getByTitle('Export project Formula Studio sebagai .qav-project')).toBeVisible();
  await expect(page.getByTitle('Import project Formula Studio dari .qav-project')).toBeVisible();
  await expect(page.getByTitle('Undo perubahan canvas (Ctrl+Z)')).toBeVisible();
  await expect(page.getByTitle('Redo perubahan canvas (Ctrl+Y)')).toBeVisible();
});

test('Qubit Playground Circuit Lab shows code and decomposition panel', async ({ page }) => {
  await page.goto('/playground/circuit');
  await page.getByRole('button', { name: /Source Code/i }).click();
  await expect(page.getByText(/Decomposition \+ Optimization/i)).toBeVisible();
  await expect(page.getByText(/Qiskit Source|Cirq Source|ProjectQ Source/i)).toBeVisible();
});

test('hardware comparison page loads comparison surface', async ({ page }) => {
  await page.goto('/hardware/compare');
  await expect(page.getByText(/hardware|comparison|platform/i).first()).toBeVisible();
});
