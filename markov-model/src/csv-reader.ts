import * as fs from "fs";
import * as readline from "readline";

export async function readCSV(fileName: string, processCSVRow: (tokens: string[]) => void) {
    const fileStream = fs.createReadStream(fileName);
    const lineReader = readline.createInterface({ 
        input: fileStream, 
        crlfDelay: Infinity
    })

    for await (const line of lineReader) {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
            const tokens = trimmedLine.split(",");
            processCSVRow(tokens);
        }
    }
}