import { dev } from "$app/environment";
import { Hash } from "$lib/service/hashService";
import { User } from "$lib/service/user";
import type { IntRange } from "$lib/utils";
import { error, fail, invalid, redirect } from "@sveltejs/kit";
import { Data, Exit, Layer, ManagedRuntime } from "effect";


const AppLayer = Layer.mergeAll(
    User.Service.layer(),
    Hash.Service.layer()
)

export const ServerRuntime = ManagedRuntime.make(AppLayer)

export function handleServerRuntimeError<A, E>(exit: Exit.Exit<A, E>) {
    return Exit.match(exit, {
        onSuccess: (data) => data,
        onFailure: (cause) => {
            if (cause._tag === 'Fail') {
                const err = cause.error

                if (err instanceof SveltekitInvalid) {
                    return invalid(...err.issues)
                }

                if (err instanceof SveltekitRedirect) {
                    return redirect(err.status, err.location)
                }

                if (err instanceof SveltekitFail) {
                    return fail(err.status)
                }

                if (err instanceof SveltekitError) {
                    return error(err.status, err.body)
                }

            }

            return error(500, dev ? JSON.stringify(cause.toJSON()) : "something went wrong")
        }
    })
}

export class SveltekitInvalid extends Data.TaggedError("SveltekitInvalid")<{
    issues: {
        message: string
        path: string[]
    }[]
}> { }

export class SveltekitRedirect extends Data.TaggedError("SveltekitRedirect")<{
    status: IntRange<300, 309>
    location: string | URL
}> { }

export class SveltekitError extends Data.TaggedError("SveltekitError")<{
    status: number
    body: App.Error
}> { }

export class SveltekitFail extends Data.TaggedError("SveltekitFail")<{
    status: number
}> { }
