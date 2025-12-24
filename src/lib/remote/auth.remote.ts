import { form } from '$app/server';
import { ServerRuntime } from '$lib/runtime/server-runtime';
import { LoginFormSchema, RegisterFormSchema } from '$lib/schema/auth-schema';
import { User } from '$lib/service/user';
import { error } from '@sveltejs/kit';
import { Console, Context, Effect, Layer, ManagedRuntime, Schema } from 'effect';

export const loginRemoteForm = form(Schema.standardSchemaV1(LoginFormSchema), (formData) => { });

// TODO
export const registerRemoteForm = form(
    Schema.standardSchemaV1(RegisterFormSchema),
    (formData) => Effect.gen(function*() {
        yield* Console.log(formData.name, formData.email)

        const userService = yield* User.Service


        const user =yield* userService.create({
            item: {
                email: formData.email,
                name: formData.name,
                last_login: new Date(),
                complete_onboarding: "",
                hash_password: "aksjdskdj",
                role: "owner",
                store: "",
                verified: ""

            }
        })



    }).pipe(
        ServerRuntime.runPromise
    )
);

