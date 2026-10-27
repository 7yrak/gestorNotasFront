type Entry = {
  pageId: string;
  pending?: () => Promise<void>;
  timer?: ReturnType<typeof setTimeout>;
  running: boolean;
  failed: boolean;
};

/** Keeps each page/field independent and serializes writes to the same field. */
export class AutosaveQueue {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly changed: () => void) {}

  schedule(pageId: string, field: string, save: () => Promise<void>, delay: number) {
    const key = `${pageId}:${field}`;
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { pageId, running: false, failed: false };
      this.entries.set(key, entry);
    }
    clearTimeout(entry.timer);
    entry.pending = save;
    entry.failed = false;
    entry.timer = setTimeout(() => {
      entry!.timer = undefined;
      void this.run(entry!);
    }, delay);
    this.changed();
  }

  flush() {
    for (const entry of this.entries.values()) {
      clearTimeout(entry.timer);
      entry.timer = undefined;
      void this.run(entry);
    }
  }

  status(pageId: string): 'idle' | 'saving' | 'saved' | 'error' {
    const entries = [...this.entries.values()].filter(entry => entry.pageId === pageId);
    if (entries.some(entry => entry.failed)) return 'error';
    if (entries.some(entry => entry.running || entry.pending)) return 'saving';
    return entries.length ? 'saved' : 'idle';
  }

  private async run(entry: Entry): Promise<void> {
    if (entry.running || !entry.pending) return;
    const save = entry.pending;
    entry.pending = undefined;
    entry.running = true;
    entry.failed = false;
    this.changed();
    try {
      await save();
    } catch {
      // Keep the draft available for a retry when the user returns to the page.
      entry.failed = true;
      entry.pending ??= save;
    } finally {
      entry.running = false;
      this.changed();
    }
    if (entry.pending && !entry.failed && !entry.timer) await this.run(entry);
  }
}
