import { readCSV } from "./csv-reader";
import MatrixEntry from "./matrix-entry";

export async function trainMarkovModel(fileName: string, dimension: number) {
    const alphabetMapping = mapAlphabets(dimension);
    const adjacencyMatrix = initAdjacencyMatrix(dimension);

    await readCSV(fileName, (tokens: Array<string>) => {
        for (let i = 0; i < tokens.length - 1; i++) {
            const currentToken = tokens[i];
            const nextToken = tokens[i + 1];
            consume(currentToken, nextToken, alphabetMapping, adjacencyMatrix);
        }
    });

    return adjacencyMatrix;

}

function consume(currToken: string, nextToken: string, tokensMap: Array<string>, matrix: Array<Array<MatrixEntry>>) {
    const i = tokensMap.indexOf(currToken);
    const j = tokensMap.indexOf(nextToken);

    if ((i !== -1) && (j !== -1)) {
        matrix[i][j].numerator += 1;
        for (let entry of matrix[i]) {
            entry.denominator += 1;
        }

    } else {
        console.log(`Unknown token(s): ${currToken}, ${nextToken}`);
    }
}

function mapAlphabets(length: number): Array<string> {
    const alphabetMappings = new Array<string>();
    const aCharCode = 'a'.charCodeAt(0);
    for (let i = 0; i < length; i++) {
        const alphabet = String.fromCharCode(aCharCode + i);
        alphabetMappings.push(alphabet);
    }
    return alphabetMappings;
}

function initAdjacencyMatrix(dimension: number): Array<Array<MatrixEntry>> {
    const adjacencyMatrix = new Array<Array<MatrixEntry>>();
    for (let i = 0; i < dimension; i++) {
        adjacencyMatrix[i] = new Array<MatrixEntry>;
        for (let j = 0; j < dimension; j++) {
            adjacencyMatrix[i][j] = new MatrixEntry(0,0);
        }
    }
    return adjacencyMatrix;
}