/**
 * The model pickers hold a choice, as the language pickers do (#450): a tap opens the whole list,
 * and on a phone the keyboard coming up doesn't close it as it opens.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureApi } from '@/api/capture/queries';
import type { AiModelListing, AiModels, AiProvider } from '@/api/capture/types';
import { renderUI } from '@/test/render';
import { ModelPickers } from './model-picker';

const provider: AiProvider = {
  id: '01926f00-0000-7000-8000-00000000a001',
  scope: 'account',
  kind: 'openrouter',
  label: null,
  baseUrl: null,
  keyHint: 'abcd',
  models: { vision: 'openai/gpt-6-luna', chat: 'openai/gpt-6-luna' },
  capabilities: {},
  reasoning: 'low',
  disabled: false,
  rowVersion: 1,
};

const model = (id: string): AiModelListing['models'][number] => ({
  id,
  vision: true,
  text: true,
  embeddings: false,
  visionSource: 'listing',
  free: false,
  typed: false,
});

const listing: AiModelListing = {
  models: [model('google/gemini-3.7-flash'), model('openai/gpt-6-luna'), model('qwen/qwen3.8-max')],
  fetchedAt: '2026-11-08T12:00:00.000Z',
  chosenMissing: [],
};

function Pickers() {
  const [value, setValue] = useState<AiModels>(provider.models);
  return <ModelPickers provider={provider} value={value} onChange={setValue} />;
}

describe('ModelPickers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // A tap brings up the keyboard, and the browser scrolls the box clear of it. React Aria closes
  // a popover like this one on any scroll of what's around it.
  it('stays open when the keyboard coming up scrolls the page', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: coarse)' }));
    vi.spyOn(captureApi, 'aiModels').mockResolvedValue(listing);
    const { user } = await renderUI(<Pickers />);
    await user.click(await screen.findByRole('combobox', { name: 'Photos and receipts' }));
    fireEvent.scroll(window);
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(3);
  });
});
