import { ClaimingSolution } from "./claimingsolution";

// Using solutionPV, the system seemed unable to determine that
// the system was calculating a solution, and left displayed items 
// that should be hidden. 
// Adding and using the computationComplete field
// resolved that issue
export class SolutionSet {
    solutionPV:number
    solutionsArray: ClaimingSolution[]
    computationComplete: boolean
}

