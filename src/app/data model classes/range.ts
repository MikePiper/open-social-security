import { MonthYearDate } from './monthyearDate';
import { ClaimDates } from './claimDates';
import { ThrowStmt } from '@angular/compiler';

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
    cols: number; // number of columnss in this range
    firstValueB: number;
    firstYearB: number; // year of first date for person B
    firstMonthB: number; // month of first date for person B
    yearMarksB: number[] = new Array(); // column number of start of each year, to mark y-axis

    pvMaxNoCut: number; // maximum pV if future benefits are not cut
    pvMaxCut: number; // maximum pV if future benefits are cut

    // pvNoCutArray: number[][];
    // pvCutArray: number[][];

    // identifiers (and array indices) for the various conditions
    static NO_CUT = 0;
    static CUT = 1;

    static conditionNames = ["NO_CUT", "CUT"];

    // identfiers of HTML elements for the various conditions
    // static IDtags = ['_NO_CUT', '_CUT'];
    
    // one array (size rows x cols) in these arrays for conditions NO_CUT and CUT
    pvArrays = new Array(2);
    pvFracArrays = new Array(2);    // pvFrac is fraction of the maximum PV at each date combination
    colorNumberArrays = new Array(2);
    claimDatesArrays = new Array(2)

    // one value in these arrays for each condition
    pvMaxArray = [0, 0]; // pvMaxArray[NO_CUT] is the maximum PV in the NO_CUT condition
    pvMaxRowArray = [0, 0]; // pvMaxRowArray[NO_CUT] is the row where the maximum PV in the NO_CUT condition is found
    pvMaxColArray = [0, 0];

    fracBreak: number[] = [0.99, 0.95, 0.9, -1000000]; // values of pvFrac minimum limits for different display colors
    fracLabels: string[] = ["100", "99", "95", "90", "0"];
    // fracLabelsStr: string = "100  99  95  90  0";

    maxColor: string = '#b3ffb3'; // light green, color of cell with maximum PV
    colorByNumber: string[][] =
    [ 
    // NO_CUT and CUT are the same, so users don't need to learn two sets of colors
    // these colors are from https://jfly.uni-koeln.de/color/, 
    // intended to avoid confusion by colorblind individuals
    [this.maxColor, '#009e73', '#56b4e9', '#e69f00', '#cc79a7'],
    [this.maxColor, '#009e73', '#56b4e9', '#e69f00', '#cc79a7']
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

    topBreak = this.fracBreak[0];
    topCount: number[] = [0, 0];  // how many NO_CUT & CUT pv's are in the top percentage

    constructor(firstDateA: MonthYearDate, lastDateA: MonthYearDate, firstDateB?: MonthYearDate, lastDateB?: MonthYearDate) {
        this.firstDateA = firstDateA;
        this.lastDateA = lastDateA;
        this.firstValueA = firstDateA.valueOf();
        this.firstYearA = firstDateA.getFullYear();
        this.firstMonthA = firstDateA.getMonth();

        // personA does columns
        this.cols = lastDateA.valueOf() - this.firstValueA + 1;

        // generate location of marks at year transitions
        this.yearMarksA[0] = 0;
        let nextMark:number = 12 - firstDateA.getMonth();
        while (nextMark < this.cols) {
            this.yearMarksA.push(nextMark);
            nextMark += 12;
        }
        this.yearMarksA.push(this.cols);
        
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
        this.initializeArrays(this.rows, this.cols);
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

    rowColumnDatesString(row: number, col: number) {
        if (this.rows > 1) {
            return "You " + this.columnDateString(col) + ", Spouse " + this.rowDateString(row);
        } else {
            return this.columnDateString(col);
        }
    }

    initializeArrays(rows: number, cols: number) {
        // we wouldn't need two-dimensional arrays for one person, but we'll make them, 
        // so we can use the same code for both single and married cases 
        let colorNumberArray: number[][];
        let pvArray: number[][];
        let pvFracArray: number[][];
        let claimDatesArray: ClaimDates[][];

        for (let condition = Range.NO_CUT; condition <= Range.CUT; condition++) {
            colorNumberArray = new Array(rows);
            this.colorNumberArrays[condition] = colorNumberArray;
            pvArray = new Array(rows);
            this.pvArrays[condition] = pvArray;
            pvFracArray = new Array(rows);
            this.pvFracArrays[condition] = pvFracArray;
            claimDatesArray = new Array(rows);
            this.claimDatesArrays[condition] = claimDatesArray;
            for (let row = 0; row < rows; row++) {
                colorNumberArray[row] = new Array(cols);
                pvFracArray[row] = new Array(cols);
                pvArray[row] = new Array(cols);
                claimDatesArray[row] = new Array(cols);
                // colorNumber, pvFrac, claimDatesArray will be calculated/assigned
                // but we need to initialize the pvArrays values, 
                // in case some entries are not provided, and for initial comparisons
                for (let col = 0; col < cols; col++) {
                    pvArray[row][col] = -1;
                }
            }
        }
    }

    // include the PV data at given date combination at their row & col, if appropriate
    processPVs(pvNoCut: number, pvCut: number, claimDates: ClaimDates) {
        let pv: number;
        let row: number;
        let col: number;

        for (let condition = Range.NO_CUT; condition <= Range.CUT; condition++) {
            if (condition === Range.NO_CUT) {
                pv = pvNoCut;
            } else {
                pv = pvCut;
            }

            col = this.getColAtDate(claimDates.indexDateA());
            if (this.rows === 1) {
                row = 0;
            } else {
                row = this.getRowAtDate(claimDates.indexDateB());
            }

            if (pv > this.pvArrays[condition][row][col]) {
                // store the pv and the corresponding claimDates if it is higher than the pv already there
                this.pvArrays[condition][row][col] = pv;
                this.claimDatesArrays[condition][row][col] = claimDates;
                if (pv > this.pvMaxArray[condition]) {
                    this.pvMaxArray[condition] = pv;
                    this.pvMaxRowArray[condition] = row;
                    this.pvMaxColArray[condition] = col;
                }
            }

        }
    }

    logArray(heading: string, array: number[][], decimalPlaces: number): void {
        let line: string;
        let val: number;
        let out: string;
        console.log(heading);
        for (let row = 0; row < this.rows; row++) {
            line = 'r' + row + ', ';
            for (let col = 0; col < this.cols; col++) {
                val = array[row][col];
                line += val.toFixed(decimalPlaces) + ', ';
            }
            console.log(line);
            // per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
            // When formatting large numbers of numbers, it is better to create a 
            // NumberFormat object and use the function provided by its NumberFormat.format property.
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
        }    
    }

    // bcourts debug
    logDetails(): void {
        let pv: number;
        let array: number[][];
        let condition: number;
        let cellCount = (this.rows * this.cols);
        for (condition = Range.NO_CUT; condition <= Range.CUT; condition++) {
            this.logArray(Range.conditionNames[condition] +
                ": pvMax = " + Math.round(this.pvMaxArray[condition]) +
                " at (" + this.pvMaxRowArray[condition] +
                ", " + this.pvMaxColArray[condition] + ")", this.pvArrays[condition], 0);
            console.log("cells in 'topBreak': " + this.topCount[condition] + " / " + cellCount);
            this.logArray("pvFrac", this.pvFracArrays[condition], 4);
            this.logArray("colorNumber", this.colorNumberArrays[condition], 2);
            // log claimDates?
        }
    }

    logSummary(): void {
        let pv: number;
        let array: number[][];
        let cellCount = (this.rows * this.cols);
        let condition: number;
        for (condition = Range.NO_CUT; condition <= Range.CUT; condition++) {
            console.log(Range.conditionNames[condition] +
                ": pvMax = " + Math.floor(this.pvMaxArray[condition]) +
                " at (" + this.pvMaxRowArray[condition] +
                ", " + this.pvMaxColArray[condition] + ")");
            console.log("cells in 'topBreak': " + this.topCount[condition] + " / " + cellCount);
        }
    }

    getColAtDate(dateA: MonthYearDate): number {
        return dateA.valueOf() - this.firstValueA;
    }

    getRowAtDate(dateB: MonthYearDate): number {
        return dateB.valueOf() - this.firstValueB;
    }

    inRangeRowCol(row: number, col: number): boolean {
        return (row >= 0) && (col >= 0)
            && (row <= this.rows) && (col < this.cols);
    }

    inRangeDates(dateA: MonthYearDate, dateB: MonthYearDate): boolean {
        return this.inRangeRowCol(this.getColAtDate(dateA), this.getRowAtDate(dateB));
    }

    initFracsAndColors(): void {

        let pvFrac: number;
        let pvFracNoCut: number;
        let pvFracCut: number;
        let pvFrac2: number;

        let pvArray: number[][];
        let pvFracArray: number[][];
        let colorNumberArray: number[][];
        let pvMax: number;
        let colorNumber: number;
        // let defaultColorNumber: number = this.fracBreak.length + 1;
        // let pvFracDiff: number;

        for (let condition = Range.NO_CUT; condition <= Range.CUT; condition++) {
            pvArray = this.pvArrays[condition];
            pvFracArray = this.pvFracArrays[condition];
            colorNumberArray = this.colorNumberArrays[condition];
            pvMax = this.pvMaxArray[condition];

            // For pv at each (row,col), determine fraction of maximum pv and corresponding color number
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    pvFrac = pvArray[row][col] / pvMax;
                    pvFracArray[row][col] = pvFrac;

                    for (let i = 0; i < this.fracBreak.length; i++) {
                        if (pvFrac > this.fracBreak[i]) {
                            colorNumber = i + 1;
                            if (i == 0) {
                                this.topCount[condition]++;
                            }
                            break;
                        }
                    }
                    colorNumberArray[row][col] = colorNumber;

                }
            }
            // set colorNumber at the pvMax row/col for the current condition to 0
            colorNumberArray[this.pvMaxRowArray[condition]][this.pvMaxColArray[condition]] = 0;
        }
    }

    getColor(condition: number, row: number, col: number): string {
        let colorNumber = this.colorNumberArrays[condition][row][col];
        return this.colorByNumber[condition][colorNumber];
    }
      
    getPv(condition: number, row: number, col: number): number {
        return this.pvArrays[condition][row][col];
    }
      
    getPvFrac(condition: number, row: number, col: number): number {
        return this.pvFracArrays[condition][row][col];
    }
      

}
