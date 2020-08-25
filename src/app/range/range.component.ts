import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core'
import { CalculationScenario } from '../data model classes/calculationscenario'
import { MonthYearDate } from '../data model classes/monthyearDate'
import { Person } from '../data model classes/person'
import { Range } from '../data model classes/range'
import { ClaimStrategy } from '../data model classes/claimStrategy'
import { SolutionSet } from '../data model classes/solutionset'
import { SolutionSetService } from '../solutionset.service'
import { BirthdayService } from '../birthday.service'
import { PresentValueService } from '../presentvalue.service'

/*
This code is contributed to the project by Brian Courts, copyright 2020, released under MIT license.
https://github.com/brian-courts

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
  @Output() newClaimStrategySelected: EventEmitter<ClaimStrategy> = new EventEmitter<ClaimStrategy>()
  @Output() benefitCutAssumptionSwitch: EventEmitter<boolean> = new EventEmitter<boolean>()


  // for display of quality of options
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D

  // for view-switch
  showCut: boolean = false;
  showCutButton: HTMLInputElement;
  showNoCutButton: HTMLInputElement;

  updating: boolean = false; // true if user has pointer over the graph
  
  // items relating to the selected option (clicked by user)
  selectedRow: number = -1;
  selectedColumn: number = -1;

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

  maximumPv: number;
  maximumPvCut: number;
  maximumPvString: string; // string with maximum PV for no-cut condition
  maximumPvStringCut: string; // string with maximum PV for cut condition


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
  personA_zeroPIAaxisTitle: string = "Your Spousal Benefit Begins"
  personB_zeroPIAaxisTitle: string = "Your Spouse's Spousal Benefit Begins"
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


  // solution variables at selected location
  selectedStrategyNotInRangeChartMessage:string
  solutionSet: SolutionSet = {
    "claimStrategy":null,
    "solutionsArray": [],
    "computationComplete": false
  }

  // solution variables at pointer location
  pointerStrategyPV: number
  pointerDifferenceInPV: number
  pointerDifferenceInPV_asPercent: number
  pointerSolutionSet: SolutionSet = {
    "claimStrategy":null,
    "solutionsArray": [],
    "computationComplete": false
  }

  constructor(private changeDetectorRef: ChangeDetectorRef, private solutionSetService:SolutionSetService, private birthdayService:BirthdayService, private presentValueService:PresentValueService) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    // console.log("range.component.ngAfterViewInit");
    this.initDisplay();
    this.changeDetectorRef.detectChanges();
  }

  initDisplay() {
    this.range = this.scenario.range;
    if (!this.range) {
      console.log("this.scenario.range is undefined or null.");
    } else {

      this.startDateA = this.range.firstDateA;
      this.startDateB = this.range.firstDateB;
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


  // for view-switch
      this.showCutButton = <HTMLInputElement> document.getElementById("showCut");
      this.showNoCutButton = <HTMLInputElement> document.getElementById("showNoCut");
      this.showCutChart(this.scenario.benefitCutAssumption);
      if (this.scenario.benefitCutAssumption) {
        document.getElementById("showCutForm").style.display = "inline";
      } else {
        document.getElementById("showCutForm").style.display = "none";
      }

      this.setSizes(this.range.rows, this.range.columns);

      this.cellBaseX = this.yMarginWidth + this.axisWidth;
      this.cellBaseY = this.cellHeight * (this.range.rows - 1);
      this.rowBaseY = (this.cellHeight * this.range.rows) - 1;

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

      this.paintCanvas(this.currentCondition);
    }
  }

  // for view-switch
  showCutChart(showIt: boolean): void {
    this.showCut = showIt;
    this.showCutButton.checked = showIt;
    this.showNoCutButton.checked = !showIt;
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
    this.benefitCutAssumptionSwitch.emit(showIt)
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

    //Change axis titles if necessary
      //If personA is already 70, we're only iterating one person (only one axis on graph), but that person is personB
      if (this.birthdayService.findAgeOnDate(this.personA, today) >= 70){
        this.xAxisTitle = this.personBaxisTitle
      }
    //If either person has a zero PIA, we need to reword their axis title appropriately
      if (this.personA.PIA == 0){
        this.xAxisTitle = this.personA_zeroPIAaxisTitle
      }
      if (this.personB.PIA == 0){
        this.yAxisTitle = this.personB_zeroPIAaxisTitle
        if (this.birthdayService.findAgeOnDate(this.personA, today) >= 70){
          this.xAxisTitle = this.personB_zeroPIAaxisTitle
        }
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
      this.yMarginWidth = Math.floor(this.labelWidth + this.axisLabelSpace + this.yTitleHeight + 10);
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
      context.save();
      context.translate(axisLeft, axisBottom);
      context.rotate(-Math.PI/2);
      titleX = (axisBottom-axisTop)/2
      titleY = -this.labelWidth - this.yTitleHeight
      context.fillStyle = 'black';
      context.textAlign = "center";
      context.fillText(this.yAxisTitle, titleX, titleY);
      context.restore();
    }

    // add chart title
    context.font = this.chartTitleFont;
    context.fillStyle = 'black';
    context.textAlign = 'center';
    titleY = axisBottom + this.labelHeight + this.xTitleHeight + this.chartTitleHeight;
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

  getSolutionSet(row: number, col: number): SolutionSet {
    let solutionSet: SolutionSet;

    let selectedClaimStrategy: ClaimStrategy = this.range.claimStrategiesArrays[this.currentCondition][row][col];
    if (selectedClaimStrategy){
    //have to set retirementBenefitDate, spousal date, begin/endSuspensionDates on person objects if going to use functions from solutionset.service to generate solution sets
      //Note that here we're pulling those dates from a ClaimStrategy object, which saved them from the person object(s) during the maximize PV function.
      //And now we're setting those fields on the person objects back to those saved dates, so we can use solutionset.service's functions
      this.personA.retirementBenefitDate = new MonthYearDate(selectedClaimStrategy.personARetirementDate)
      this.personA.beginSuspensionDate = new MonthYearDate(selectedClaimStrategy.personABeginSuspensionDate)
      this.personA.endSuspensionDate = new MonthYearDate(selectedClaimStrategy.personAEndSuspensionDate)
      this.personA.spousalBenefitDate = new MonthYearDate(selectedClaimStrategy.personASpousalDate)
      this.personB.retirementBenefitDate = new MonthYearDate(selectedClaimStrategy.personBRetirementDate)
      this.personB.beginSuspensionDate = new MonthYearDate(selectedClaimStrategy.personBBeginSuspensionDate)
      this.personB.endSuspensionDate = new MonthYearDate(selectedClaimStrategy.personBEndSuspensionDate)
      this.personB.spousalBenefitDate = new MonthYearDate(selectedClaimStrategy.personBSpousalDate)

      if (this.scenario.maritalStatus == "single"){
          solutionSet = this.solutionSetService.generateSingleSolutionSet(this.scenario, this.personA, this.range.pvArrays[this.currentCondition][row][col])
      }
      else if (this.scenario.maritalStatus == "married"){
        //If one spouse is already age 70, the ClaimStrategy object has that spouse's dates as personB dates ("because they're fixedSpouse from maximize function"), regardless of which person it was.
        //So we have to swap them if it was actually personA who was over 70.
          if (this.birthdayService.findAgeOnDate(this.personA, today) >= 70 ){
            this.personB.retirementBenefitDate = new MonthYearDate(selectedClaimStrategy.personARetirementDate)
            this.personB.beginSuspensionDate = new MonthYearDate(selectedClaimStrategy.personABeginSuspensionDate)
            this.personB.endSuspensionDate = new MonthYearDate(selectedClaimStrategy.personAEndSuspensionDate)
            this.personB.spousalBenefitDate = new MonthYearDate(selectedClaimStrategy.personASpousalDate)
            this.personA.retirementBenefitDate = new MonthYearDate(selectedClaimStrategy.personBRetirementDate)
            this.personA.beginSuspensionDate = new MonthYearDate(selectedClaimStrategy.personBBeginSuspensionDate)
            this.personA.endSuspensionDate = new MonthYearDate(selectedClaimStrategy.personBEndSuspensionDate)
            this.personA.spousalBenefitDate = new MonthYearDate(selectedClaimStrategy.personBSpousalDate)
          }
          solutionSet = this.solutionSetService.generateCoupleSolutionSet(this.scenario, this.personA, this.personB, this.range.pvArrays[this.currentCondition][row][col])
      }
      else if (this.scenario.maritalStatus == "divorced"){
          solutionSet = this.solutionSetService.generateCoupleSolutionSet(this.scenario, this.personA, this.personB, this.range.pvArrays[this.currentCondition][row][col])
      }
      return solutionSet
    }
    else {
      return null
    }
  }

  showSelectedOption(row: number, col: number) {
    this.solutionSet = this.getSolutionSet(row, col);
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
      //Emit the newly selected ClaimStrategy to parent component
      let claimStrategyToEmit: ClaimStrategy = this.range.claimStrategiesArrays[this.currentCondition][selectRow][selectColumn];
      this.newClaimStrategySelected.emit(claimStrategyToEmit)
    }
  }

  selectCellFromDropdownInputs(row:number, column:number) {
    if ((row >= 0) && (column >= 0)) {
      // mark the newly-selected cell
      this.markCell(this.selectedColor, row, column);
      // save selected cell row & col for other operations 
      this.selectedRow = row;
      this.selectedColumn = column;
      this.showSelectedOption(this.selectedRow, this.selectedColumn);
    }
  }


  startUpdating(e: any) {
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

      // this version gives a condensed form of the claiming strategy 
      // which would be listed for the cell, if it were selected
      this.pointerPercentString = this.range.getPvPercentString(this.currentCondition, row, column) + "% of maximum";
      if (this.showCut) {
          let expectedPvPercentNoCut: string = this.range.getPvPercentString(NO_CUT, row, column);
        this.pointerPercentString += " (" + expectedPvPercentNoCut + "% if no cut)";
      } 
      let title: string = this.pointerPercentString + "\n";
      let pointerSolutionSet: SolutionSet = this.getSolutionSet(row, column);
      if (pointerSolutionSet){
        let solutionCount: number = pointerSolutionSet.solutionsArray.length;
        for (let i: number = 0; i < solutionCount; i++) {
          title = title.concat(pointerSolutionSet.solutionsArray[i].shortMessage, "\n");
        }
        this.canvas.title = title;
      }
      else {//i.e. ,there's no SolutionSet, because the cell selected doesn't correspond to an actual option
            //(e.g., because personB has PIA=0, so we're indexing based on their spousal date, and that spousal date is before personA's retirementBenefitDate)
            this.canvas.title = "This cell does not correspond to a valid combination of filing dates.";
      }
    }
    else {
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

  findIndexForPerson(person:Person):number{
    //return -999 as index if there is no corresponding option in the Range
    let index:number = -999

    //Find earliest date in Range
    let earliestDateInRange:MonthYearDate
    if (person.id == "A"){earliestDateInRange = new MonthYearDate(this.range.firstDateA)}
    if (person.id == "B"){earliestDateInRange = new MonthYearDate(this.range.firstDateB)}

    if (person.hasFiled === false && person.isOnDisability === false){//If person has not filed and is not on disability
      //We look at person's retirementBenefitDate
      index = person.retirementBenefitDate.valueOf() - earliestDateInRange.valueOf()
    }
    else {//i.e., person has filed or is on disability but is younger than 70 
      //We look at person's begin/end suspension dates and declineSuspension field
      if (person.declineSuspension === true){
        index = 0 //essentially "starting" benefit as soon as possible (since not stopping it at all)
      }
      else {//i.e, they are planning to suspend
        let laterOfFRAorToday:MonthYearDate = new MonthYearDate()
        laterOfFRAorToday = person.FRA > today? person.FRA : today
        if (person.beginSuspensionDate.valueOf() == laterOfFRAorToday.valueOf()){//they are suspending at later of FRA or today (which is what is necessary in order for there to be a corresponding selection in Range)
            index = person.endSuspensionDate.valueOf() - earliestDateInRange.valueOf()
        }
        else {//i.e., they're suspending, but starting later than "later of FRA or today"
          //just going to return -999, since no corresponding selection in Range
        }
      }
    }
    return index
  }

  updateRangeComponentBasedOnDropDownInputs(){//This is called when "submit" is clicked with customDate inputs, in order to update Range component so that the input dates are selected in graph
  //remove message about previously-selected strategy not being in the Range, if such a message was present
  this.selectedStrategyNotInRangeChartMessage = undefined

  // unmark the previously-selected cell
  this.unmarkCell(this.selectedRow, this.selectedColumn);
 
  let row: number
  let column: number

  //Find if the Range contains a ClaimStrategy object that corresponds to the input dates
    //getCustomDateFormInputs() has already set various date fields on person objects based on the inputs selected.
    //So we can create clones of personA and personB, then call adjustSpousalBenefitDate() and see if it actually changed their spousal date.
      //Create clones of personA and personB
      let cloneOfPersonA:Person = Object.assign(new Person("A"), this.personA)
      let cloneOfPersonB:Person = Object.assign(new Person("B"), this.personB)
      //call presentvalueservice.adjustSpousalBenefitDate() on each person
      this.presentValueService.adjustSpousalBenefitDate(cloneOfPersonA, this.personB, this.scenario)
      this.presentValueService.adjustSpousalBenefitDate(cloneOfPersonB, this.personA, this.scenario)
      //Check whether the fields on those cloned persons are equal to the fields on the actual persons
      if (this.scenario.maritalStatus == "single" ||
          (cloneOfPersonA.spousalBenefitDate.valueOf() == this.personA.spousalBenefitDate.valueOf()
          && cloneOfPersonB.spousalBenefitDate.valueOf() == this.personB.spousalBenefitDate.valueOf()
          //And also make sure that neither person is declining spousal in a situation in which they could file a restricted application
          && !(this.personA.declineSpousal === true && this.personA.retirementBenefitDate > this.personB.retirementBenefitDate && this.personA.retirementBenefitDate > this.personA.FRA)
          && !(this.personB.declineSpousal === true && this.personB.retirementBenefitDate > this.personA.retirementBenefitDate && this.personB.retirementBenefitDate > this.personB.FRA)
          )
        ){//i.e., the spousal inputs selected are an option in the Range
            //Find the corresponding row and column.
              //Find column
                if (this.birthdayService.findAgeOnDate(this.personA, today) < 70){//if personA is younger than 70
                  column = this.findIndexForPerson(this.personA)
                }
                else {//i.e., personA is over 70
                  //We look at appropriate date from personB
                  column = this.findIndexForPerson(this.personB)
                }
              //Find row
                if (this.scenario.maritalStatus == "single"
                    || this.scenario.maritalStatus == "divorced"
                    || this.birthdayService.findAgeOnDate(this.personA, today) >= 70
                    || this.birthdayService.findAgeOnDate(this.personB, today) >= 70
                    ){//If single or divorce or personA is >= age 70 or personB is >= age 70
                      row = 0
                    }
                else{
                    row = this.findIndexForPerson(this.personB)
                }
            if (row == -999 || column == -999){//i.e., the suspension inputs selected are NOT an option in the range 
              this.selectedStrategyNotInRangeChartMessage = "Note: The strategy you have selected is not represented in the color-coded graph, because the graph always assumes that, if you voluntarily suspend benefits, you will suspend them as early as possible."
              if (this.scenario.maritalStatus == "single"){
                this.solutionSet = this.solutionSetService.generateSingleSolutionSet(this.scenario, this.personA, new ClaimStrategy(this.personA))
              }
              else {
                this.solutionSet = this.solutionSetService.generateCoupleSolutionSet(this.scenario, this.personA, this.personB, new ClaimStrategy(this.personA, this.personB))
              }
            }
            else {//i.e., the inputs selected really are in the range!
              this.selectCellFromDropdownInputs(row, column)
            }
        }
      else {//i.e., the spousal inputs selected are NOT an option in the Range
        this.selectedStrategyNotInRangeChartMessage = "Note: The strategy you have selected is not represented in the color-coded graph, because the graph always assumes that, if you are eligible for a restricted application for spousal benefits, you will file for such as early as possible."
        this.solutionSet = this.solutionSetService.generateCoupleSolutionSet(this.scenario, this.personA, this.personB, new ClaimStrategy(this.personA, this.personB))
      }
}

}
