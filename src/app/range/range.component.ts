import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core'
import { CalculationScenario } from '../data model classes/calculationscenario'
import { MonthYearDate } from '../data model classes/monthyearDate'
import { Person } from '../data model classes/person'
import { Range } from '../data model classes/range'
import { ClaimDates } from '../data model classes/claimDates'

// convenience constants to avoid references to a different class
const NO_CUT = Range.NO_CUT
const CUT = Range.CUT

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
  @Input() personA: Person
  @Input() personB: Person
  @Input() homeSetCustomDates: Function

  // for display of quality of options
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D

  pctSelStr: string = "";
  pctPtrStr: string = "";

  // Strings with starting dates
  selectedClaimDatesStrNoCut: string;
  selectedClaimDatesStrCut: string;
  pointerClaimDatesStrNoCut: string;
  pointerClaimDatesStrCut: string;

  range: Range;
  startDateA: MonthYearDate; // date at which personA first receives benefits, to be used when converting row to date
  startDateB: MonthYearDate; // date at which personB first receives benefits, to be used when converting column to date
  
  cellWidth: number;
  cellHeight: number;
  minimumCellWidth: number = 6;
  minimumCellHeight: number = 6;
  chartTitleStr: string;

  axisWidth: number = 2; // width of x- or y-axis
  halfAxisWidth: number = this.axisWidth / 2;
  axisColor: string = 'gray';
  axisTitleFontSize = 14;
  axisTitleFont: string = this.axisTitleFontSize + 'px serif';
  axisLabelFontSize = 14;
  axisLabelFont: string = this.axisLabelFontSize + 'px serif';
  chartTitleFontSize = 16;
  chartTitleFont: string = 'bold ' + this.chartTitleFontSize + 'px serif';
  chartTitleHeight: number;
  axisTickSize: number = 10;
  axisLabelSpace: number = 5;
  xAxisTitleSingle: string = "You Start Retirement";
  xAxisTitleCouple: string = "You Start Own Retirement";
  xAxisTitle: string = this.xAxisTitleSingle;
  yAxisTitle: string = "Spouse Starts Own Retirement";
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
  keyLabelFontHeight: number = 14;
  keyLabelFont: string = this.keyLabelFontHeight + 'px serif';
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

  selectedRow: number = -1;
  selectedCol: number = -1;
  prevPointerRow: number = -1;
  prevPointerCol: number = -1;
  updating: boolean = false;

  prevPvNoCut: number = 0;

  selectedColor = 'black'; // mark of selected cell
  pointerColor = 'rgb(250, 250, 20)'; // yellow, border around cell at pointer location

  constructor() {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    console.log("range.component.ngAfterViewInit");
    this.initDisplay();
  }

  initDisplay() {
    this.range = this.scenario.range;
    if (!this.range) {
      console.log("this.scenario.range is undefined or null.");
    } else {

      this.startDateA = this.range.firstDateA;
      this.startDateB = this.range.firstDateB;
      this.pctSelStr = "";
      this.selectedRow = -1;
      this.selectedCol = -1;

      if (this.scenario.benefitCutAssumption === false) {
        this.currentCondition = NO_CUT;
        this.chartTitleStr = "% of Maximum PV (If No Cut)"
      } else {
        this.currentCondition = CUT;
        this.chartTitleStr = "% of Maximum PV (If Cut of " + 
          this.scenario.benefitCutPercentage + "% at " +
          this.scenario.benefitCutYear + ")"
      }

      // get elements where information will be displayed
      this.canvas = this.canvasRef.nativeElement;
      this.canvasContext = this.canvas.getContext("2d");

      this.prevPvNoCut = this.scenario.pvNoCut;

      this.setSizes(this.range.rows, this.range.cols);

      this.cellBaseX = this.yMarginWidth + this.axisWidth;
      this.cellBaseY = this.cellHeight * (this.range.rows - 1);
      this.rowBaseY = (this.cellHeight * this.range.rows) - 1;

      this.selectedClaimDatesStrNoCut = "";
      this.pointerClaimDatesStrNoCut = "";

      this.paintCanvas(this.currentCondition);
  }
}

  updateDisplay(event: Event) {
    this.initDisplay();
  }

  setSizes(rows: number, cols: number): void {
    // need to call this whenever change in rows or columns
    // i.e., different number of possible claim date combinations 

    let maxCells = this.range.rows;
    if (maxCells < this.range.cols) {
      maxCells = this.range.cols;
    }

    this.setKeySize();

    let maxCanvasDimension = 500;
    this.cellWidth = Math.floor(Math.max(maxCanvasDimension/maxCells, this.minimumCellWidth));
    this.cellHeight = Math.floor(Math.max(this.cellWidth, this.minimumCellHeight));

    if (rows === 1) {
      // single person
      this.xAxisTitle = this.xAxisTitleSingle;
      if (this.cellHeight < 20) {
        // increase height for better visibility of single-row (one-person) display
        this.cellHeight = 20;
      }
    } else {
      this.xAxisTitle = this.xAxisTitleCouple;
    }

    // Calculate chart element dimensions to fit actual axis contents
    let ctx:CanvasRenderingContext2D = this.canvasContext;
    ctx.font = this.axisTitleFont;
    this.xTitleWidth = ctx.measureText(this.xAxisTitle).width;
    this.xTitleHeight = this.axisTitleFontSize * 1.5;
    this.yTitleWidth = ctx.measureText(this.yAxisTitle).width;      
    this.yTitleHeight = this.axisTitleFontSize * 1.5;
    this.chartTitleHeight = this.chartTitleFontSize * 2;
    this.keySpace = this.chartTitleFontSize;
    ctx.font = this.axisLabelFont;
    this.labelWidth = ctx.measureText("2020").width;
    this.labelHeight = this.axisLabelFontSize * 1.5;

    let cellsWidth = (this.range.cols * this.cellWidth); // width of all cells
    this.xMarginWidth = Math.max(cellsWidth, this.xTitleWidth, this.yTitleWidth, this.keyWidth);
    this.xMarginWidth = Math.floor(this.xMarginWidth + 1);

    this.xMarginHeight = Math.floor(this.axisLabelSpace + this.labelHeight + 
      this.xTitleHeight + this.chartTitleHeight + this.keySpace + 1);
    if (rows > 0) {
      // this is a couple
      this.xMarginHeight += Math.floor(this.yTitleHeight + 1);
    }

    this.yMarginWidth = Math.floor(this.labelWidth + this.axisLabelSpace + 1);
    this.yMarginHeight = Math.floor(this.range.rows * this.cellHeight + 1);

    this.canvasWidth = this.yMarginWidth + this.axisWidth + this.xMarginWidth;
    this.canvasHeight = this.xMarginHeight + this.axisWidth + this.yMarginHeight + this.keyHeight;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
  }

  // get x, y coordinates of upper left corner of cell at row, col
  getCellUL(row: number, col: number): number[] {
    // leaving space for border around cells
    let ulX: number = this.cellBaseX + (col * this.cellWidth);
    let ulY: number = this.cellBaseY - (row * this.cellHeight);
    return [ulX, ulY];
  }

  paintCell(condition: number, row: number, col: number) {
    let color: string;
    let ul: number[] = this.getCellUL(row, col); // ul[0] = x, ul[1] = y
    color = this.range.getColor(condition, row, col);
    this.canvasContext.fillStyle = color;
    this.canvasContext.fillRect(ul[0], ul[1], this.cellWidth, this.cellHeight);
  }

  paintMargins() {
    let ctx: CanvasRenderingContext2D = this.canvasContext;
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = this.axisWidth;
    let isCouple: boolean = this.range.rows > 1;
    
    // draw y-axis and x-axis
    let axisLeft: number = this.cellBaseX - this.halfAxisWidth;
    let axisRight: number = this.cellBaseX + (this.range.cols * this.cellWidth);
    let axisBottom: number = this.cellBaseY + this.cellHeight + this.halfAxisWidth;
    let axisTop: number = 0; // works for couple
    if (!isCouple) {
      axisTop = axisBottom;
    }    
    ctx.beginPath();
    ctx.moveTo(axisLeft, axisTop);
    ctx.lineTo(axisLeft, axisBottom);
    ctx.lineTo(axisRight, axisBottom);
    ctx.stroke();

    // add x-axis title
    let titleX = axisLeft + (this.xMarginWidth / 2);
    let titleY = axisBottom + this.labelHeight + this.xTitleHeight;
    ctx.font = this.axisTitleFont;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(this.xAxisTitle, titleX, titleY);

    if (isCouple) {
      // add y-axis title
      titleY += this.yTitleHeight;
      titleX = axisLeft;
      ctx.font = this.axisTitleFont;
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textAlign = 'left';
      ctx.fillText(this.yAxisTitle, titleX, titleY);
      // draw arrow towards yMargin
      ctx.beginPath();
      let fontSize = this.axisTitleFontSize;
      let arrowheadBottom = axisBottom + fontSize;
      ctx.moveTo(titleX - 5, titleY - (fontSize / 2)); 
      let turnX: number = titleX - this.yMarginWidth / 2
      ctx.lineTo(turnX, titleY - fontSize/2);
      ctx.lineTo(turnX, axisBottom);
      ctx.lineTo(turnX - fontSize/2, arrowheadBottom);
      ctx.lineTo(turnX + fontSize/2, arrowheadBottom);
      ctx.lineTo(turnX, axisBottom);
      ctx.stroke();
    }

    // add chart title
    ctx.font = this.chartTitleFont;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    titleY += this.chartTitleHeight;
    titleX = this.canvasWidth / 2;
    ctx.fillText(this.chartTitleStr, titleX, titleY);

    // add key
    this.drawKey(this.currentCondition, titleX - (this.keyWidth / 2), titleY + this.chartTitleFontSize);

    // add x-axis tick marks and year labels
    let tickTop: number = axisBottom + this.halfAxisWidth;
    let tickBottom: number = tickTop + this.axisTickSize;
    let tickX: number = axisLeft;
    let nextX: number;

    let labelX: number;
    let labelY: number = tickTop + this.labelHeight;
    ctx.font = this.axisLabelFont;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    
    let year = this.range.firstYearA;
    for (let i = 0; i < this.range.yearMarksA.length; i++) {
      ctx.beginPath();
      ctx.moveTo(tickX, tickTop);
      ctx.lineTo(tickX, tickBottom);
      ctx.stroke();
      if (i < this.range.yearMarksA.length - 1) {
        // draw label for this range
        nextX = this.cellBaseX + (this.range.yearMarksA[i + 1] * this.cellWidth)
        if ((nextX - tickX) > this.labelWidth) {
          labelX = (nextX + tickX) / 2;
          ctx.fillText(year.toString(), labelX, labelY);
        }
        year++;
        tickX = nextX;
      }
    }

    if (isCouple) {
      // add y-axis tick marks and year labels
      year = this.range.firstYearB;
      ctx.textAlign = 'right';
      let tickRight: number = axisLeft - this.halfAxisWidth;
      let tickLeft: number = tickRight - this.axisTickSize;
      let tickY: number = axisBottom;
      let nextY: number;
      let labelX: number = tickRight - this.axisLabelSpace;
      for (let i = 0; i < this.range.yearMarksB.length; i++) {
        ctx.beginPath();
        ctx.moveTo(tickLeft, tickY);
        ctx.lineTo(tickRight, tickY);
        ctx.stroke();
        if (i < this.range.yearMarksB.length - 1) {
          // draw label for this range
          nextY = this.rowBaseY - ((this.range.yearMarksB[i + 1]) * this.cellWidth)
          if ((tickY - nextY) > this.labelHeight) {
            labelY = (nextY + tickY) / 2 + this.axisLabelFontSize/2;
            ctx.fillText(year.toString(), labelX, labelY);
          }
          year++;
          tickY = nextY;
        }
      }
    }
  }

  paintCanvas(condition: number) {
    this.canvasContext.strokeStyle = this.axisColor;
    this.canvasContext.lineWidth = this.axisWidth;

    this.paintMargins();
    
    for (let row = 0; row < this.range.rows; row++) {
      for (let col = 0; col < this.range.cols; col++) {
        this.paintCell(condition, row, col);
      }
    }
  }

  clearData() {
    this.pointerClaimDatesStrNoCut = '';
    this.pointerClaimDatesStrCut = '';

    this.pctPtrStr = '';
  }

  roundSignificantDigits(num: number, digits: number) {
    // One could use this to show a simpler version of the PV,
    // but that would not agree with the nearest-dollar value shown elsewhere
    let numInt = Math.round(num);
    // could use numInt.toPrecision(digits)
    // below also adds commas as thousand separators
    return numInt.toLocaleString('en-US', { maximumSignificantDigits: digits })
  }

  fracToPct(num: number, places: number) {
    return (num * 100).toFixed(places);
  }

  showSelStarts(row: number, col: number, ) {
    let selectedClaimDatesNoCut = this.range.claimDatesArrays[this.currentCondition][row][col];
    this.selectedClaimDatesStrNoCut = selectedClaimDatesNoCut.benefitDatesString();
    // this.homeSetCustomDates(selectedClaimDatesNoCut)
    // let expectedPvStr: string = Math.round(this.range.getPv(this.currentCondition, row, col)).toLocaleString();
    let expectedPvPct: string = this.fracToPct(this.range.getPvFrac(this.currentCondition, row, col), 1);
    // this.pctSelStr = "Expected PV = $" + expectedPvStr + ", " + expectedPvPct + "% of max. PV";
    this.pctSelStr = "Expected PV = " + expectedPvPct + "% of maximum PV";
    if (this.currentCondition > NO_CUT) {
      let expectedPvPctNoCut: string = this.fracToPct(this.range.getPvFrac(NO_CUT, row, col), 1);
      this.pctSelStr += " (" + expectedPvPctNoCut + "% if no cut)";
    }
  if (this.currentCondition == CUT) {
      let selectedClaimDatesCut = this.range.claimDatesArrays[CUT][row][col];
      // TODO: show only if dates different for CUT case
      this.selectedClaimDatesStrCut = selectedClaimDatesCut.benefitDatesString();
    }
  }

  getRowCol(e: MouseEvent) { // returnValue[0] = x, returnValue[1] = y
    let xy = this.getXY(e);
    let x = xy[0];
    let y = xy[1];
    let row = Math.floor((this.rowBaseY - y) / this.cellHeight);
    let col = Math.floor((x - this.cellBaseX) / this.cellWidth);
    // row & col should not be out of range, but just in case:
    if (row >= this.range.rows) {
      row = this.range.rows - 1
    }
    if (col >= this.range.cols) {
      col = this.range.cols - 1
    } 
    return [row, col];
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

  markCell(markColor: string, markRow: number, markCol: number) {
    if (markRow >= 0 && markCol >= 0) { // to avoid marking the initial selected cell at (-1, -1)
      let ul: number[] = this.getCellUL(markRow, markCol);
      this.canvasContext.lineWidth = this.markWidth;
      this.canvasContext.strokeStyle = markColor;
      // Marking cell at the pointer with a rectangle
      this.canvasContext.strokeRect(ul[0] + this.halfMarkWidth, ul[1] + this.halfMarkWidth, 
      this.cellWidth - this.markWidth, this.cellHeight - this.markWidth);
    }
  }

  selectCell(e: MouseEvent) {
    let rowCol = this.getRowCol(e);
    // save location of newly-selected cell
    let selectRow = rowCol[0];
    let selectCol = rowCol[1];
    if ((selectRow >= 0) && (selectCol >= 0)) {
      // unmark the previously-selected cell
      this.unmarkCell(this.selectedRow, this.selectedCol);
      // mark the newly-selected cell
      this.markCell(this.selectedColor, selectRow, selectCol);
      // save selected cell row & col for other operations 
      this.selectedRow = selectRow;
      this.selectedCol = selectCol;
      this.showSelStarts(this.selectedRow, this.selectedCol);
      // this.showPct(this.selectedRow, this.selectedCol, this.pctSelStr);
      let condition: number = NO_CUT;
      if (this.scenario.benefitCutAssumption) {
        condition = CUT;
      }
      let expectedPvStr: string = Math.round(this.range.getPv(condition, selectRow, selectCol)).toLocaleString();
      let expectedPvPct: string = this.fracToPct(this.range.getPvFrac(this.currentCondition, selectRow, selectCol), 1);
      this.pctSelStr = "Expected PV = $" + expectedPvStr + ", " + expectedPvPct + "% of max. PV";
      if (this.currentCondition > NO_CUT) {
        let expectedPvPctNoCut: string = this.fracToPct(this.range.getPvFrac(NO_CUT, selectRow, selectCol), 1);
        this.pctSelStr += " (" + expectedPvPctNoCut + "% if no cut)";
      }
    }
}

  startUpdating(e) {
    // Start updating displayed values, per location of pointer
    this.updating = true;
  }

  stopUpdating() {
    this.updating = false;
    this.unmarkCell(this.prevPointerRow, this.prevPointerCol);
    if ((this.prevPointerRow === this.selectedRow) || (this.prevPointerCol === this.selectedCol)) {
      // if the most recent pointer location was the selected cell, re-mark it
      this.markCell(this.selectedColor, this.selectedRow, this.selectedCol);
    }
    this.clearData();
  }

update(e: MouseEvent) {
    let rowCol = this.getRowCol(e);
    let row = rowCol[0];
    let col = rowCol[1];

    // unmark the pointer location
    this.unmarkCell(this.prevPointerRow, this.prevPointerCol);
    if ((this.prevPointerRow === this.selectedRow) && (this.prevPointerCol === this.selectedCol)) {
      // re-mark the selected cell
      this.markCell(this.selectedColor, this.selectedRow, this.selectedCol);
    }

    if ((row >= 0) && (col >= 0)) {
      // mark the pointer location, even if it is the selected cell
      this.markCell(this.pointerColor, row, col)
      this.prevPointerRow = row;
      this.prevPointerCol = col;
      let claimsStr = this.range.rowColumnDatesString(row, col);
      this.pctPtrStr = this.fracToPct(this.range.getPvFrac(this.currentCondition, row, col), 1) + "% of max., " + claimsStr;
      if (this.currentCondition > NO_CUT) {
        let expectedPvPctNoCut: string = this.fracToPct(this.range.getPvFrac(NO_CUT, row, col), 1);
        this.pctPtrStr += " (" + expectedPvPctNoCut + "% if no cut)";
      }
      this.canvas.title = this.pctPtrStr
    }
  }

  setKeySize() {
    // determine location and size of key components

    let ctx: CanvasRenderingContext2D = this.canvasContext;
    this.keyCellsWidth = (this.keyCellWidth * this.range.fracLabels.length);
    this.keyWidth = this.keyCellsWidth + this.keyBorderWidth * 2;
    this.keyHeight = this.keyCellHeight + (this.keyBorderWidth * 2) + this.keyLabelFontHeight * 1.5;
    
  }

  drawKey(condition: number, keyLeft: number, keyTop: number): void {
    let ctx: CanvasRenderingContext2D = this.canvasContext;
    let borderWidth = this.keyBorderWidth;
    let halfWidth = borderWidth / 2; 

    let cellsLeft = keyLeft + borderWidth;
    let cellsTop = keyTop + this.keyBorderWidth;
    let borderLeft = cellsLeft - halfWidth;
    let borderTop = cellsTop - halfWidth;
    ctx.strokeStyle = this.keyBorderColor;
    ctx.lineWidth = this.keyBorderWidth;
    ctx.strokeRect(borderLeft, borderTop, this.keyCellsWidth + borderWidth, 
      this.keyCellHeight + borderWidth);
    
    // paint cells and cell labels
    let keyCellCount = this.range.fracLabels.length;
    let cellX = cellsLeft;
    let labelY = cellsTop + this.keyCellHeight + (this.keyBorderWidth * 2) + this.keyLabelFontHeight;
    ctx.fillStyle = 'black';
    ctx.textAlign ='left';
    ctx.font = this.keyLabelFont;
    ctx.textAlign ='center';
    // let fracIDy = cellsUly + this.cellHeight + this.keyBorderWidth + 2;
    let fracNumber = keyCellCount - 1;
    for (let i = 0; i < keyCellCount; i++) {
      ctx.fillStyle = this.range.colorByNumber[condition][fracNumber];
      ctx.fillRect(cellX, cellsTop, this.keyCellWidth, this.keyCellHeight);
      ctx.fillStyle = 'black';
      ctx.fillText(this.range.fracLabels[fracNumber], cellX, labelY);
      cellX += this.keyCellWidth;
      fracNumber--;
    }
  }

}
