import { ClaimingSolution } from "./claimingsolution";
import { ClaimStrategy } from './claimStrategy';

// Using solutionPV, the system seemed unable to determine that
// the system was calculating a solution, and left displayed items 
// that should be hidden. 
// Adding and using the computationComplete field
// resolved that issue
export class SolutionSet {
    claimStrategy:ClaimStrategy
    solutionsArray: ClaimingSolution[]
    computationComplete: boolean
}

