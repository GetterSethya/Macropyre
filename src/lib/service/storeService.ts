import { Context, Layer, Schema } from 'effect';
import {
    BaseModel,
    BaseSchema,
    type MethodsOnly,
} from './baseService';

const ServiceSchema = Schema.Struct({
    ...BaseSchema.fields,
    name: Schema.String.pipe(Schema.nonEmptyString()),
    address: Schema.String,
    store_type: Schema.String.pipe(Schema.nonEmptyString()),
    store_category: Schema.String.pipe(Schema.nonEmptyString())
});

type ServiceSchemaType = typeof ServiceSchema.Type;
type ServiceSchemaEncoded = typeof ServiceSchema.Encoded

class Model extends BaseModel<ServiceSchemaType, ServiceSchemaEncoded> {
    tableName = () => "stores";
    schema = () => ServiceSchema
}

class Service extends Context.Tag('macropyre/lib/service/store/Service')<
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
            })
        );
    }
}

export const Store = { Service, ServiceSchema };

export type { ServiceSchemaType };
