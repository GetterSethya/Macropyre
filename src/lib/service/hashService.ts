import { hash, verify } from "@node-rs/argon2";
import { Context, Effect, Layer, Schema } from "effect";

export class HashError extends Schema.TaggedError<HashError>("HashError")("HashError", {
    message: Schema.String,
    originalError: Schema.Any
}) { }

export class HashVerifyError extends Schema.TaggedError<HashVerifyError>("HashVerifyError")("HashVerifyError", {
    message: Schema.String,
    originalError: Schema.Any
}) { }

export class Service extends Context.Tag("macropyre/lib/service/hashService")<Service, {
    hash: (text: string | Uint8Array) => Effect.Effect<string, HashError>
    verify: (hash: string | Uint8Array, plainText: string | Uint8Array) => Effect.Effect<boolean, HashVerifyError>
}>() {
    public static layer() {
        return Layer.succeed(
            Service,
            Service.of({
                verify: (hashString, plainText) => Effect.tryPromise({
                    try: () => verify(hashString, plainText),
                    catch: (error) => new HashVerifyError({
                        message: 'Error when verifying hash',
                        originalError: error
                    })
                }),
                hash: (text) => Effect.tryPromise({
                    try: () => hash(text),
                    catch: (error) => new HashError({
                        message: "Error when hashing",
                        originalError: error
                    })
                })
            })
        )
    }
}


export const Hash = {
    Service
}
