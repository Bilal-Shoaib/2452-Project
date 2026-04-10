import { PGlite } from '@electric-sql/pglite';

import ddl from '../../create-tables.sql?raw';

const src = import.meta.env.VITE_DB_URL;

const pgLiteDb = await PGlite.create(src);

//TODO: Find a better way to do this.
//? Perhaps always load the ddl here?
if (src == 'memory://') {
    db().exec(ddl)
}

export default function db() {
    return pgLiteDb;
}