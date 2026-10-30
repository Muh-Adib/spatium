#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3e6e8b79a6232e574f27f9c366ba4d774d9c868da2dd6ce98ab78322b9fd16d1/contract';
import endContract from '../../snapshots/3e6e8b79a6232e574f27f9c366ba4d774d9c868da2dd6ce98ab78322b9fd16d1/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/49beb91e15be63832c892032c66ba07536a54bf48de42fb85a3adbabb05e16ce/contract';
import startContract from '../../snapshots/49beb91e15be63832c892032c66ba07536a54bf48de42fb85a3adbabb05e16ce/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'content_revisions',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('actor', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('entity_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entity_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('snapshot', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'wordpress_snapshots',
        columns: [
          col('entity_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('local_hash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('payload', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('source_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('source_url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('synced_at', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('target_id', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('wp_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'articles',
        column: col('publication_timezone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'articles',
        column: col('schedule_error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'articles',
        column: col('scheduled_at', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'articles',
        column: col('scheduled_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'wordpress_snapshots',
        constraint: 'wordpress_snapshots_source_url_entity_type_wp_id_key',
        columns: ['source_url', 'entity_type', 'wp_id'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
