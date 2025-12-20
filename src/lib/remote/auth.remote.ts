import { form } from '$app/server';
import { LoginFormSchema, RegisterFormSchema } from '$lib/schema/auth-schema';
import { Context, Effect, Layer, ManagedRuntime, Schema } from 'effect';

export const loginRemoteForm = form(Schema.standardSchemaV1(LoginFormSchema), (formData) => {});

// TODO
export const registerRemoteForm = form(
	Schema.standardSchemaV1(RegisterFormSchema),
	(formData) => {}
);
