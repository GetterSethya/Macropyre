import { SqlClient, SqlSchema } from '@effect/sql';
import type { Fragment } from '@effect/sql/Statement';
import { Effect, Schema } from 'effect';

/**
* Extracts the names of all methods from a class or object type.
*/
export type MethodNames<T> = {
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export type MethodsOnly<T> = Pick<T, MethodNames<T>>;

export type ListResponse<T> = {
    page: number;
    perPage: number;
    records: ReadonlyArray<T>;
    totalPages: number;
    totalItems: number;
};

export type CreateArgs<T> = {
    sql: SqlClient.SqlClient,
    item: Omit<T, 'created' | 'updated'>;
};

export type UpdateArgs<T> = {
    sql: SqlClient.SqlClient,
    id: string;
    item: Partial<Omit<T, 'id' | 'created' | 'updated'>>;
};

export type ViewArgs = {
    sql: SqlClient.SqlClient,
    id: string;
};

export type CommonOptions = {
    sort: string;
    filter: Fragment;
};

export type ListArgs = {
    sql: SqlClient.SqlClient,
    page: number;
    perPage: number;
    options?: CommonOptions;
};

export type ListAllArgs = {
    sql: SqlClient.SqlClient,
    options?: CommonOptions;
};

export type DeleteArgs = {
    sql: SqlClient.SqlClient,
    id: string
}

export const BaseSchema = Schema.Struct({
    id: Schema.String,
    created: Schema.Date.pipe(Schema.validDate()),
    updated: Schema.Date.pipe(Schema.validDate()),
})


export abstract class BaseModel<Out, In> {
    abstract tableName: () => string
    abstract schema: () => Schema.Schema<Out, In>

    // create
    create<Input = ReturnType<typeof this.schema>["Type"]>(args: CreateArgs<Input>) {
        return Effect.gen(this, function*() {

            const result = yield* SqlSchema.single({
                Request: Schema.Void,
                Result: this.schema(),
                execute: () => args.sql`INSERT INTO ${args.sql(this.tableName())} ${args.sql.insert(args.item)} RETURNING *`
            })().pipe(
                Effect.catchAll((error) => {
                    console.error(error);
                    return new ServiceUnknownError({
                        message: 'Failed creating new record',
                        originalError: error
                    });
                })
            )

            return result
        })
    }

    // update
    update<Input = ReturnType<typeof this.schema>["Type"]>(args: UpdateArgs<Input>) {
        return Effect.gen(this, function*() {

            const oldRecord = yield* SqlSchema.single({
                Request: Schema.String,
                Result: this.schema(),
                execute: (id) => args.sql`SELECT * FROM ${args.sql(this.tableName())} WHERE id=${id}`
            })(args.id).pipe(
                Effect.catchTags({
                    NoSuchElementException: (error) =>
                        new ServiceNotFoundError({
                            message: `Record with id ${args.id} does not exists`,
                            originalError: error
                        }),
                    ParseError: (error) =>
                        new ServiceUnknownError({
                            message: 'Failed parsing sql',
                            originalError: error
                        }),
                    SqlError: (error) =>
                        new ServiceUnknownError({
                            message: 'Failed parsing sql',
                            originalError: error
                        })
                })

            )

            const merged = {
                ...oldRecord,
                updated: new Date(),
                ...args.item
            };

            const updatedRecord = yield* SqlSchema.single({
                Request: this.schema(),
                Result: this.schema(),
                execute: (data) => args.sql`
						UPDATE ${args.sql(this.tableName())}
						SET ${args.sql.update(data as Record<string, any>, ['id'])}
						WHERE id = ${args.id} RETURNING *`
            })(merged).pipe(
                //
                Effect.catchTags({
                    NoSuchElementException: (error) =>
                        new ServiceNotFoundError({
                            message: `Record with id ${args.id} does not exists`,
                            originalError: error
                        }),
                    ParseError: (error) =>
                        new ServiceUnknownError({
                            message: 'Failed parsing sql',
                            originalError: error
                        }),
                    SqlError: (error) =>
                        new ServiceUnknownError({
                            message: 'Failed parsing sql',
                            originalError: error
                        })
                })

            )

            return updatedRecord
        })
    }
    // delete
    delete(args: DeleteArgs) {
        return Effect.gen(this, function*() {

            const result = yield* SqlSchema.void({
                Request: Schema.String,
                execute: (id) => args.sql`DELETE FROM ${args.sql(this.tableName())} WHERE id=${id}`
            })(args.id).pipe(
                Effect.catchTags({
                    ParseError: (error) =>
                        new ServiceUnknownError({
                            message: 'Failed parsing sql',
                            originalError: error
                        }),
                    SqlError: (error) =>
                        new ServiceUnknownError({
                            message: 'Failed parsing sql',
                            originalError: error
                        })
                })


            )

            return result
        })
    }


    view(args: ViewArgs) {
        return Effect.gen(this, function*() {

            const result = yield* SqlSchema.single({
                Request: Schema.String,
                Result: this.schema(),
                execute: (id) => args.sql`SELECT * FROM ${args.sql(this.tableName())} WHERE id=${id}`
            })(args.id).pipe(
                Effect.catchTags({
                    NoSuchElementException: (error) =>
                        new ServiceNotFoundError({
                            message: `Record with id ${args.id} does not exists`,
                            originalError: error
                        }),
                    ParseError: (error) =>
                        new ServiceUnknownError({
                            message: 'Failed parsing sql',
                            originalError: error
                        }),
                    SqlError: (error) =>
                        new ServiceUnknownError({
                            message: 'Failed parsing sql',
                            originalError: error
                        })
                })

            )

            return result
        })
    }

    // list
    list(args: ListArgs) {
        return Effect.gen(this, function*() {
            const offset = (args.page - 1) * args.perPage;

            const results = yield* SqlSchema.findAll({
                Request: Schema.Void,
                Result: this.schema(),
                execute: () =>
                    args.sql`
                        SELECT *
                        FROM ${args.sql(this.tableName())}
                        ${args.options?.filter && args.sql(`WHERE ${args.options.filter}`)}
                        ORDER BY created DESC
                        LIMIT ${args.sql(args.perPage.toString())}
                        OFFSET ${args.sql(offset.toString())}
					`
            })().pipe(
                Effect.catchAll(
                    (error) =>
                        new ServiceUnknownError({
                            message: 'error while performing listAll',
                            originalError: error
                        })
                )
            );


            const countResult = yield* args.sql<{ count: number }>`
                SELECT COUNT(*) AS count
                FROM ${args.sql(this.tableName())}
                ${args.options?.filter && args.sql(`WHERE ${args.options.filter}`)}
						`.pipe(
                //
                Effect.map((result) => {
                    return result.at(0) ?? { count: 0 };
                }),
                Effect.catchTag(
                    'SqlError',
                    (error) =>
                        new ServiceUnknownError({
                            message: 'error counting record',
                            originalError: error
                        })
                )
            );

            return {
                page: args.page,
                perPage: args.perPage,
                records: results,
                totalItems: countResult.count,
                totalPages: Math.ceil(countResult.count / args.perPage)
            };
        })
    }

    listAll(args: ListAllArgs) {
        return Effect.gen(this, function*() {
            const result = yield* SqlSchema.findAll({
                Request: Schema.Void,
                Result: this.schema(),
                execute: () =>
                    args.sql`
                        SELECT *
                        FROM ${args.sql(this.tableName())}
                        ${args?.options?.filter && args.sql(`WHERE ${args.options.filter}`)}
                    `
            })().pipe(
                Effect.catchAll(
                    (error) =>
                        new ServiceUnknownError({
                            message: 'error while performing listAll',
                            originalError: error
                        })
                )
            );

            return result;

        })
    }


    // firstList() { }

}

export class ServiceUnknownError extends Schema.TaggedError<ServiceUnknownError>(
    'ServiceUnknownError'
)('ServiceUnknownError', {
    message: Schema.String,
    originalError: Schema.Any
}) { }

export class ServiceNotFoundError extends Schema.TaggedError<ServiceNotFoundError>(
    'ServiceNotFoundError'
)('ServiceNotFoundError', {
    message: Schema.String,
    originalError: Schema.Any
}) { }

export class ServicePayloadError extends Schema.TaggedError<ServicePayloadError>(
    'ServicePayloadError'
)('ServicePayloadError', {
    message: Schema.String,
    originalError: Schema.Any
}) { }
