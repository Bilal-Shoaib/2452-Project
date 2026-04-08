import * as fs from "fs/promises";
import MatrixEntry from "./train-markov-model";

/**
 * Persists an adjacency matrix to a CSV file.
 * Format:
 * - No headers
 * - N rows, N columns
 * - Each cell = "numerator/denominator"
 * - No spaces
 * - No trailing newline
 */
export async function persistMarkovMatrix(fileName: string, matrix: MatrixEntry[][]) {
    const dimension = matrix.length;

    let csv = "";

    for (let i = 0; i < dimension; i++) {
        let row = "";

        for (let j = 0; j < dimension; j++) {
            const entry = matrix[i][j];
            row += `${entry.numerator}/${entry.denominator}`;

            if (j < dimension - 1) {
                row += ",";
            }
        }

        csv += row;

        if (i < dimension - 1) {
            csv += "\n";
        }
    }

    // Overwrite file
    await fs.writeFile(fileName, csv, "utf-8");
}