import { User } from "$lib/service/user";
import { Layer, ManagedRuntime } from "effect";


const AppLayer = Layer.mergeAll(
    User.Service.layer(),
)

export const ServerRuntime = ManagedRuntime.make(AppLayer)
