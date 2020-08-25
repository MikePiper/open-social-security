import { MonthYearDate } from './monthyearDate';
import { ClaimStrategy } from './claimStrategy';

/* 
This code is contributed to the project by Brian Courts, copyright 2020, released under MIT license.
https://github.com/brian-courts

This class provides fields and methods for the storage and manipulation
of data related to the range of possible options of Social Security
claim dates, and the expected PV (present value) of each of those options.
It can store data for two possible scenarios at the same time:
 - with no cut in future benefits and
 - with a cut in future benefits
*/ 

export class Range {
    firstDateA: MonthYearDate; // first date for person A
    lastDateA: MonthYearDate; // last date for person A
    rows: number; // number of rows in this range
    firstValueA: number;
    firstYearA: number; // year of first date for person A
    firstMonthA: number; // month of first date for person A
    yearMarksA: number[] = new Array(); // column number of start of each year, to mark x-axis

    firstDateB: MonthYearDate; // first date for person B
    lastDateB: MonthYearDate; // last date for person B
    columns: number; // number of columnss in this range
    firstValueB: number;
    firstYearB: number; // year of first date for person B
    firstMonthB: number; // month of first date for person B
    yearMarksB: number[] = new Array(); // column number of start of each year, to mark y-axis

    // identifiers (and array indices) for the various conditions
    static NO_CUT = 0;
    static CUT = 1;

    static conditionNames = ["NO_CUT", "CUT"];

    // one array (size rows x cols) in these arrays for conditions NO_CUT and CUT
        //That is, they're each length=2 because there's the outermost array has two values (each of which is an array of arrays) -- one for NO_CUT and one for CUT
    pvArrays = new Array(2);
    colorArrays = new Array(2);
    claimStrategiesArrays: ClaimStrategy[][][] = new Array(2)

    // one value in these arrays for each condition
    pvMaxArray = [0, 0]; // pvMaxArray[NO_CUT] is the maximum PV in the NO_CUT condition
    pvPercentFactorArray = [0, 0]; // (100 / pvMax) for each case - multiply case's PV times this to get percent of pvMax 
    pvMaxRowArray = [0, 0]; // pvMaxRowArray[NO_CUT] is the row where the maximum PV in the NO_CUT condition is found
    pvMaxColArray = [0, 0];
    pvMinArray = [1000000, 1000000]; // pvMinArray[NO_CUT] is the minimum PV in the NO_CUT condition
    pvMinRowArray = [0, 0]; // pvMinRowArray[NO_CUT] is the row where the minimum PV in the NO_CUT condition is found
    pvMinColArray = [0, 0];

    fractionBreak: number[] = [0.99, 0.95, 0.9, -1000000]; // values of pvFraction minima for different display colors
    fractionLabels: string[] = ["100", "99", "95", "90", "0"];

    maxColor: string = '#b3ffb3'; // light green, color of cell with maximum PV
    colorByNumber: string[][] =
    [ 
    // NO_CUT and CUT are the same here, so users don't need to learn two sets of colors
    // these colors are from https://jfly.uni-koeln.de/color/, 
    // intended to avoid confusion by colorblind individuals
    [this.maxColor, '#009e73', '#56b4e9', '#e69f00', '#cc79a7', "#fff"],
    [this.maxColor, '#009e73', '#56b4e9', '#e69f00', '#cc79a7', "#fff"]
    ]
/*  
    alternative color schemes

    // from https://www.schemecolor.com/five-color-rainbow-color-scheme.php (except maxColor)    
    [this.maxColor, '#ac92eb', '#4fc1e8', '#ffce54', '#ed5564'],
    [this.maxColor, '#ac92eb', '#4fc1e8', '#ffce54', '#ed5564']

    // could use these from https://www.schemecolor.com/she-shows-magic.php (except maxColor)
    [this.maxColor, '#A5187A', '#FE55A1', '#F88F12', '#FFCD18'],
    [this.maxColor, '#A5187A', '#FE55A1', '#F88F12', '#FFCD18']

    // tried shades of blue for NO_CUT and shades of red for CUT, 
    // but the shades were hard to distinguish
    // for NO_CUT - shades of blue (except maxColor)
    [this.maxColor, '#1818ff', '#5050ff', '#6666ff', '#b3b3ff'],
    // for CUT - shades of red (except maxColor)
    [this.maxColor, '#ff1818', '#ff5050', '#ff6666', '#ffb3b3']
 */    

    topBreak = this.fractionBreak[0];
    topCount: number[] = [0, 0];  // how many NO_CUT & CUT pv's are in the top percentage

    constructor(firstDateA: MonthYearDate, lastDateA: MonthYearDate, firstDateB?: MonthYearDate, lastDateB?: MonthYearDate) {
        this.firstDateA = firstDateA;
        this.lastDateA = lastDateA;
        this.firstValueA = firstDateA.valueOf();
        this.firstYearA = firstDateA.getFullYear();
        this.firstMonthA = firstDateA.getMonth();

        // personA does columns
        this.columns = lastDateA.valueOf() - this.firstValueA + 1;

        // generate location of marks at year transitions
        this.yearMarksA[0] = 0;
        let nextMark:number = 12 - firstDateA.getMonth();
        while (nextMark < this.columns) {
            this.yearMarksA.push(nextMark);
            nextMark += 12;
        }
        this.yearMarksA.push(this.columns);
        
        if (firstDateB && lastDateB) { // this is for a couple 
            this.firstDateB = firstDateB;
            this.lastDateB = lastDateB;
            this.firstValueB = firstDateB.valueOf();
            this.firstYearB = firstDateB.getFullYear();
            this.firstMonthB = firstDateB.getMonth();
            this.rows = lastDateB.valueOf() - this.firstValueB + 1;
            // generate location of marks at year transitions
            this.yearMarksB[0] = 0;
            let nextMark:number = 12 - firstDateB.getMonth();
            while (nextMark < this.rows) {
                this.yearMarksB.push(nextMark);
                nextMark += 12;
            }
            this.yearMarksB.push(this.rows);        
        } else { // this is for one person
            this.rows = 1;
        }
        this.initializeArrays(this.rows, this.columns);
    }

    addedMonthsString(month: number, year: number, addMonths: number): string {
        month += addMonths;
        while (month > 11) {
            year++;
            month -= 12;
        }
        return (month + 1) + '/' + year;
    }

    columnDateString(column: number): string {
        return this.addedMonthsString(this.firstMonthA, this.firstYearA, column);
    }

    rowDateString(row: number): string {
        return this.addedMonthsString(this.firstMonthB, this.firstYearB, row);
    }

    rowColumnDatesString(row: number, col: number): string {
        if (this.rows > 1) {
            return "You " + this.columnDateString(col) + ", Spouse " + this.rowDateString(row);
        } else {
            return this.columnDateString(col);
        }
    }

    initializeArrays(rows: number, cols: number) {
        // we wouldn't need two-dimensional arrays for one person, but we'll make them, 
        // so we can use the same code for both single and married cases 
        let colorArray: string[][];
        let pvArray: number[][];
        let claimStrategiesArray: ClaimStrategy[][];

        for (let condition = Range.NO_CUT; condition <= Range.CUT; condition++) {
            colorArray = new Array(rows);
            this.colorArrays[condition] = colorArray;
            pvArray = new Array(rows);
            this.pvArrays[condition] = pvArray;
            claimStrategiesArray = new Array(rows);
            this.claimStrategiesArrays[condition] = claimStrategiesArray;
            for (let row = 0; row < rows; row++) {
                colorArray[row] = new Array(cols);
                pvArray[row] = new Array(cols);
                claimStrategiesArray[row] = new Array(cols);
                // colorArray, claimStrategiesArray will be calculated/assigned
                // but we need to initialize the pvArrays values, 
                // in case some entries are not provided, and for initial comparisons
                for (let col = 0; col < cols; col++) {
                    pvArray[row][col] = -1;
                }
            }
        }
    }

    //store the PV data for the given date combination at corresponding row & col, and save new max/min info if appropriate
    processPVs(claimStrategy: ClaimStrategy, personAfixed:boolean) {
        let pv: number;
        let row: number;
        let col: number;

        for (let condition = Range.NO_CUT; condition <= Range.CUT; condition++) {
            if (condition === Range.NO_CUT) {
                pv = claimStrategy.pvNoCut;
            } else {
                pv = claimStrategy.PV;
            }

            if (personAfixed === false){
                col = this.getColAtDate(claimStrategy.indexDateA());
            }
            else {//if personA is fixed (i.e., over age 70), we actually want the index of personB, because personB's date will be the columns in the (single-row) range output
                col = this.getColAtDate(claimStrategy.indexDateB());
            }

            if (this.rows === 1) {
                row = 0;
            } else {
                row = this.getRowAtDate(claimStrategy.indexDateB());
            }

            if (col >= 0 && row >= 0){//Check that row and col are not negative.
                //They'd be negative in cases in which the PV calc is running a calculation that shouldn't be included in the output range (e.g., personB is age 62, but they have no PIA of their own and can't file for spousal until age 64)
                //store the pv and corresponding ClaimStrategy
                this.pvArrays[condition][row][col] = pv;
                this.claimStrategiesArrays[condition][row][col] = claimStrategy;

                //Store information about maximum or minimum PV (and corresponding row/column) if it's a new max or minimum
                if (pv > this.pvMaxArray[condition]) {
                    this.pvMaxArray[condition] = pv;
                    this.pvMaxRowArray[condition] = row;
                    this.pvMaxColArray[condition] = col;
                }
                if (pv < this.pvMinArray[condition]) {
                    this.pvMinArray[condition] = pv;
                    this.pvMinRowArray[condition] = row;
                    this.pvMinColArray[condition] = col;
                }
            }
        }
    }

    getMinimumPvClaimStrategy(condition: number): ClaimStrategy {
        let row = this.pvMinRowArray[condition];
        let column = this.pvMinColArray[condition];
        return this.claimStrategiesArrays[condition][row][column]; 
    }

    getMaximumPvClaimStrategy(condition: number): ClaimStrategy {
        let row = this.pvMaxRowArray[condition];
        let column = this.pvMaxColArray[condition];
        return this.claimStrategiesArrays[condition][row][column]; 
    }

    getColAtDate(dateA: MonthYearDate): number {
        return dateA.valueOf() - this.firstValueA;
    }

    getRowAtDate(dateB: MonthYearDate): number {
        return dateB.valueOf() - this.firstValueB;
    }

    inRangeRowCol(row: number, col: number): boolean {
        return (row >= 0) && (col >= 0)
            && (row <= this.rows) && (col < this.columns);
    }

    inRangeDates(dateA: MonthYearDate, dateB: MonthYearDate): boolean {
        return this.inRangeRowCol(this.getColAtDate(dateA), this.getRowAtDate(dateB));
    }

    initFracsAndColors(): void {

        let pvFraction: number;

        let pvArray: number[][];
        let colorArray: string[][];
        let pvMax: number;
        let colorNumber: number;

        for (let condition = Range.NO_CUT; condition <= Range.CUT; condition++) {
            pvArray = this.pvArrays[condition];
            colorArray = this.colorArrays[condition];
            pvMax = this.pvMaxArray[condition];
            this.pvPercentFactorArray[condition] = 100 / pvMax;

            // For pv at each (row,col), determine fraction of maximum pv and corresponding color number
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.columns; col++) {
                    pvFraction = pvArray[row][col] / pvMax;

                    if (this.claimStrategiesArrays[condition][row][col]){
                        // determine which segment of the range for this pvFraction
                        for (let i = 0; i < this.fractionBreak.length; i++) {
                            if (pvFraction > this.fractionBreak[i]) {
                                colorNumber = i + 1;
                                if (i == 0) {
                                    this.topCount[condition]++;
                                }
                                break;
                            }
                        }
                    }
                    else {//i.e., if there's no claimStrategy there, because the cell doesn't correspond to a valid ClaimStrategy
                        colorNumber = 5 //set color to grey
                    }
                    colorArray[row][col] = this.colorByNumber[condition][colorNumber];
                }
            }
            // set color at the pvMax row/col for the current condition to maxColor
            colorArray[this.pvMaxRowArray[condition]][this.pvMaxColArray[condition]] = this.maxColor;
        }
    }

    getColor(condition: number, row: number, col: number): string {
        return this.colorArrays[condition][row][col];
    }
      
    getPv(condition: number, row: number, col: number): number {
        return this.pvArrays[condition][row][col];
    }
      
    // returns string showing percent of maxPv at given location
    getPvPercentString(condition: number, row: number, col: number): string {
        return "" + (this.pvArrays[condition][row][col] * this.pvPercentFactorArray[condition]).toFixed(1);
    }
      

}
