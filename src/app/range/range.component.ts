import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core'
import { CalculationScenario } from '../data model classes/calculationscenario'
import { MonthYearDate } from '../data model classes/monthyearDate'
import { Person } from '../data model classes/person'
import { Range } from '../data model classes/range'
import { ClaimDates } from '../data model classes/claimDates'
import { SolutionSet } from '../data model classes/solutionset'
import { SolutionSetService } from '../solutionset.service'
import { BirthdayService } from '../birthday.service'

/* 
This component provides a means of graphically displaying the quality of
any possible claiming date (or, for a couple, combination of claiming dates).
The "quality" measured is the percentage of the maximum expected PV calculated.
As users interact with the chart, they see immediately that percentage for each
claiming strategy, and they can select a specific strategy for further information. 
 */

// convenience constants to avoid references to a different class
const NO_CUT = Range.NO_CUT
const CUT = Range.CUT
const today:MonthYearDate = new MonthYearDate()

@Component({
  selector: 'app-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.css']
})

export class RangeComponent implements OnInit, AfterViewInit {
  canvasWidth: number;
  canvasHeight: number;
  currentCondition: number;

  @ViewChild('canvas0') canvasRef: ElementRef;

  @Input() scenario: CalculationScenario
  @Input() recommendedSolutionSet: SolutionSet
  @Input() personA: Person
  @Input() personB: Person
  @Input() homeSetCustomDates: Function

  // for display of quality of options
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D

  // for view-switch enhancement
  showCut: boolean = true;
  showCutButton: HTMLInputElement;
  showNoCutButton: HTMLInputElement;

  updating: boolean = false; // true if user has pointer over the graph
  
  // items relating to the selected option (clicked by user)
  selectedRow: number = -1;
  selectedColumn: number = -1;
  selectedPercentString: string = ""; // string with percent of maximum PV at selected option
  selectedClaimDatesString: string; // string with claim dates for no-cut condition at selected option
  selectedClaimDatesStringCut: string; // string with claim dates for cut condition at selected option

  // items relating to the option under the pointer (as user hovers)
  previousPointerRow: number = -1; 
  previousPointerColumn: number = -1;
  pointerPercentString: string = "";
  pointerClaimDatesStringNoCut: string;
  pointerClaimDatesStringCut: string;

  // items relating to minimum and maximum
  minimumPv: number;
  minimumPvCut: number;
  minimumPvString: string; // string with minimum PV for no-cut condition
  minimumPvStringCut: string; // string with minimum PV for cut condition
  minimumPvClaimDatesString: string; // string with claim dates for no-cut condition at minimum PV
  minimumPvClaimDatesStringCut: string; // string with claim dates for cut condition at minimum PV

  maximumPv: number;
  maximumPvCut: number;
  maximumPvString: string; // string with maximum PV for no-cut condition
  maximumPvStringCut: string; // string with maximum PV for cut condition
  maximumPvClaimDatesString: string; // string with claim dates for no-cut condition at maximum PV
  maximumPvClaimDatesStringCut: string; // string with claim dates for cut condition at maximum PV


  range: Range; // the object holding data for the range of options
  startDateA: MonthYearDate; // date at which personA first receives benefits, to be used when converting row to date
  startDateB: MonthYearDate; // date at which personB first receives benefits, to be used when converting column to date
  
  // - - - - - - graph parameters - - - - - -

  cellWidth: number;
  cellHeight: number;
  minimumCellWidth: number = 6;
  minimumCellHeight: number = 6;
  chartTitle: string;
  // chartTitleNoCut: string;
  // chartTitleCut: string;

  axisWidth: number = 2; // width of x- or y-axis
  halfAxisWidth: number = this.axisWidth / 2;
  axisColor: string = 'gray';
  axisTitleFontSize = 16;
  axisTitleFont: string = this.axisTitleFontSize + 'px sans-serif';
  axisLabelFontSize = 16;
  axisLabelFont: string = this.axisLabelFontSize + 'px sans-serif';
  chartTitleFontSize = 18;
  chartTitleFont: string = 'bold ' + this.chartTitleFontSize + 'px serif';
  chartTitleHeight: number;
  axisTickSize: number = 10;
  axisLabelSpace: number = 5;
  personAaxisTitle: string = "Your Retirement Benefit Begins";
  personBaxisTitle: string = "Your Spouse's Retirement Benefit Begins";
  xAxisTitle: string = this.personAaxisTitle;
  yAxisTitle: string = this.personBaxisTitle;
  xTitleWidth: number;
  xTitleHeight: number;
  yTitleWidth: number;
  yTitleHeight: number;
  labelWidth: number;
  labelHeight: number;

  // margins adjacent to axes
  xMarginWidth: number;
  xMarginHeight: number;
  yMarginWidth: number;
  yMarginHeight: number;

  // base for calculating location of cells
  cellBaseX: number;
  cellBaseY: number;
  rowBaseY: number;

  keySpace: number; // between bottom of chart title and top of key
  keyBorderWidth: number = 2; // width of border around color key for display
  keyBorderColor: string = '#808080';
  keyLabelFontHeight: number = 16;
  keyLabelFont: string = this.keyLabelFontHeight + 'px sans-serif';
  keyCellCount: number;
  keyCellWidth: number = 40;
  keyCellHeight: number = 30;
  keyCellsWidth: number;
  keyWidth: number;
  keyHeight: number;
  keyTop: number;
  keyLeft: number;

  markWidth: number = 2; // width of line marking selected cell or cell at pointer
  halfMarkWidth: number = this.markWidth/2; // width of line marking selected cell or cell at pointer

  selectedColor = 'black'; // mark of selected cell
  pointerColor = 'rgb(250, 250, 20)'; // yellow, border around cell at pointer location


  //solution variables
    selectedStrategyPV: number
    differenceInPV: number
    differenceInPV_asPercent: number
    solutionSet: SolutionSet = {
      "solutionPV":null,
      "solutionsArray": [],
      "computationComplete": false
    }

  constructor(private solutionSetService:SolutionSetService, private birthdayService:BirthdayService) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    // console.log("range.component.ngAfterViewInit");
    this.initDisplay();
  }

  initDisplay() {
    this.range = this.scenario.range;
    if (!this.range) {
      console.log("this.scenario.range is undefined or null.");
    } else {

      this.startDateA = this.range.firstDateA;
      this.startDateB = this.range.firstDateB;
      this.selectedPercentString = "";
      this.selectedRow = -1;
      this.selectedColumn = -1;

      this.chartTitle = "% of Maximum PV";
      if (this.scenario.benefitCutAssumption === false) {
        this.currentCondition = NO_CUT;
      } else {
        this.currentCondition = CUT;
      }

      // get elements where information will be displayed
      this.canvas = this.canvasRef.nativeElement;
      this.canvasContext = this.canvas.getContext("2d");


  // for view-switch enhancement
      this.showCutButton = <HTMLInputElement> document.getElementById("showCut");
      this.showNoCutButton = <HTMLInputElement> document.getElementById("showNoCut");
      this.showCutButton.checked = true; // default if user is considering effect of cut
      if (this.scenario.benefitCutAssumption) {
        document.getElementById("showCutForm").style.display = "inline";
      } else {
        document.getElementById("showCutForm").style.display = "none";
      }

      this.setSizes(this.range.rows, this.range.columns);

      this.cellBaseX = this.yMarginWidth + this.axisWidth;
      this.cellBaseY = this.cellHeight * (this.range.rows - 1);
      this.rowBaseY = (this.cellHeight * this.range.rows) - 1;

      this.selectedClaimDatesString = "";
      this.pointerClaimDatesStringNoCut = "";
      this.pointerClaimDatesStringCut = "";

      // get range of possibilities
      this.minimumPv = this.range.pvMinArray[NO_CUT];
      this.minimumPvCut = this.range.pvMinArray[CUT];
      this.maximumPv = this.range.pvMaxArray[NO_CUT];
      this.maximumPvCut = this.range.pvMaxArray[CUT];
      
      this.minimumPvString = Math.round(this.minimumPv).toLocaleString();
      this.minimumPvStringCut = Math.round(this.minimumPvCut).toLocaleString();
      this.maximumPvString = Math.round(this.maximumPv).toLocaleString();
      this.maximumPvStringCut = Math.round(this.maximumPvCut).toLocaleString();
      
      let claimDates: ClaimDates;
      claimDates = this.range.getMinimumPvClaimDates(NO_CUT);
      this.minimumPvClaimDatesString = claimDates.benefitDatesString();
      claimDates = this.range.getMinimumPvClaimDates(CUT);
      this.minimumPvClaimDatesStringCut = claimDates.benefitDatesString();
      claimDates = this.range.getMaximumPvClaimDates(NO_CUT);
      this.maximumPvClaimDatesString = claimDates.benefitDatesString();
      claimDates = this.range.getMaximumPvClaimDates(CUT);
      this.maximumPvClaimDatesStringCut = claimDates.benefitDatesString();

      this.paintCanvas(this.currentCondition);
    }
  }

  // for view-switch enhancement
  showCutChart(showIt: boolean): void {
    this.showCut = showIt;
    this.showCutButton.checked = showIt;
    this.showNoCutButton.checked = !showIt;
    // console.log("showCut = " + this.showCut);
    if (this.showCut) {
      this.currentCondition = CUT;
    } else {
      this.currentCondition = NO_CUT;
    }
    this.paintCells(this.currentCondition);
    if (this.selectedRow >= 0) {
      // a cell was already selected
      // mark the previously-selected cell, because it was painted over
      this.markCell(this.selectedColor, this.selectedRow, this.selectedColumn);      
      //  update the output for the current condition
      this.showSelectedOption(this.selectedRow, this.selectedColumn);
    }
  }

  updateDisplay(event: Event) {
    this.initDisplay();
  }

  setSizes(rows: number, cols: number): void {
    // need to call this whenever change in rows or columns
    // i.e., different number of possible claim date combinations 

    let maxCells = this.range.rows;
    if (maxCells < this.range.columns) {
      maxCells = this.range.columns;
    }

    this.setKeySize();

    let maximumCanvasDimension = 500;
    this.cellWidth = Math.floor(Math.max(maximumCanvasDimension/maxCells, this.minimumCellWidth));
    this.cellHeight = Math.floor(Math.max(this.cellWidth, this.minimumCellHeight));

    if (rows === 1) {
      // single person
      if (this.cellHeight < 20) {
        // increase height for better visibility of single-row (one-person) display
        this.cellHeight = 20;
      }
    }
    //If personA is already 70, we're only iterating one person (only one axis on graph), but that person is personB
    if (this.birthdayService.findAgeOnDate(this.personA, today) >= 70){
      this.xAxisTitle = this.personBaxisTitle
    }

    // Calculate chart element dimensions to fit actual axis contents
    let context:CanvasRenderingContext2D = this.canvasContext;
    context.font = this.axisTitleFont;
    this.xTitleWidth = context.measureText(this.xAxisTitle).width;
    this.xTitleHeight = this.axisTitleFontSize * 1.5;
    this.yTitleWidth = context.measureText(this.yAxisTitle).width;      
    this.yTitleHeight = this.axisTitleFontSize * 1.5;
    this.chartTitleHeight = this.chartTitleFontSize * 2;
    this.keySpace = this.chartTitleFontSize;
    context.font = this.axisLabelFont;
    this.labelWidth = context.measureText("2020").width;
    this.labelHeight = this.axisLabelFontSize * 1.5;

    let cellsWidth = (this.range.columns * this.cellWidth); // width of all cells
    this.xMarginWidth = Math.max(cellsWidth, this.xTitleWidth, this.yTitleWidth, this.keyWidth);
    this.xMarginWidth = Math.floor(this.xMarginWidth + 1);

    this.xMarginHeight = Math.floor(this.axisLabelSpace + this.labelHeight + 
      this.xTitleHeight + this.chartTitleHeight + this.keySpace + 1);
    if (rows > 0) {
      // this is a couple
      this.xMarginHeight += Math.floor(this.yTitleHeight + 1);
    }

    if (rows === 1) {
      this.yMarginWidth = 0;
    } else {
      this.yMarginWidth = Math.floor(this.labelWidth + this.axisLabelSpace + 1);
    }
    this.yMarginHeight = Math.floor(this.range.rows * this.cellHeight + 1);

    this.canvasWidth = this.yMarginWidth + this.axisWidth + this.xMarginWidth;
    this.canvasHeight = this.xMarginHeight + this.axisWidth + this.yMarginHeight + this.keyHeight;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
  }

  // get x, y coordinates of upper left corner of cell at row, col
  getCellUpperLeft(row: number, col: number): number[] {
    // leaving space for border around cells
    let ulX: number = this.cellBaseX + (col * this.cellWidth);
    let ulY: number = this.cellBaseY - (row * this.cellHeight);
    return [ulX, ulY];
  }

  paintCell(condition: number, row: number, col: number) {
    let color: string;
    let upperLeft: number[] = this.getCellUpperLeft(row, col); // ul[0] = x, ul[1] = y
    color = this.range.getColor(condition, row, col);
    this.canvasContext.fillStyle = color;
    this.canvasContext.fillRect(upperLeft[0], upperLeft[1], this.cellWidth, this.cellHeight);
  }

  paintMargins() {
    let context: CanvasRenderingContext2D = this.canvasContext;
    context.strokeStyle = this.axisColor;
    context.lineWidth = this.axisWidth;
    let isCouple: boolean = this.range.rows > 1;
    
    // draw y-axis and x-axis
    let axisLeft: number = this.cellBaseX - this.halfAxisWidth;
    let axisRight: number = this.cellBaseX + (this.range.columns * this.cellWidth);
    let axisBottom: number = this.cellBaseY + this.cellHeight + this.halfAxisWidth;
    let axisTop: number = 0; // works for couple
    if (!isCouple) {
      axisTop = axisBottom;
    }    
    context.beginPath();
    context.moveTo(axisLeft, axisTop);
    context.lineTo(axisLeft, axisBottom);
    context.lineTo(axisRight, axisBottom);
    context.stroke();

    // add x-axis title
    let titleX = axisLeft + (this.xMarginWidth / 2);
    let titleY = axisBottom + this.labelHeight + this.xTitleHeight;
    context.font = this.axisTitleFont;
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.fillText(this.xAxisTitle, titleX, titleY);

    if (isCouple) {
      // add y-axis title
      titleY += this.yTitleHeight;
      titleX = axisLeft;
      context.font = this.axisTitleFont;
      context.fillStyle = 'black';
      context.textAlign = 'center';
      context.textAlign = 'left';
      context.fillText(this.yAxisTitle, titleX, titleY);
      // draw arrow towards yMargin
      context.beginPath();
      let fontSize = this.axisTitleFontSize;
      let arrowheadBottom = axisBottom + fontSize;
      context.moveTo(titleX - 5, titleY - (fontSize / 2)); 
      let turnX: number = titleX - this.yMarginWidth / 2
      context.lineTo(turnX, titleY - fontSize/2);
      context.lineTo(turnX, axisBottom);
      context.lineTo(turnX - fontSize/2, arrowheadBottom);
      context.lineTo(turnX + fontSize/2, arrowheadBottom);
      context.lineTo(turnX, axisBottom);
      context.stroke();
    }

    // add chart title
    context.font = this.chartTitleFont;
    context.fillStyle = 'black';
    context.textAlign = 'center';
    titleY += this.chartTitleHeight;
    titleX = this.canvasWidth / 2;
    context.fillText(this.chartTitle, titleX, titleY);

    // add key
    this.drawKey(this.currentCondition, titleX - (this.keyWidth / 2), titleY + this.chartTitleFontSize);

    // add x-axis tick marks and year labels
    let tickTop: number = axisBottom + this.halfAxisWidth;
    let tickBottom: number = tickTop + this.axisTickSize;
    let tickX: number = axisLeft;
    let nextX: number;

    let labelX: number;
    let labelY: number = tickTop + this.labelHeight;
    context.font = this.axisLabelFont;
    context.fillStyle = 'black';
    context.textAlign = 'center';
    
    let year = this.range.firstYearA;
    for (let i = 0; i < this.range.yearMarksA.length; i++) {
      context.beginPath();
      context.moveTo(tickX, tickTop);
      context.lineTo(tickX, tickBottom);
      context.stroke();
      if (i < this.range.yearMarksA.length - 1) {
        // draw label for this range
        nextX = this.cellBaseX + (this.range.yearMarksA[i + 1] * this.cellWidth)
        if ((nextX - tickX) > this.labelWidth) {
          labelX = (nextX + tickX) / 2;
          context.fillText(year.toString(), labelX, labelY);
        }
        year++;
        tickX = nextX;
      }
    }

    if (isCouple) {
      // add y-axis tick marks and year labels
      year = this.range.firstYearB;
      context.textAlign = 'right';
      let tickRight: number = axisLeft - this.halfAxisWidth;
      let tickLeft: number = tickRight - this.axisTickSize;
      let tickY: number = axisBottom;
      let nextY: number;
      let labelX: number = tickRight - this.axisLabelSpace;
      for (let i = 0; i < this.range.yearMarksB.length; i++) {
        context.beginPath();
        context.moveTo(tickLeft, tickY);
        context.lineTo(tickRight, tickY);
        context.stroke();
        if (i < this.range.yearMarksB.length - 1) {
          // draw label for this range
          nextY = this.rowBaseY - ((this.range.yearMarksB[i + 1]) * this.cellWidth)
          if ((tickY - nextY) > this.labelHeight) {
            labelY = (nextY + tickY) / 2 + this.axisLabelFontSize/2;
            context.fillText(year.toString(), labelX, labelY);
          }
          year++;
          tickY = nextY;
        }
      }
    }
  }

  paintCells(condition: number): void {
    for (let row = 0; row < this.range.rows; row++) {
      for (let col = 0; col < this.range.columns; col++) {
        this.paintCell(condition, row, col);
      }
    }
  }

  paintCanvas(condition: number) {
    this.canvasContext.strokeStyle = this.axisColor;
    this.canvasContext.lineWidth = this.axisWidth;

    this.paintMargins();
    this.paintCells(condition);

  }

  clearData() {
    this.pointerClaimDatesStringNoCut = '';
    this.pointerClaimDatesStringCut = '';

    this.pointerPercentString = '';
  }

 fractionToPercent(num: number, places: number) {
    return (num * 100).toFixed(places);
  }

  showSelectedOption(row: number, col: number, ) {
    let selectedClaimDates: ClaimDates = this.range.claimDatesArrays[this.currentCondition][row][col];
    this.selectedClaimDatesString = selectedClaimDates.benefitDatesString();
    //have to set retirementBenefitDate, spousal date, begin/endSuspensionDates on person objects if going to use functions from solutionset.service to generate solution sets
      //Note that here we're pulling those dates from a ClaimDates object, which saved them from the person object(s) during the maximize PV function.
      //And now we're setting those fields on the person objects back to those saved dates, so we can use solutionset.service's functions
      this.personA.retirementBenefitDate = new MonthYearDate(selectedClaimDates.personARetirementDate)
      this.personA.beginSuspensionDate = new MonthYearDate(selectedClaimDates.personABeginSuspensionDate)
      this.personA.endSuspensionDate = new MonthYearDate(selectedClaimDates.personAEndSuspensionDate)
      this.personA.spousalBenefitDate = new MonthYearDate(selectedClaimDates.personASpousalDate)
      this.personB.retirementBenefitDate = new MonthYearDate(selectedClaimDates.personBRetirementDate)
      this.personB.beginSuspensionDate = new MonthYearDate(selectedClaimDates.personBBeginSuspensionDate)
      this.personB.endSuspensionDate = new MonthYearDate(selectedClaimDates.personBEndSuspensionDate)
      this.personB.spousalBenefitDate = new MonthYearDate(selectedClaimDates.personBSpousalDate)

      if (this.scenario.maritalStatus == "single"){
          this.solutionSet = this.solutionSetService.generateSingleSolutionSet(this.scenario, this.personA, this.range.pvArrays[this.currentCondition][row][col])
      }
      else if (this.scenario.maritalStatus == "married"){
        //If one spouse is already age 70, the ClaimDates object has that spouse's dates as personB dates ("because they're fixedSpouse from maximize function"), regardless of which person it was.
        //So we have to swap them if it was actually personA who was over 70.
          if (this.birthdayService.findAgeOnDate(this.personA, today) >= 70 ){
            this.personB.retirementBenefitDate = new MonthYearDate(selectedClaimDates.personARetirementDate)
            this.personB.beginSuspensionDate = new MonthYearDate(selectedClaimDates.personABeginSuspensionDate)
            this.personB.endSuspensionDate = new MonthYearDate(selectedClaimDates.personAEndSuspensionDate)
            this.personB.spousalBenefitDate = new MonthYearDate(selectedClaimDates.personASpousalDate)
            this.personA.retirementBenefitDate = new MonthYearDate(selectedClaimDates.personBRetirementDate)
            this.personA.beginSuspensionDate = new MonthYearDate(selectedClaimDates.personBBeginSuspensionDate)
            this.personA.endSuspensionDate = new MonthYearDate(selectedClaimDates.personBEndSuspensionDate)
            this.personA.spousalBenefitDate = new MonthYearDate(selectedClaimDates.personBSpousalDate)
          }
          this.solutionSet = this.solutionSetService.generateCoupleSolutionSet(this.scenario, this.personA, this.personB, this.range.pvArrays[this.currentCondition][row][col])
      }
      else if (this.scenario.maritalStatus == "divorced"){
          this.solutionSet = this.solutionSetService.generateCoupleSolutionSet(this.scenario, this.personA, this.personB, this.range.pvArrays[this.currentCondition][row][col])
      }
    
    let pvMax = this.range.pvMaxArray[this.currentCondition]
    this.selectedStrategyPV = this.range.pvArrays[this.currentCondition][row][col]
    this.differenceInPV = pvMax - this.selectedStrategyPV
    this.differenceInPV_asPercent = (1 - (this.selectedStrategyPV / pvMax)) * 100
  }

  getRowColumn(e: MouseEvent) { // returnValue[0] = x, returnValue[1] = y
    let xy = this.getXY(e);
    let x = xy[0];
    let y = xy[1];
    let row = Math.floor((this.rowBaseY - y) / this.cellHeight);
    let column = Math.floor((x - this.cellBaseX) / this.cellWidth);
    // row & column should not be out of range, but just in case:
    if (row >= this.range.rows) {
      row = this.range.rows - 1
    }
    if (column >= this.range.columns) {
      column = this.range.columns - 1
    } 
    return [row, column];
  }

  getXY(e: MouseEvent) {
    // Find the position of the mouse.
    let x = e.pageX - this.canvas.offsetLeft;
    let y = e.pageY - this.canvas.offsetTop;
    return [x, y];
  }

  unmarkCell(markedRow: number, markedCol: number) {
    if (markedRow >= 0 && markedCol >= 0) {
      this.paintCell(this.currentCondition, markedRow, markedCol);
    }
  }

  markCell(markColor: string, markRow: number, markColumn: number) {
    if (markRow >= 0 && markColumn >= 0) { // to avoid marking the initial selected cell at (-1, -1)
      let ul: number[] = this.getCellUpperLeft(markRow, markColumn);
      this.canvasContext.lineWidth = this.markWidth;
      this.canvasContext.strokeStyle = markColor;
      // Marking cell at the pointer with a rectangle
      this.canvasContext.strokeRect(ul[0] + this.halfMarkWidth, ul[1] + this.halfMarkWidth, 
      this.cellWidth - this.markWidth, this.cellHeight - this.markWidth);
    }
  }

  selectCell(event: MouseEvent) {
    let rowColumn = this.getRowColumn(event);
    // save location of newly-selected cell
    let selectRow = rowColumn[0];
    let selectColumn = rowColumn[1];
    if ((selectRow >= 0) && (selectColumn >= 0)) {
      // unmark the previously-selected cell
      this.unmarkCell(this.selectedRow, this.selectedColumn);
      // mark the newly-selected cell
      this.markCell(this.selectedColor, selectRow, selectColumn);
      // save selected cell row & col for other operations 
      this.selectedRow = selectRow;
      this.selectedColumn = selectColumn;
      this.showSelectedOption(this.selectedRow, this.selectedColumn);
    }
}

  startUpdating(e) {
    // Start updating displayed values, per location of pointer
    this.updating = true;
  }

  // unmark the pointer location
  unmarkPointer() {
    this.unmarkCell(this.previousPointerRow, this.previousPointerColumn);
    if ((this.previousPointerRow === this.selectedRow) && (this.previousPointerColumn === this.selectedColumn)) {
      // if the most recent pointer location was the selected cell, re-mark it
      this.markCell(this.selectedColor, this.selectedRow, this.selectedColumn);
    }
  }

  stopUpdating() {
    this.updating = false;
    this.unmarkPointer();
    this.clearData();
  }

update(e: MouseEvent) {
    let rowColumn = this.getRowColumn(e);
    let row = rowColumn[0];
    let column = rowColumn[1];

    this.unmarkPointer();
    this.canvas.title = ""; // blank tooltip when outside of graph

    if ((row >= 0) && (column >= 0)) { // pointer is within the graph area (not the margin)
      // mark the pointer location, even if it is the selected cell
      this.markCell(this.pointerColor, row, column)
      this.previousPointerRow = row;
      this.previousPointerColumn = column;
      let claimsString = this.range.rowColumnDatesString(row, column);
      this.pointerPercentString = this.fractionToPercent(this.range.getPvFraction(this.currentCondition, row, column), 1) + "% of maximum, " + claimsString;
      // if (this.currentCondition > NO_CUT) {
      if (this.showCut) {
          let expectedPvPercentNoCut: string = this.fractionToPercent(this.range.getPvFraction(NO_CUT, row, column), 1);
        this.pointerPercentString += " (" + expectedPvPercentNoCut + "% if no cut)";
      }
      this.canvas.title = this.pointerPercentString; // show tooltip with % of maximum
    } else {
      this.canvas.title = ""; // blank tooltip when outside of graph
    }
  }

  setKeySize() {
    // determine location and size of components of the key

    this.keyCellsWidth = (this.keyCellWidth * this.range.fractionLabels.length);
    this.keyWidth = this.keyCellsWidth + this.keyBorderWidth * 2;
    this.keyHeight = this.keyCellHeight + (this.keyBorderWidth * 2) + this.keyLabelFontHeight * 1.5;
    
  }

  drawKey(condition: number, keyLeft: number, keyTop: number): void {
    let context: CanvasRenderingContext2D = this.canvasContext;
    let borderWidth = this.keyBorderWidth;
    let halfWidth = borderWidth / 2; 

    let cellsLeft = keyLeft + borderWidth;
    let cellsTop = keyTop + this.keyBorderWidth;
    let borderLeft = cellsLeft - halfWidth;
    let borderTop = cellsTop - halfWidth;
    context.strokeStyle = this.keyBorderColor;
    context.lineWidth = this.keyBorderWidth;
    context.strokeRect(borderLeft, borderTop, this.keyCellsWidth + borderWidth, 
      this.keyCellHeight + borderWidth);
    
    // paint key cells and key cell labels
    let keyCellCount = this.range.fractionLabels.length;
    let cellX = cellsLeft;
    let labelY = cellsTop + this.keyCellHeight + (this.keyBorderWidth * 2) + this.keyLabelFontHeight;
    context.fillStyle = 'black';
    context.textAlign ='left';
    context.font = this.keyLabelFont;
    context.textAlign ='center';
    // which key element is being painted - higher array index for lower % of maximum
    let fractionNumber = keyCellCount - 1; 
    for (let i = 0; i < keyCellCount; i++) {
      context.fillStyle = this.range.colorByNumber[condition][fractionNumber];
      context.fillRect(cellX, cellsTop, this.keyCellWidth, this.keyCellHeight);
      context.fillStyle = 'black';
      context.fillText(this.range.fractionLabels[fractionNumber], cellX, labelY);
      cellX += this.keyCellWidth;
      fractionNumber--;
    }
  }

}
