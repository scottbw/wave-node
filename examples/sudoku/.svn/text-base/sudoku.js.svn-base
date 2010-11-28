// Copyright [2007] [Austin Chau] 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not 
// use this file except in compliance with the License. You may obtain a copy of
// the License at 
//
// http://www.apache.org/licenses/LICENSE-2.0 
//
// Unless required by applicable law or agreed to in writing, software 
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT 
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
// License for the specific language governing permissions and limitations 
// under the License.

// Namespace assigned to this library of sudoku-related classes
var sudoku = {};


/**
 * Remove an element from an array object.
 * @param {Object} value An element to be removed.
 */ 
Array.prototype.remove = function(value) {	
  for (var i = 0; i < this.length; i++) {
    if (this[i] == value) {
      this.splice(i, 1);
      break;
    }
  }
};

  
/**
 * Equality comparison between two array objects with only numeric elements.
 * @param {Array.<Number>} array The array object to be compared against.
 * @return {Boolean} True/false to whether the numeric arrays are identical.
 */ 
Array.prototype.equals = function(array) {  
  var ret = true;    
  
  if (!array instanceof Array) {
    ret = false;
  } else { 
    if (this.length != array.length) {
      ret = false;
    } else {
      for (var i = 0; i < array.length; i++) {
        if (this[i] != array[i]) {
          ret = false;
          break;
        }
      }
    }    
  }
  return ret;
};


/**
 * Randomly shuffle the order of elements within the array.
 */   
Array.prototype.shuffle = function() {       
  for (var i = 0; i < this.length; i++) {
  
    var newPos = parseInt(Math.random() * i);
    
    var current = this[i];
    var temp = this[newPos];
    
    this[newPos] = current;
    this[i] = temp;
  }          
};


/**
 * Check if a number exists in an array.
 * @param {Number} num The number to be looked for in the array.
 * @return {Boolean} True/false to whether the number exists in the array.
 */   
Array.prototype.contains = function(num) {
  var ret = false;
    
  for (var i = 0; i < this.length; i++) {
    if (this[i] == num) {
      ret = true;
      break;
    }
  }  
  return ret;
};
  

/**
 * Produce a random number within a range.
 * @param {Number} min The lower bound of the randomized range.
 * @param {Number} max The uppper bound of the randomized range.
 * @return {Number} A number randomly selected between min and max.
 */     
sudoku.getRandom = function(min, max) {
  return min + Math.round(Math.random() * (max - min));
};


/**
 * Class Cell stores the remaining candidates a sudoku cell currently
 * has during puzzle generation.
 * @constructor
 */ 
sudoku.Cell = function() {
  /**
   * The possible candidate value the cell is allowed to have.
   * @type Array.<Number>
   * @public
   */
  this.candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
};


/**
 * Set the given number to be the only candidate the cell is allowed to have.
 * @param {Number} num The candidate numeric value.
 */    
sudoku.Cell.prototype.setCandidate = function(num) {
  this.candidates = [num];
};


/**
 * Randomly pick a number from a cell's candidate list.
 * @return {Number} num A random number from the cell's candidate list.
 */     
sudoku.Cell.prototype.getRandomCandidate = function() {    
  return this.candidates[sudoku.getRandom(0, this.candidates.length - 1)];
};


/**
 * Remove a number from a cell's candidate list.
 * @param {Number} num The numeric value of the number to be removed.
 */     
sudoku.Cell.prototype.removeCandidate = function(num) {  
  this.candidates.remove(num);
};


/**
 * Create a clone of a cell
 * @return {sudoku.Cell} a cloned cell object
 */     
sudoku.Cell.prototype.clone = function() {  
  var newCell = new sudoku.Cell();
  newCell.candidates = this.candidates.slice();    
  return newCell;
};



/**
 * Class Row represents a single row of a sudoku puzzle.  Each sudoku game has
 * 9 rows.  Each row contains 9 cells.  
 * @constructor
 */   
sudoku.Row = function() {
  /**
   * List of nine sudoku cells that belong to a given row
   * @type Array.<sudoku.Cell>
   * @public
   */
  this.cells = [];
  
  /**
   * The state of a row before the algoritm attemps to guess values to populate
   * its cells.  It is saved so that when later discovered an incorrect guess 
   * was made, it will be used to revert the state of the row to the initial
   * state.
   * @type Array.<sudoku.Cell>
   * @public
   */  
  this.initialState = null;
    
  for (var i = 0; i < 9; i++) {
    this.cells.push(new sudoku.Cell());
  }    
};


/**
 * Return the current list of cell that the row contains.
 * @return {Array.<sudoku.Cell>} a list of cell objects.
 */    
sudoku.Row.prototype.getCurrentState = function() {
  return this.cells;
};
  

/**
 * Set the initial state of the row to contain the same content as the current
 * state of the row.  Must use clone to get a copies of the cells, otherwise
 * only references are copied in initialState.
 */      
sudoku.Row.prototype.setInitialState = function() {    
  this.initialState = new Array(this.getCurrentState().length);
      
  for (var i = 0; i < this.getCurrentState().length; i++) {
    this.initialState[i] = this.getCurrentState()[i].clone();
  }      
};


/**
 * Revert the Row to the state of initialState.
 */  
sudoku.Row.prototype.resetRow = function() {
  this.cells = new Array(this.initialState.length);
    
  for (var i = 0; i < this.initialState.length; i++) {
    this.cells[i] = this.initialState[i].clone();
  }
};


/**
 * Remove a numeric value from the candidate list of each Cell of the Row
 * @param {Number} num The numeric value to be removed
 */  
sudoku.Row.prototype.removeCandidate = function(num) {
  for (var i = 0; i < this.cells.length; i++) {
    this.cells[i].removeCandidate(num);
  }
};



/**
 * Class SudokuGenerator generates a solvable sudoku puzzle as a string
 * @constructor
 */     
sudoku.SudokuGenerator = function() {
  /**
   * The nine rows that a sudoku puzzle is made up of.
   * @type Array.<sudoku.Row>
   * @public
   */  
  this.rows = [];  

  /**
   * The full list of 81 digits representing a valid sudoku puzzle with no empty
   * cell.
   * @type Array.<Number>
   * @public
   */    
  this.fullArray = new Array(81);
  
  /**
   * A list of 81 digits representing a valid sudoku puzzle with emtpy cells 
   * denoted by '0'.
   * @type Array.<Number>
   * @public
   */      
  this.partialArray = new Array(81);    
  
  for (var i = 0; i < 9; i++) {
    this.rows.push(new sudoku.Row());
  }
};


/**
 * Generate a solvable sudoku puzzle string.  First it would create a string of
 * 81 digits, range 1-9 that is consistently with the rules of sudoku.  Then it 
 * would attempt to randomly remove some of the digits (replace them with zero)
 * to create a valid and solvable sudoku puzzle string. 
 * @return {String} string of 81 digits, range 0-9. Representing a sudoku puzzle
 *     and is sequentially ordered from the upper left cell as index 0 to 
 *     bottom right cell as index 80.   
 */    
sudoku.SudokuGenerator.prototype.generate = function() {
  this.analyze(0, 0, 0);
  this.toArray();
  
  var puzzleStr = null;
  var solver = null;

  do {
    // create the partial puzzle - loop to make sure we have a 
    // solvable puzzle
    this.createPartialArray(); 
      
    // convert internal data structure to fullArray and convert it
    // to a long string
    puzzleStr = this.arrayToString(this.partialArray);  
    solver = new sudoku.SudokuSolver(puzzleStr);
  } while (!solver.solve());
    
  solver = null;
  
  return puzzleStr;
};


/**
 * Remove a numeric value from the candidate list of every cell of a column.
 * @param {Number} col The index of a column.
 * @param {Number} num The numeric value to be removed,
 */   
sudoku.SudokuGenerator.prototype.removeCandidateFromColumn = 
    function(col, num) {
  for (var i = 0; i < this.rows.length; i++) {
    this.rows[i].cells[col].removeCandidate(num);
  }
};
  

/**
 * Remove a numeric value from the candidate list of every cell of box region.
 * A box region is one of nine 3x3 regions of a sudoku puzzle.
 * @param {Number} row The row index of the upper left cell of a box region.
 * @param {Number} col The col index of the bottom right cell of a box region.
 * @param {Number} num The numeric value to be removed.
 */  
sudoku.SudokuGenerator.prototype.removeCandidateFromBox = 
    function(row, col, num) {    
    
  /**
   * With the given row/col position for a cell, the following switch statement
   * determine the upper-left corner position for the 3x3 region box it belongs
   * to.
   */
  switch (true) {
    case (row <= 2): 
      row = 0; 
      break;
    case (row <= 5): 
      row = 3; 
      break;
    default: 
      row = 6;
  }
  
  switch (true) {
    case (col <= 2): 
      col = 0; 
      break;
    case (col <= 5): 
      col = 3; 
      break;
    default: 
      col = 6;
  }
    
  for (var i = row; i < row + 3; i++) {
    for (var j = col; j < col + 3; j++) {
      this.rows[i].cells[j].removeCandidate(num);
    }
  }
};


/**
 * Recursively guess the candidate value for a given cell based on information 
 * it currently knows about its neighboring cells (same row, same column and 
 * same box region).  If no logical guess is deduced, which means a previous 
 * cell was guessed incorrect thus the entire row is reset and is resorted 
 * again. 
 * @param {Number} rowNum The row index of current cell that is being worked on.
 * @param {Number} colNum The col index of current cell that is being worked on.
 */    
sudoku.SudokuGenerator.prototype.analyze = function(rowNum, colNum) {  
  var row  = this.rows[rowNum];
  var cell = row.cells[colNum];
    
  // Check to make sure this cell has potenial candidates and is not empty    
  if(this.rows[rowNum].cells[colNum].candidates.length < 1) {
  
    // Since this cell cannot be filled in.  Reset the entire row
    // and all of the rows below it.
    for(var i = rowNum; i < 9; i++) {
      this.rows[i].resetRow(i);
    }      
    // keep going by starting at the beginning of the row again.
    this.analyze(rowNum, 0);
  } else {
    
    // The new number for the cell.
    var candidate = this.rows[rowNum].cells[colNum].getRandomCandidate();
  
    // Since we have a good candidate, remove it from its row, column,
    // and the box it is in
    row.removeCandidate(candidate);
    this.removeCandidateFromColumn(colNum, candidate);
    this.removeCandidateFromBox(rowNum, colNum, candidate);
    cell.setCandidate(candidate);
    
    // When we reach the end of the row, go back to the first column
    // of the next row.
    if (colNum == 8) {
      colNum = 0;
      rowNum++;
      
      // Update all of the initial states of all rows now completed
      for(var i = rowNum; i < 9; i++) {
        this.rows[i].setInitialState();
      }
    } else {
      colNum++;
    }
              
    if (rowNum == 9) {
      // Sudoku is complete.
      return false;
    } else {
      // start working on next cell
      this.analyze(rowNum, colNum);
    }
  }  
};


/**
 * Construct an array contains the final value of a cell from each row
 */    
sudoku.SudokuGenerator.prototype.toArray = function() {
  var index = 0;
  
  for (var i = 0; i < this.rows.length; i++) {
    for (var j = 0; j < this.rows[i].cells.length; j++) {
      this.fullArray[index] = this.rows[i].cells[j].candidates[0];
      index++;
    }
  }
};


/**
 * Randomly replace digits from the valid sudoku string wtih zero.  
 * The removal process is done symmetrically, to remove both the digit and its 
 * inverted position on the sudoku map.
 */      
sudoku.SudokuGenerator.prototype.createPartialArray = function() {    
  this.partialArray = this.fullArray.slice();    
  var emptySymbol = '0';
    
  var scratch = null;    
  var minRemove = 3;
  var maxRemove = 4;
    
  var toRemove = sudoku.getRandom(minRemove, maxRemove);

  var begin;
    
  /**
   * This main for loop go through the first five 3x3 box region of a fully
   * generated sudoku puzzle and systemically replace a random number of value
   * with '0' to denote an empty cell of a sudoku puzzle.
   */
  for (var region = 0; region < 5; region++) {
    scratch = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      
    // This switch statement determine the beginning corner index of the given
    // region  
    switch(region) {
      case 0:
        begin = 0;
        break;
      case 1:
        begin = 3;
        break;      
      case 2:
        begin = 6;
        break;
      case 3:
        begin = 27;
        break;              
      case 4:
        begin = 30;
        // Special case - only remove 2 cells from fifth region.
        toRemove = sudoku.getRandom(1, 2);
        break;      
    }

    /**
     * The following for loop randomly select indexes within a 3x3 region by
     * calculating the correct offset relative to the same box and perform
     * cell replacement to create empty cell.
     */      
    for (var i = 0; i < toRemove; i++) {          
      var index = scratch[sudoku.getRandom(0, scratch.length - 1)];
      scratch.remove(index);
        
      var row = Math.ceil(index / 3) - 1;        
      var offset = 0;
        
      switch(index % 3) {
        case 1: 
          offset = 0;
          break;
        case 2: 
          offset = 1;
          break;
        case 0: 
          offset = 2;
          break;;
      }
        
      var actualIndex = begin + row * 9 + offset;
        
      this.partialArray[actualIndex] = emptySymbol;
      this.partialArray[this.invertCell(actualIndex)] = emptySymbol;
    }
  }  
};


/**
 * Helper function to sudoku.createPartialArray to find the inverted postion of
 * a given index of a sudoku map.
 * @param {Number} index The index of a cell.
 * @return {Number} index The index of the inverted cell.
 */      
sudoku.SudokuGenerator.prototype.invertCell = function(index) {
  var row = Math.floor(index / 9);    
  var col = index;
    
  if (index > 8) {
    col = index % 9;
  }
    
  var newRow = 8 - row;
  var newCol = 8 - col;    
  var newIndex = newCol + (newRow * 9);
    
  return newIndex;    
};


/**
 * Concatenate all the values of a numeric array sequentially to form a string.
 * @param {Array.<Number>} array Array of numeric value.
 * @return {String} concatenated string of the input array.
 */     
sudoku.SudokuGenerator.prototype.arrayToString = function(array) {
  var str = '';
  var separator = '';
    
  for (var i = 0; i < array.length; i++) {
    str += array[i] + separator;
  }
    
  return str;  
};



/**
 * Class SolverCell represent a cell of a valid sudoku puzzle.  It is the data
 * structure use by SudokuSolver to generate a solution for the puzzle.
 * @constructor
 * @param {Number} row Row index of a cell.
 * @param {Number} col Column index of a cell.
 */     
sudoku.SolverCell = function (row, col) {
  /**
   * A boolean value to denote whether this cell is a non-empty cell.
   * @type Boolean
   * @public
   */    
  this.given = false;
  
  /**
   * The list of possible value this cell is allowed to have.
   * @type Array.<Number>
   * @public
   */      
  this.candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  /**
   * The row index of this cell.
   * @type Number
   * @public
   */        
  this.rowIndex = row;
  
  /**
   * The column index of this cell.
   * @type Number
   * @public
   */     
  this.cellIndex = col;
}


/**
 * Reset to the initial state of a SolverCell.
 */     
sudoku.SolverCell.prototype.resetCell = function() {
  this.candidates = new Array(9);
  this.candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return this.candidates;
};


/**
 * Add a numeric value to the candidate list of a SolverCell.
 * @param {Number} num A numeric value to be added as candidate.
 */    
sudoku.SolverCell.prototype.setCandidate = function(num) {
  this.candidates = [num];
};


/**
 * Debug method to see the content of a SolverCell.
 * @return {String} a string of the cell value.
 */  
sudoku.SolverCell.prototype.debug = function() {
  var cellVal = (this.candidates.length > 1) ? 0 : this.candidates[0];
  return 'cell[' + this.rowIndex + '][' + this.cellIndex + ']= ' + cellVal;  
};
  


/**
 * Class SolverRow represent a row of a valid sudoku puzzle.  Each row contains
 * 9 SolverCells.
 * @constructor
 * @param {Number} row Row index of a sudoku puzzle.
 */    
sudoku.SolverRow = function (row) {
  /**
   * The list of cells that makes up the row for puzzle solving.
   * @type Array.<sudoku.SolverCell>
   * @public
   */ 
  this.cells = [];
    
  for (var i = 0; i < 9; i++) {
    this.cells.push(new sudoku.SolverCell(row, i));
  }
};



/**
 * Class SudokuSolver represent a valid sudoku puzzle.
 * @constructor
 * @param {String} str A string of length 81 representing the sudoku string, 
       with '0' to represent a blank cell. 
 */   
sudoku.SudokuSolver = function (str) {
  /**
   * A string of 81 digits represent the final sudoku puzzle (with empty cells).
   * @type String
   * @public
   */ 
  this.puzzleStr = str;
  
  /**
   * A string of 81 digits represent the solution of the sudoku puzzle (without
   * empty cells.
   * @type String
   * @public
   */  
  this.solutionArray = null;
  
  /**
   * The list of cells that makes up the row for puzzle solving.
   * @type Array.<sudoku.SolverCell>
   * @public
   */   
  this.rows = [];
    
  for (var i = 0; i < 9; i++) {
    this.rows.push(new sudoku.SolverRow(i));
  }
  
  for (var r = 0; r < 9; r++) {
    for (var c = 0; c < 9; c++) {
      var cellValue = this.getCell(r, c);
      if (cellValue != '0') {
        this.rows[r].cells[c].setCandidate(cellValue);
        this.rows[r].cells[c].given = true;
      }
    }
  }
};


/**
 * To get the cell value by specifying its location on the sudoku map.
 * @param {Number} row A row index for a cell.
 * @param {Number} col A col index for a cell.
 * @return {Number} the numeric value of the cell.
 */      
sudoku.SudokuSolver.prototype.getCell = function(row, col) {
  var index = (row * 9) + col;  
  return this.puzzleStr.charAt(index);
};  


/**
 * Check whether the current cell value present a violation.
 * @param {sudoku.SolverCell} cell A reference to a SolverCell.
 * @return {Boolean} true/false whether the value of this cell retain the
 *     validity of the current state.
 */     
sudoku.SudokuSolver.prototype.isCellValid = function(cell) {
  var r = cell.rowIndex;
  var c = cell.cellIndex;
    
  for (var i = 0; i < 9; i++) {
    if (cell.candidates.equals(this.rows[r].cells[i].candidates) &&
        c != i) {
      return false;  
    }
    if (cell.candidates.equals(this.rows[i].cells[c].candidates) &&
        r != i) {
      return false;  
    }    
  }
    
  var snum = [0, 0, 0, 3, 3, 3, 6, 6, 6];
    
  var rs = snum[r];
  var cs = snum[c];
    
  var re = rs + 3;
  var ce = cs + 3;
    
  for (var i = rs; i < re; i++) {
    for (var j = cs; j < ce; j++) {
      if (cell.candidates.equals(this.rows[i].cells[j].candidates) &&
          (i != r && j != c)) {
        return false;
      }
    }
  }
    
  // cell is valid!
  return true;
};


/**
 * Return the next sequential cell relative to the given cell.
 * @param {sudoku.SolverCell} cell A reference to a SolverCell.
 * @return {sudoku.SolverCell} the next sequential cell.
 */   
sudoku.SudokuSolver.prototype.nextCell = function(cell) {    
  var ret = null;
        
  if (cell.cellIndex == 8) {
    ret = this.rows[cell.rowIndex + 1].cells[0];
  } else {
    ret = this.rows[cell.rowIndex].cells[cell.cellIndex + 1];
  }
    
  return ret;
};


/**
 * Attempt to derive the value of all the blank cells of the sudoku puzzle. 
 * If this is a solvable puzzle, each cell of the puzzle would eventually 
 * contain exactly one numeric value.
 * @param {sudoku.SolverCell} cell A reference to a SolverCell, the starting 
       cell where the algorithm will perform recursively (default is the first
       cell of the first row).
 * @return {Boolean} true/false whether this is a solvable puzzle.
 */   
sudoku.SudokuSolver.prototype.solve = function(cell) {
  if (!cell) {
    cell = this.rows[0].cells[0];
  }
    
  if (cell.rowIndex == 8 && cell.cellIndex == 8) {    
    var candidates = cell.candidates;
      
    for(var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
        
      cell.setCandidate(candidate);
        
      if (this.isCellValid(cell)) {
        break;
      }
    }  
    
    return true;
  }
    
  if (cell.given) {        
    return this.solve(this.nextCell(cell));
  }  
    
  cell.candidates.shuffle();
      
  var candidates = cell.candidates;
    
  for(var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
      
    cell.setCandidate(candidate);
      
    if (this.isCellValid(cell)) {
      if (cell.rowIndex == 8 && cell.cellIndex == 8) {
        return true;
      }  

      if (this.solve(this.nextCell(cell))) {
        return true;
      }
    }
  }
    
  cell.resetCell();
  return false;
};


/**
 * Collect all the numeric value of each cell after it is solved into an array.
 * @return {Array.<Number>} an array of numbers presenting the solution.
 */    
sudoku.SudokuSolver.prototype.getSolutionArray = function() {
  if (!this.solutionArray) {
    var index = 0;
    this.solutionArray = new Array(81);
  
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i];
        
      for (var j = 0; j < row.cells.length; j++) {
        var cell = row.cells[j];
        var cellval = (cell.candidates.length > 1) ? 0 : cell.candidates[0];
        this.solutionArray[index] = cellval;
        index++;
      }
    }    
  }

  return this.solutionArray;
};


/**
 * Validate the current state of the puzzle to see if there is any conflict.
 * @return {Boolean} true/false whether this is a valid sudoku puzzle.
 */    
sudoku.SudokuSolver.prototype.validateSolution = function() {    
  var ret = true;
    
  for (var i = 0; i < this.rows.length; i++) {
      
    var row = this.rows[i];      
    for (var j = 0; j < row.cells.length; j++) {
      var cell = row.cells[j];
          
      if (!this.isCellValid(cell)) {
        ret = false;
        break;
      }
    }
  }
    
  return ret;
};