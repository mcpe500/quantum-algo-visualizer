import { expect, test } from '@playwright/test';

type OverflowReport = {
  index: number;
  text: string;
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
};

async function expectNoQFTProblemOverflow(page: import('@playwright/test').Page) {
  const root = page.getByTestId('qft-problem-statement');
  const overflowReport = await root.locator('[data-qft-ps-check="no-overflow"]').evaluateAll((nodes) =>
    nodes
      .map((node, index) => {
        const element = node as HTMLElement;
        return {
          index,
          text: element.textContent?.trim() ?? '',
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        };
      })
      .filter(
        (item) =>
          item.scrollWidth > item.clientWidth + 1 ||
          item.scrollHeight > item.clientHeight + 1
      )
  );

  expect(overflowReport as OverflowReport[]).toEqual([]);
}

test.describe('QFT problem statement validation', () => {
  test('renders the QFT-01 problem as time signal -> Fourier/QFT -> dominant frequency bin', async ({ page }) => {
    await page.goto('/qft');

    const root = page.getByTestId('qft-problem-statement');
    await expect(root).toBeVisible();
    await expect(root.getByTestId('qft-case-id')).toHaveText('QFT-01');
    await expect(root.getByTestId('qft-input-count')).toContainText('28 -> 32 titik');
    await expect(root.getByText('x[t]')).toBeVisible();
    await expect(root.getByText('X[k]')).toBeVisible();
    await expect(root.getByText('Mencari frekuensi dominan')).toBeVisible();
    await expect(root.getByTestId('qft-flow-summary')).toContainText('x[t] -> Fourier/QFT -> X[k]');
    await expect(root.getByTestId('qft-output-primary-bin')).toContainText(/k = \d+/);
    await expect(root.getByTestId('qft-dominant-bins')).toContainText(/bin \d+/);

    await expectNoQFTProblemOverflow(page);
  });

  test('changes the visualized source data when the selected QFT case changes', async ({ page }) => {
    await page.goto('/qft');
    await expect(page.getByTestId('qft-problem-statement')).toBeVisible();

    await page.locator('select').selectOption('QFT-02');

    const root = page.getByTestId('qft-problem-statement');
    await expect(root.getByTestId('qft-case-id')).toHaveText('QFT-02');
    await expect(root.getByTestId('qft-input-count')).toContainText('64 titik');
    await expect(root.getByTestId('qft-dominant-bins')).toContainText(/bin \d+/);

    await expectNoQFTProblemOverflow(page);
  });
});