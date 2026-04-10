import { assert } from "../assertions";

import MatrixEntry from "../../markov-model/src/matrix-entry";

/**
 * CSV utility to read a csv file for a matrix of probabilities.
 */

/**
 * Reads csv file for a matrix and returns that matrix.
 * @param fileName - is the name of the file that needs to be read
 * @returns {MatrixEntry[][]} - is the matrix that is read from the given file
 */
export async function parseMatrixCSV(fileName: string): Promise<MatrixEntry[][]> {

    const matrix = new Array<Array<MatrixEntry>>();

    await readCSV(fileName, (tokens: Array<string>) => {
        
        const probabilities = new Array<MatrixEntry>();

        for (let i = 0; i < tokens.length; i++) {
            const currentToken = tokens[i];
            const values = currentToken.split("/");

            assert(values.length == 2, "The encoded matrix must have form <numerator></><denominator>.");

            const numerator = parseInt(values[0], 10);
            let denominator = parseInt(values[1], 10);

            probabilities.push(new MatrixEntry(numerator, denominator));
        }

        matrix.push(probabilities);

    });

    for (const row of matrix) {
        assert(row.length === matrix.length, "The adjacency matrix must be square.");
    }

    return matrix;

}

/**
 * Reads a csv file line by line.
 * @param fileName - is the name of the file that needs to be read
 * @param processCSVRow - is the function responsible for 'consuming' a row of the csv file
 */
async function readCSV(fileName: string, processCSVRow: (tokens: string[]) => void) {
    try {
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`Failed to load CSV file: ${fileName}`);
        }

        const text = await response.text();

        const lines = text.split(/\r?\n/);

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length > 0) {
                const tokens = trimmedLine.split(',');
                processCSVRow(tokens);
            }
        }
        
    } catch (error) {
        console.error('Error reading CSV:', error);
    }
}