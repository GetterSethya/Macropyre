import { form } from '$app/server';
import { handleServerRuntimeError, ServerRuntime, SveltekitRedirect } from '$lib/runtime/server-runtime';
import { LoginFormSchema, RegisterFormSchema } from '$lib/schema/auth-schema';
import { Hash } from '$lib/service/hashService';
import { User } from '$lib/service/user';
import type { IntRange } from '$lib/utils';
import { error, redirect, fail, invalid } from '@sveltejs/kit';
import { Console, Context, Data, Effect, Layer, ManagedRuntime, Schema } from 'effect';
import { ulid } from 'ulid';

export const loginRemoteForm = form(Schema.standardSchemaV1(LoginFormSchema), (formData) => { });

export const registerRemoteForm = form(
    Schema.standardSchemaV1(RegisterFormSchema),
    (formData) => Effect.gen(function*() {
        yield* Console.log(formData.name, formData.email)

        const userService = yield* User.Service
        const hashService = yield* Hash.Service

        const isPasswordOk = formData.confirm_password === formData.password

        if (!isPasswordOk) {
            // error(400, "Invalid payload")
        }

        const hashPassword = yield* hashService.hash(formData.password)

        yield* userService.create({
            item: {
                id: ulid(),
                email: formData.email,
                name: formData.name,
                last_login: new Date().toISOString(),
                complete_onboarding: "",
                hash_password: hashPassword,
                role: "owner",
                store: "default_store",
                verified: ""

            }
        })

        return yield* new SveltekitRedirect({
            status: 307,
            location: "/login"
        })


    }).pipe(
        ServerRuntime.runPromiseExit
    ).then(handleServerRuntimeError)
);
