// Board dimensions:
//   Portrait  (mobile):  7 columns × 15 rows
//   Landscape (desktop): 15 columns × 7 rows

export const PORTRAIT_COLS  = 7;
export const PORTRAIT_ROWS  = 15;
export const LANDSCAPE_COLS = 15;
export const LANDSCAPE_ROWS = 7;

/**
 * Returns [row, col] (0-indexed) for a square ID on the board grid.
 * isDesktop = landscape (15×7); otherwise portrait (7×15).
 */
export function squareGridPos(id: number, isDesktop: boolean): [number, number] {
  if (isDesktop) {
    // Landscape 15 cols × 7 rows
    if (id <= 14) return [6, 14 - id];          // bottom row, right→left
    if (id <= 19) return [5 - (id - 15), 0];    // left col, bottom→top
    if (id <= 34) return [0, id - 20];           // top row, left→right
    return [id - 34, 14];                        // right col, top→bottom
  } else {
    // Portrait 7 cols × 15 rows
    if (id <= 14) return [id, 6];               // right col, top→bottom
    if (id <= 20) return [14, 20 - id];          // bottom row, right→left
    if (id <= 34) return [34 - id, 0];           // left col, bottom→top
    return [0, id - 34];                         // top row, left→right
  }
}

/**
 * Returns true if [row, col] is an inner (non-border) cell.
 * Inner cells are not rendered as board squares.
 */
export function isInnerCell(row: number, col: number, isDesktop: boolean): boolean {
  const rows = isDesktop ? LANDSCAPE_ROWS : PORTRAIT_ROWS;
  const cols = isDesktop ? LANDSCAPE_COLS : PORTRAIT_COLS;
  return row > 0 && row < rows - 1 && col > 0 && col < cols - 1;
}

/**
 * Returns the square ID at a given [row, col], or null if inner/outside.
 */
export function squareIdAt(row: number, col: number, isDesktop: boolean): number | null {
  for (let id = 0; id < 40; id++) {
    const [r, c] = squareGridPos(id, isDesktop);
    if (r === row && c === col) return id;
  }
  return null;
}
