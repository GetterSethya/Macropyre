import { Context, Effect, Layer, Schema } from 'effect';
import {
    BaseModel,
    ServiceNotFoundError,
    ServicePayloadError,
    ServiceUnknownError,
    type MethodsOnly,
    type UpdateArgs,
    type ViewArgs
} from './baseService';
import { SqlSchema } from '@effect/sql';

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
type ServiceSchemaEncoded = typeof ServiceSchema.Encoded


class Model extends BaseModel<ServiceSchemaType, ServiceSchemaEncoded> {
    tableName = () => "users";
    schema = () => ServiceSchema

    updateHash(args: UpdateArgs<{ hash_password: ServiceSchemaType['hash_password'] }>) {
        return Effect.gen(this, function*() {
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
                execute: ({ id, hash_password }) => args.sql`
							UPDATE ${args.sql(this.tableName())} SET hash_password = ${hash_password}
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
        })
    }

    viewHash(args: ViewArgs) {
        return Effect.gen(this, function*() {
            const result = yield* SqlSchema.single({
                Request: Schema.String,
                Result: ServiceSchema.pick('hash_password'),
                execute: (id) => args.sql`SELECT hash_password FROM ${args.sql(this.tableName())} WHERE id=${id}`
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
        })
    }
}

class Service extends Context.Tag('macropyre/lib/service/user/Service')<
    Service,
    MethodsOnly<Model>
>() {

    public static model = new Model()

    public static layer() {
        return Layer.succeed(
            Service,
            Service.of({
                schema: this.model.schema,
                update: this.model.update,
                listAll: this.model.listAll,
                list: this.model.list,
                view: this.model.view,
                delete: this.model.delete,
                tableName: this.model.tableName,
                create: this.model.create,
                updateHash: this.model.updateHash,
                viewHash: this.model.viewHash
            })
        );
    }
}

export const User = { Service, ServiceSchema };

export type { ServiceSchemaType };
