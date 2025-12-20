import { Schema } from 'effect';

export const LoginFormSchema = Schema.Struct({
	email: Schema.Trim.pipe(
		Schema.pattern(
			/^(?!\.)(?!.*\.\.)([A-Z0-9_+-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
			{
				message: () => 'Invalid email format'
			}
		)
	),
	password: Schema.Trim.pipe(
		Schema.minLength(8, {
			message: () => 'Password is too short'
		}),
		Schema.maxLength(100, {
			message: () => 'Password is too long'
		})
	)
});

export type LoginFormSchemaType = typeof LoginFormSchema.Type;

export const RegisterFormSchema = Schema.Struct({
	email: Schema.Trim.pipe(
		Schema.pattern(
			/^(?!\.)(?!.*\.\.)([A-Z0-9_+-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
			{
				message: () => 'Invalid email format'
			}
		)
	),
	name: Schema.Trim.pipe(Schema.nonEmptyString({ message: () => 'Name cannot empty' })),
	password: Schema.Trim.pipe(
		Schema.minLength(8, {
			message: () => 'Password is too short'
		}),
		Schema.maxLength(100, {
			message: () => 'Password is too long'
		})
	),
	confirm_password: Schema.String.pipe(Schema.nonEmptyString({
        message:()=>'Confirm password cannot empty'
    }))
}).pipe(
	//
	Schema.filter((form) => {
		if (form.confirm_password === form.password) {
			return true;
		}

		return {
			path: ['confirm_password'],
			message: 'Confirm password did not match'
		};
	})
);

export type RegisterFormSchemaType = typeof RegisterFormSchema.Type;
