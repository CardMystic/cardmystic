import type { Page } from '@playwright/test';

export async function openDeckAction(page: Page, name: string | RegExp) {
  await page
    .getByRole('button', { name: 'More deck actions', exact: true })
    .click();
  await page
    .getByRole('menuitem', { name, exact: typeof name === 'string' })
    .click();
}
