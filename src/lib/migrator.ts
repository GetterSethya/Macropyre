import { SqliteMigrator } from "@effect/sql-sqlite-node"
import { migrations } from './migrations';
import { Effect, Layer } from 'effect';
import { SqlClient } from '@effect/sql';
import { SqlLive } from './sql';
import { NodeContext, NodeRuntime } from '@effect/platform-node';

export const MigratorLive = SqliteMigrator.layer({
    loader: SqliteMigrator.fromRecord(migrations)
}).pipe(
    //
    Layer.provide(SqlLive)
);

const program = Effect.gen(function*() {
    yield* SqlClient.SqlClient;
    yield* Effect.logInfo('Migration applied success');
}).pipe(
    //
    Effect.provide(
        //
        Layer.mergeAll(SqlLive, MigratorLive).pipe(
            Layer.provide(
                //
                NodeContext.layer
            )
        )
    )
);

NodeRuntime.runMain(program);
