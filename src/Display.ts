type CrosswordPuzzleInfo = {
    id: number;
    author: string;
    dimensions: {
        rows: number;
        columns: number;
    };
    grid: string[][];
    definitions: {
        down: { [id: string]: string };
        across: { [id: string]: string };
    };
};

type IndexdInfo = {
    ids: number[];
};

type Coordinate = {
    row: number;
    col: number;
};

type GridElement = {
    rect: SVGRectElement,
    text: SVGTextElement
}

enum Direction {
    Horizontal = 1,
    Vertical,
}

type ClickContext = {
    activeCoordinate : Coordinate | null,
    previousCoordinate : Coordinate | null,
    direction : Direction
}

class StorageContext
{
    private crossword_id : number;
    private rows : number;
    private cols : number;
    private user_input : string[][];
    private local_storage_key : string;

    private readonly LOCAL_STORAGE_VCN_KEY = "VCN";
    private readonly LOCAL_STORAGE_VCN_VAL = "1";
    private readonly LOCAL_STORAGE_KEY_PREFIX = "crossword_";

    constructor(crossword_id: number, rows: number, cols: number)
    {
        this.crossword_id = crossword_id;
        this.rows = rows;
        this.cols = cols;

        this.local_storage_key = this.LOCAL_STORAGE_KEY_PREFIX + crossword_id.toString();

        this.localStorageInit();

        this.user_input = this.loadInput();
    }

    private localStorageInit()
    {
        const current_vcn = localStorage.getItem(this.LOCAL_STORAGE_VCN_KEY);
        if (current_vcn != this.LOCAL_STORAGE_VCN_VAL)
        {
            localStorage.clear();
        }
        localStorage.setItem(this.LOCAL_STORAGE_VCN_KEY, this.LOCAL_STORAGE_VCN_VAL);
    }

    private loadInput()
    {
        const input = localStorage.getItem(this.local_storage_key);

        try
        {
            if (input == null || input == "")
            {
                throw new Error("No previous input");
            }

            const input_arr = JSON.parse(input);
            if (input_arr.length != this.rows || input_arr[0].length != this.cols)
            {
                throw new Error("Invalid input");
            }

            return input_arr;
        }
        catch (err)
        {
            return Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => ""));
        }
    }

    public getLetter(coordinate: Coordinate) : string
    {
        if (coordinate.row < 0 || coordinate.row >= this.rows 
            || coordinate.col < 0 || coordinate.col >= this.cols)
        {
            throw new Error("Invalid input for getLetter!");
        }

        return this.user_input[coordinate.row][coordinate.col];
    }

    public setLetter(coordinate: Coordinate, letter: string) : void
    {
        if (coordinate.row < 0 || coordinate.row >= this.rows 
            || coordinate.col < 0 || coordinate.col >= this.cols || letter.length > 1)
        {
            throw new Error("Invalid input for setLetter!");
        }

        this.user_input[coordinate.row][coordinate.col] = letter;
        localStorage.setItem(this.local_storage_key, JSON.stringify(this.user_input));
    }
}

export default class Display 
{
    private crossword : Element;
    private clues_horizontal : Element;
    private clues_vertical : Element;
    private grid! : (GridElement | null)[][];
    private clickContext : ClickContext = {
        activeCoordinate : null,
        previousCoordinate : null,
        direction : Direction.Horizontal
    };
    private storageContext : StorageContext | null = null;

    constructor()
    {
        this.crossword = document.getElementById("crossword")!;
        this.clues_horizontal = document.getElementById("clues_horizontal")!;
        this.clues_vertical = document.getElementById("clues_vertical")!;

        this.addKeyListener();
    }

    showCrossword(puzzleInfo: CrosswordPuzzleInfo) : void
    {
        document.getElementById("title")!.textContent = `תשבץ אינטל ${puzzleInfo.id}`;
        document.getElementById("author")!.textContent = `${puzzleInfo.author}`;
        this.crossword.innerHTML = '';
        this.clues_horizontal.innerHTML = '<h3>מאוזן</h3>';
        this.clues_vertical.innerHTML = '<h3>מאונך</h3>';

        this.storageContext = new StorageContext(puzzleInfo.id, puzzleInfo.dimensions.rows, puzzleInfo.dimensions.columns);

        this.crossword.appendChild(this.createPuzzleSvg(puzzleInfo));
        this.clues_horizontal.appendChild(this.createClues("across", puzzleInfo));
        this.clues_vertical.appendChild(this.createClues("down", puzzleInfo));

        document.getElementById("wrapper")!.classList.remove("hide");
        document.getElementById("loader")?.remove();
    }

    private createClues(direction: "across" | "down", puzzleInfo: CrosswordPuzzleInfo) : HTMLDListElement
    {
        const dl : HTMLDListElement = document.createElement("dl");
        for (const id in puzzleInfo.definitions[direction])
        {
            const dt = document.createElement("dt");
            dt.textContent = `[${id}]`;
            const dd = document.createElement("dd");
            dd.textContent = `${puzzleInfo.definitions[direction][id]}`;
            dl.appendChild(dt);
            dl.appendChild(dd);
        }

        return dl;
    }

    private createPuzzleSvg(puzzleInfo: CrosswordPuzzleInfo) : SVGElement {
        const TILE_DIMENSIONS = 40;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        svg.setAttribute("width", `${TILE_DIMENSIONS * puzzleInfo.dimensions.columns}`);
        svg.setAttribute("height", `${TILE_DIMENSIONS * puzzleInfo.dimensions.rows}`);

        this.grid = new Array(puzzleInfo.dimensions.rows);

        for (let row = 0; row < puzzleInfo.dimensions.rows; ++row)
        {
            this.grid[row] = [];
            for (let col = 0; col < puzzleInfo.dimensions.columns; ++col)
            {
                let gridElement : GridElement | null = null;
                const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", `${TILE_DIMENSIONS * col}`);
                rect.setAttribute("y", `${TILE_DIMENSIONS * row}`);
                rect.setAttribute("width", `${TILE_DIMENSIONS}`);
                rect.setAttribute("height", `${TILE_DIMENSIONS}`);
                rect.setAttribute("stroke", "black");
                rect.setAttribute("stroke-width", "1");
                rect.setAttribute("fill", "white");
                group.appendChild(rect);
                
                if (puzzleInfo.grid[row][col] == "#")
                {
                    rect.setAttribute("fill", "black");
                }
                else {
                    if (puzzleInfo.grid[row][col] != "")
                    {
                        const clue_id = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        clue_id.setAttribute("x", `${col * TILE_DIMENSIONS + TILE_DIMENSIONS - 4}`);
                        clue_id.setAttribute("y", `${row * TILE_DIMENSIONS + 12}`);
                        clue_id.setAttribute("style", "fill: black; font-size: 10px;");
                        clue_id.textContent = puzzleInfo.grid[row][col];
                        group.appendChild(clue_id);
                    }

                    const letter = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    letter.setAttribute("x", `${col * TILE_DIMENSIONS + (TILE_DIMENSIONS / 2)}`);
                    letter.setAttribute("y", `${row * TILE_DIMENSIONS + (TILE_DIMENSIONS - (TILE_DIMENSIONS / 4))}`);
                    letter.setAttribute("text-anchor", "middle");
                    letter.setAttribute("style", "fill: black; font-size: 30px;");
                    group.appendChild(letter);
                    gridElement = {rect: rect, text: letter};
                    letter.addEventListener("click", function(){that.handleRectClick(row, col);});

                    letter.textContent = this.storageContext!.getLetter({row: row, col: col});
                }
                
                svg.appendChild(group);
                this.grid[row][col] = gridElement;

                const that = this;
                rect.addEventListener("click", function(){that.handleRectClick(row, col);});
            }
        }

        return svg;
    }

    private swapDirection() : void
    {
        this.clickContext.direction = (this.clickContext.direction == Direction.Horizontal) 
                                        ? Direction.Vertical : Direction.Horizontal;
    }

    private isCoordFree(coord: Coordinate) : boolean
    {
        if (coord.row < 0 || coord.row >= this.grid.length || coord.col < 0 || coord.col >= this.grid[0].length)
        {
            return false;
        }

        if (this.grid[coord.row][coord.col] == null)
        {
            return false;
        }

        return true;
    }

    private nextCoordinate(coord: Coordinate) : Coordinate | null
    {
        const new_coord = {row: coord.row, col: coord.col};
        if (this.clickContext.direction == Direction.Horizontal)
        {
            new_coord.col -= 1;
        }
        else
        {
            new_coord.row += 1;
        }

        return (this.isCoordFree(new_coord) ? new_coord : null);
    }

    private prevCoordinate(coord: Coordinate) : Coordinate | null
    {
        const new_coord = {row: coord.row, col: coord.col};
        if (this.clickContext.direction == Direction.Horizontal)
        {
            new_coord.col += 1;
        }
        else
        {
            new_coord.row -= 1;
        }

        return (this.isCoordFree(new_coord) ? new_coord : null);
    }

    private highlightDefinition(coordinate: Coordinate | null) : void 
    {
        let nextCoord : Coordinate | null = null;
        let gridElement : GridElement | null = null;

        document.querySelectorAll("rect.highlighted").forEach(rect => {
            rect.classList.remove("highlighted");
            rect.setAttribute("fill", "white");
        });

        if (coordinate == null)
        {
            return;
        }

        if (this.prevCoordinate(coordinate) == null && this.nextCoordinate(coordinate) == null)
        {
            this.swapDirection();
        }

        for (const func of [this.prevCoordinate, this.nextCoordinate]) 
        {
            nextCoord = {row: coordinate.row, col: coordinate.col};
            do 
            {
                gridElement = this.grid[nextCoord.row][nextCoord.col];
                gridElement?.rect.setAttribute("fill", "#ccffff");
                gridElement?.rect.setAttribute("class", "highlighted");
                nextCoord = func.call(this, nextCoord);
            } while (nextCoord != null);
        }

        gridElement = this.grid[coordinate.row][coordinate.col];

        gridElement?.rect.setAttribute("fill", "#ffffcc");
        gridElement?.rect.setAttribute("class", "highlighted");        
    }

    private handleRectClick(row: number, col: number) : void
    {
        const gridElement = this.grid[row][col];
        if (gridElement == null)
        {
            return;
        }

        this.clickContext.previousCoordinate = this.clickContext.activeCoordinate;
        this.clickContext.activeCoordinate = {row: row, col: col};

        if (JSON.stringify(this.clickContext.previousCoordinate) == JSON.stringify(this.clickContext.activeCoordinate))
        {
            this.swapDirection();
        }

        this.highlightDefinition({row: row, col: col});
    }

    private addKeyListener()
    {
        document.addEventListener("keydown", (event) => {
            if (this.clickContext.activeCoordinate == null)
            {
                return;
            }

            const gridElement = this.grid[this.clickContext.activeCoordinate.row][this.clickContext.activeCoordinate.col];
            if (gridElement == null)
            {
                return;
            }

            if (event.key.length === 1 && /^[a-zA-Z\u0590-\u05FF]$/.test(event.key)) 
            {
                gridElement.text.textContent = event.key;
                this.storageContext?.setLetter(this.clickContext.activeCoordinate, gridElement.text.textContent);
                this.clickContext.activeCoordinate = this.nextCoordinate(this.clickContext.activeCoordinate);
                this.highlightDefinition(this.clickContext.activeCoordinate);
            }
            else if (event.key === "Backspace")
            {
                gridElement.text.textContent = '';
                this.storageContext?.setLetter(this.clickContext.activeCoordinate, gridElement.text.textContent);
                this.clickContext.activeCoordinate = this.prevCoordinate(this.clickContext.activeCoordinate);
                this.highlightDefinition(this.clickContext.activeCoordinate);
            }
            else if (event.key == "Delete")
            {
                gridElement.text.textContent = '';
                this.storageContext?.setLetter(this.clickContext.activeCoordinate, gridElement.text.textContent);
            }
        });
        
    }

    public showIndex(indexInfo: IndexdInfo) : void
    {
        const crossword_list = document.getElementById("crossword_list")!;
        for (let id of indexInfo.ids)
        {
            let li = document.createElement("li");
            let a = document.createElement("a");
            a.textContent = `תשבץ ${id}`;
            a.setAttribute("href", `?id=${id}`);
            li.appendChild(a);
            crossword_list.appendChild(li);
        
        }

        document.getElementById("index")!.classList.remove("hide");
        document.getElementById("loader")?.remove();
    }
}