import { trainMarkovModel } from "./train-markov-model";
import { persistMarkovMatrix } from "./persist-markov-model-csv";


async function main() {
    const inputFile = "./training.csv";
    const outputFile = "../matrix.csv";
    const dimension = 10;

    try {
        const matrix = await trainMarkovModel(inputFile, dimension);

        if (matrix && matrix.length > 0) {
            await persistMarkovMatrix(outputFile, matrix);
        } else {
            console.log("Training failed: empty matrix returned.");
        }

    } catch (error) {
        console.log("Error during training:", error);
    }
}

main();