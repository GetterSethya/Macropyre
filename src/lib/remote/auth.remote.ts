import { form } from '$app/server';
import {
	handleServerRuntimeError,
	ServerRuntime,
	SveltekitRedirect
} from '$lib/runtime/server-runtime';
import { LoginFormSchema, RegisterFormSchema } from '$lib/schema/auth-schema';
import { Hash } from '$lib/service/hashService';
import { Store } from '$lib/service/storeService';
import { User } from '$lib/service/userService';
import { Console, Effect, Schema } from 'effect';
import { ulid } from 'ulid';

export const loginRemoteForm = form(Schema.standardSchemaV1(LoginFormSchema), (formData) => {});

export const registerRemoteForm = form(Schema.standardSchemaV1(RegisterFormSchema), (formData) =>
	Effect.gen(function* () {
		yield* Console.log(formData.name, formData.email);

		const userService = yield* User.Service;
		const hashService = yield* Hash.Service;
		const storeService = yield* Store.Service;

		const hashPassword = yield* hashService.hash(formData.password);

		const userId = ulid();
		const storeId = ulid();

		yield* storeService.create({
			item: {
				id: storeId,
				name: 'My Store',
				address: '',
				store_type: 'type_physical',
				store_category: 'cat_retail'
			}
		});

		yield* userService.create({
			item: {
				id: userId,
				email: formData.email,
				name: formData.name,
				last_login: new Date().toISOString(),
				complete_onboarding: '',
				hash_password: hashPassword,
				role: 'owner',
				store: storeId,
				verified: ''
			}
		});

		yield* userService.update({
			id: userId,
			item: {
				store: storeId
			}
		});

		return yield* new SveltekitRedirect({
			status: 307,
			location: '/login'
		});
	})
		.pipe(ServerRuntime.runPromiseExit)
		.then(handleServerRuntimeError)
);
