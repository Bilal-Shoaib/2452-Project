import { PGlite } from '@electric-sql/pglite';

const pgLiteDb = await PGlite.create('idb://2452-project');


export default function db() {
    return pgLiteDb;
}