import seedrandom from "seedrandom";

/**
 * Random Number Generator utility to generate random integers within a specified range.
 */

const rng = seedrandom("POS-SYS");

/**
 * Generates and returns a random number within the specified range
 * @param min - is the lower bound for the generation of the random number
 * @param max - is the upper bound for the generation of the random number
 * @returns {number} is the uniformly randomly generated number between min and max
 */
export function randomIntInclusive(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}