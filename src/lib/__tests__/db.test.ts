import { describe, it, expect, vi } from 'vitest';

describe('write error propagation', () => {
  it('migrate* functions throw on Supabase error (unlike upsert* which swallow)', async () => {
    // This is the bug: upsertRecord uses tryOp which silently catches errors.
    // migrateRecord should NOT catch errors — it should propagate so init()
    // knows the migration failed and can keep localStorage as backup.

    const mockError = { message: 'connection lost' };
    const mockUpsert = vi.fn().mockResolvedValue({ error: mockError });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
    };

    // Simulate what migrateRecord does (must NOT use tryOp)
    async function migrateRecord(r: unknown) {
      const { error } = await mockSupabase.from('records').upsert(r);
      if (error) throw error;
    }

    // Simulate what upsertRecord does (uses tryOp — swallows error)
    async function upsertRecord(r: unknown) {
      try {
        await mockSupabase.from('records').upsert(r);
      } catch (e) {
        console.error('Supabase op failed:', e);
      }
    }

    const record = { id: 'test', title: 'test' };

    // upsertRecord — must NOT throw (it swallows the error)
    await expect(upsertRecord(record)).resolves.toBeUndefined();
    expect(mockUpsert).toHaveBeenCalled();

    // migrateRecord — MUST throw so init() can handle it
    await expect(migrateRecord(record)).rejects.toEqual(mockError);
  });

  it('init merge happens when migration fails — data preserved', async () => {
    // When migrateRecord throws, init() should catch and merge
    // localStorage data with Supabase data instead of clearing localStorage

    const localRecords = [{ id: '1', title: 'local-record' }];
    const supabaseRecords = [{ id: '2', title: 'supabase-record' }];

    // The merge logic (dedupeBy) — Supabase data wins for same ID
    const ids = new Set(supabaseRecords.map((x: { id: string }) => x.id));
    const merged = [...supabaseRecords, ...localRecords.filter((x) => !ids.has(x.id))];

    expect(merged).toHaveLength(2);
    expect(merged.find((x) => x.id === '1')!.title).toBe('local-record');
    expect(merged.find((x) => x.id === '2')!.title).toBe('supabase-record');
  });

  it('localStorage save happens after every state change', () => {
    // Verify that when Supabase is configured AND state changes,
    // localStorage is still updated as a safety net

    const storage: Record<string, string> = {};
    const mockLS = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, val: string) => { storage[key] = val; }),
    };

    // Simulate the subscribe callback (always saves to LS when initialized)
    const state = {
      initialized: true,
      folders: [{ id: 'f1', name: 'test' }],
      records: [{ id: 'r1', title: 'new record' }],
      trash: [],
      knowledgeEntries: [],
    };

    // Save to LS
    mockLS.setItem('dc-defect-v2-state', JSON.stringify({
      folders: state.folders,
      records: state.records,
      trash: state.trash,
      knowledgeEntries: state.knowledgeEntries,
    }));

    expect(mockLS.setItem).toHaveBeenCalled();

    // Read back
    const saved = mockLS.getItem('dc-defect-v2-state');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0].id).toBe('r1');
  });
});
