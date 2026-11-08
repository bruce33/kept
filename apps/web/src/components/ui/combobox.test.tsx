import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { expectLogicalOnly, renderUI } from '@/test/render';
import { Combobox } from './combobox';

const currencies = [
  { id: 'EGP', label: 'Egyptian pound' },
  { id: 'USD', label: 'US dollar' },
  { id: 'EUR', label: 'Euro' },
];

describe('Combobox', () => {
  it('renders a labelled combobox, never a native select', async () => {
    const { container } = await renderUI(<Combobox label="Currency" items={currencies} />);
    expect(screen.getByRole('combobox', { name: 'Currency' })).toBeInTheDocument();
    expect(container.querySelector('select')).toBeNull();
  });

  it('filters by typing and chooses with the keyboard', async () => {
    const onSelectionChange = vi.fn();
    const { user } = await renderUI(
      <Combobox label="Currency" items={currencies} onSelectionChange={onSelectionChange} />,
    );
    await user.tab();
    await user.keyboard('eur');
    const listbox = screen.getByRole('listbox');
    expect(
      within(listbox)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Euro']);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectionChange).toHaveBeenLastCalledWith('EUR');
    expect(screen.getByRole('combobox')).toHaveValue('Euro');
  });

  it('opens with ArrowDown and closes with Escape', async () => {
    const { user } = await renderUI(<Combobox label="Currency" items={currencies} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('option')).toHaveLength(3);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // React Aria scrolls the chosen option into view inside the list. When only the popover around
  // it scrolled, React Aria scrolled the page instead, and a page scroll closes the popover: a long
  // list (a provider's models) opened and shut twice before it stayed open.
  it('scrolls the list, not the popover around it', async () => {
    const { user } = await renderUI(<Combobox label="Currency" items={currencies} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveClass('overflow-y-auto');
    expect(listbox.parentElement).toHaveClass('overflow-hidden');
  });

  it('renders RTL with the translated empty state', async () => {
    const { user } = await renderUI(<Combobox label="العملة" items={currencies} />, {
      locale: 'ar',
    });
    await user.tab();
    await user.keyboard('zzz');
    expect(screen.getByText('لا توجد نتائج')).toBeInTheDocument();
    expectLogicalOnly();
  });
});
