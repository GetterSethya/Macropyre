import { LibsqlClient } from '@effect/sql-libsql';

export const SqlLive = LibsqlClient.layer({
	url: 'file:data.db'
});
