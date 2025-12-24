import { Context, Effect, Layer, Schema } from 'effect';
import {
    ServiceNotFoundError,
    ServicePayloadError,
    ServiceUnknownError,
    type CreateArgs,
    type ListAllArgs,
    type ListArgs,
    type ListResponse,
    type UpdateArgs,
    type ViewArgs
} from './baseService';
import { SqlSchema } from '@effect/sql';
import { SqlClient } from '@effect/sql/SqlClient';
import { SqlLive } from '$lib/sql';

const ServiceSchema = Schema.Struct({
    id: Schema.String,
    created: Schema.Date.pipe(Schema.validDate()),
    updated: Schema.Date.pipe(Schema.validDate()),
    verified: Schema.Union(Schema.String, Schema.Date.pipe(Schema.validDate())),
    email: Schema.String,
    name: Schema.String,
    role: Schema.Literal('owner', 'staff'),
    complete_onboarding: Schema.Union(Schema.String, Schema.Date.pipe(Schema.validDate())),
    hash_password: Schema.String.pipe(Schema.nonEmptyString()),
    last_login: Schema.Union(Schema.String, Schema.Date.pipe(Schema.validDate())),
    store: Schema.String
});

type ServiceSchemaType = typeof ServiceSchema.Type;

class Service extends Context.Tag('macropyre/lib/service/user/Service')<
    Service,
    {
        create: (
            args: CreateArgs<ServiceSchemaType>
        ) => Effect.Effect<ServiceSchemaType, ServiceUnknownError>;
        update: (
            args: UpdateArgs<Omit<ServiceSchemaType, 'hash_password'>>
        ) => Effect.Effect<
            Omit<ServiceSchemaType, 'hash_password'>,
            ServiceNotFoundError | ServiceUnknownError
        >;
        view: (
            args: ViewArgs
        ) => Effect.Effect<
            Omit<ServiceSchemaType, 'hash_password'>,
            ServiceNotFoundError | ServiceUnknownError
        >;
        list: (
            args: ListArgs
        ) => Effect.Effect<ListResponse<Omit<ServiceSchemaType, 'hash_password'>>, ServiceUnknownError>;
        listAll: (
            args: ListAllArgs
        ) => Effect.Effect<
            ReadonlyArray<Omit<ServiceSchemaType, 'hash_password'>>,
            ServiceUnknownError
        >;
        viewHash: (
            args: ViewArgs
        ) => Effect.Effect<
            ServiceSchemaType['hash_password'],
            ServiceNotFoundError | ServiceUnknownError
        >;
        updateHash: (
            args: UpdateArgs<{ hash_password: ServiceSchemaType['hash_password'] }>
        ) => Effect.Effect<
            ServiceSchemaType['hash_password'],
            ServiceNotFoundError | ServiceUnknownError | ServicePayloadError
        >;
    }
>() {
    public static tableName() {
        return 'users';
    }

    public static layer() {
        return Layer.effect(
            Service,
            Effect.gen(this, function*() {
                const tableName = this.tableName();
                const sql = yield* SqlClient;

                return Service.of({
                    viewHash: Effect.fn(function*(args) {
                        const result = yield* SqlSchema.single({
                            Request: Schema.String,
                            Result: ServiceSchema.pick('hash_password'),
                            execute: (id) => sql`SELECT hash_password FROM ${sql(tableName)} WHERE id=${id}`
                        })(args.id).pipe(
                            //
                            Effect.catchTags({
                                NoSuchElementException: (error) =>
                                    new ServiceNotFoundError({
                                        message: `Record with id ${args.id} did not exists`,
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
                        );

                        return result.hash_password;
                    }),

                    updateHash: Effect.fn(function*(args) {
                        if (!args.item.hash_password) {
                            return yield* Effect.fail(
                                new ServicePayloadError({
                                    message: 'Invalid payload',
                                    originalError: undefined
                                })
                            );
                        }

                        const updatedHash = yield* SqlSchema.single({
                            Request: Schema.Struct({
                                id: Schema.String,
                                hash_password: Schema.String
                            }),
                            Result: Schema.String,
                            execute: ({ id, hash_password }) => sql`
							UPDATE ${sql(tableName)} SET hash_password = ${hash_password}
							WHERE id = ${id}
							RETURNING hash_password
							`
                        })({ hash_password: args.item.hash_password, id: args.id }).pipe(
                            //
                            Effect.catchTags({
                                NoSuchElementException: (error) =>
                                    new ServiceNotFoundError({
                                        message: `Record with id ${args.id} did not exists`,
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
                        );

                        return updatedHash;
                    }),

                    listAll: Effect.fn(function*(args) {
                        const result = yield* SqlSchema.findAll({
                            Request: Schema.Void,
                            Result: ServiceSchema.omit('hash_password'),
                            execute: () =>
                                sql`
								SELECT *
								FROM ${sql(tableName)}
								${args.options?.filter && sql(`WHERE ${args.options.filter}`)}`
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
                    }),
                    list: Effect.fn(function*(args) {
                        const offset = (args.page - 1) * args.perPage;

                        const results = yield* SqlSchema.findAll({
                            Request: Schema.Void,
                            Result: ServiceSchema.omit('hash_password'),
                            execute: () =>
                                sql`
							SELECT *
							FROM ${sql(tableName)}
							${args.options?.filter && sql(`WHERE ${args.options.filter}`)}
							ORDER BY created DESC
							LIMIT ${sql(args.perPage.toString())}
							OFFSET ${sql(offset.toString())}
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

                        const countResult = yield* sql<{ count: number }>`
						SELECT COUNT(*) AS count
						FROM ${sql(tableName)}
						${args.options?.filter && sql(`WHERE ${args.options.filter}`)}
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
                    }),

                    view: Effect.fn(function*(args) {
                        const result = yield* SqlSchema.single({
                            Request: Schema.String,
                            Result: ServiceSchema.omit('hash_password'),
                            execute: (id) => sql`SELECT * FROM ${sql(tableName)} WHERE id=${id}`
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
                        );

                        return result;
                    }),
                    create: Effect.fn(function*(args) {
                        const result = yield* SqlSchema.single({
                            Request: Schema.Void,
                            Result: ServiceSchema,
                            execute: () => sql`
							  INSERT INTO ${sql(tableName)} ${sql.insert(args.item)} RETURNING *
							`
                        })().pipe(
                            Effect.catchAll(
                                (error) => {
                                    console.error(error)
                                    return new ServiceUnknownError({
                                        message: 'Failed creating new record',
                                        originalError: error
                                    })
                                }
                            )
                        );

                        return result;
                    }),
                    update: Effect.fn(function*(args) {
                        const oldRecord = yield* SqlSchema.single({
                            Request: Schema.String,
                            Result: ServiceSchema.omit('hash_password'),
                            execute: (id) => sql`SELECT * FROM ${sql(tableName)} WHERE id=${id}`
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
                        );

                        const merged = {
                            ...oldRecord,
                            updated: new Date(),
                            ...args.item
                        };

                        const updatedRecord = yield* SqlSchema.single({
                            Request: Schema.Void,
                            Result: ServiceSchema.omit('hash_password'),
                            execute: () => sql`
						UPDATE ${sql(tableName)}
						SET ${sql.update(merged, ['id'])}
						WHERE id = ${args.id} RETURNING *`
                        })().pipe(
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
                        );

                        return updatedRecord;
                    })
                });
            })
        ).pipe(
            Layer.provide(SqlLive)
        );
    }
}

export const User = { Service, ServiceSchema };

export type { ServiceSchemaType };
