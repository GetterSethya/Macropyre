import type { Fragment } from '@effect/sql/Statement';
import { Schema } from 'effect';

export type ListResponse<T> = {
	page: number;
	perPage: number;
	records: ReadonlyArray<T>;
	totalPages: number;
	totalItems: number;
};

export type CreateArgs<T> = {
	item: Omit<T, 'id' | 'created' | 'updated'>;
};

export type UpdateArgs<T> = {
	id: string;
	item: Partial<Omit<T, 'id' | 'created' | 'updated'>>;
};

export type ViewArgs = {
	id: string;
};

export type CommonOptions = {
	sort: string;
	filter: Fragment;
};

export type ListArgs = {
	page: number;
	perPage: number;
	options?: CommonOptions;
};

export type ListAllArgs = {
	options?: CommonOptions;
};

export class ServiceUnknownError extends Schema.TaggedError<ServiceUnknownError>(
	'ServiceUnknownError'
)('ServiceUnknownError', {
	message: Schema.String,
	originalError: Schema.Any
}) {}

export class ServiceNotFoundError extends Schema.TaggedError<ServiceNotFoundError>(
	'ServiceNotFoundError'
)('ServiceNotFoundError', {
	message: Schema.String,
	originalError: Schema.Any
}) {}

export class ServicePayloadError extends Schema.TaggedError<ServicePayloadError>(
	'ServicePayloadError'
)('ServicePayloadError', {
	message: Schema.String,
	originalError: Schema.Any
}) {}
