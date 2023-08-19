from docx import Document
import os
import enum
import json
import re
import argparse

REGEX_TABLE_BACKGROUND = re.compile('w:fill=\"(\S*)\"')
REGEX_DEFINITION = re.compile('\s*(\d+)\s*\)\s*(.*)')
REGEX_CROSSWORD_ID = re.compile('\d+')

def is_cell_blocked(cell):
    match = REGEX_TABLE_BACKGROUND.search(cell._tc.xml)
    result = match.group(1)
    assert(result in ["auto", "000000", "FFFFFF"])
    return (result != "auto" and result != "FFFFFF")

def process_docx_directory(directory_path, out_dir):
    for filename in os.listdir(directory_path):
        if filename.endswith(".docx"):
            print(f"Parsing '{filename}'")
            file_path = os.path.join(directory_path, filename)
            process_crossword(file_path, out_dir)

def process_crossword(path, out_dir):
    document = Document(path)

    class State(enum.Enum):
        READ_CROSSWORD_ID = "id"
        READ_AUTHOR = "author"
        READ_DOWN_TITLE = "down_title"
        READ_DOWN_DEFINITIONS = "down"
        READ_ACROSS_TITLE = "across_title"
        READ_ACROSS_DEFINITIONS = "across"

    crossword = {
        State.READ_CROSSWORD_ID.value: 0,
        State.READ_AUTHOR.value: "",
        "dimensions": {
            "rows": 0,
            "columns": 0,
        },
        "grid": [],
        "definitions": {
            State.READ_DOWN_DEFINITIONS.value: {},
            State.READ_ACROSS_DEFINITIONS.value: {}
        }
    }

    state = State.READ_CROSSWORD_ID
    for para in document.paragraphs:
        line = para.text.strip()
        if line == "":
            continue

        match state:
            case State.READ_CROSSWORD_ID:
                crossword[state.value] = int(REGEX_CROSSWORD_ID.findall(line)[0])
                state = State.READ_AUTHOR
            case State.READ_AUTHOR:
                crossword[state.value] = line
                state = State.READ_DOWN_TITLE
            case State.READ_DOWN_TITLE:
                assert(line == "מאונך")
                state = State.READ_DOWN_DEFINITIONS
            case State.READ_DOWN_DEFINITIONS | State.READ_ACROSS_DEFINITIONS:
                if line == "מאוזן":
                    state = State.READ_ACROSS_DEFINITIONS
                else:
                    match = re.search(REGEX_DEFINITION, line)
                    if match:
                        number = int(match.group(1))
                        text = match.group(2)
                    crossword["definitions"][state.value][number] = text

    assert(len(document.tables) == 1)
    table = document.tables[0]
    crossword["dimensions"]["rows"] = len(table.rows)
    crossword["dimensions"]["columns"] = len(table.rows[0].cells)

    for row in table.rows:
        row_list = []
        for cell in row.cells:
            #print(cell._tc.xml)
            if is_cell_blocked(cell):
                row_list.append('#')
            else:
                text = "".join(p.text for p in cell.paragraphs).strip()
                row_list.append(text)
        crossword["grid"].append(row_list[::-1])
        assert(len(row_list) == crossword["dimensions"]["columns"])


    with open(os.path.join(out_dir, f"{crossword[State.READ_CROSSWORD_ID.value]}.json"), "w", encoding="utf8") as o:
        json.dump(crossword, o)


def main():
    parser = argparse.ArgumentParser(description="Convert Cryptic Crossword from docx to json")
    parser.add_argument("-i", "--input_path", required=True, help="Path to docx file or directory containing docx files")
    parser.add_argument("-o", "--out_dir", required=True, help="Output directory")
    args = parser.parse_args()

    input_path = args.input_path
    out_dir = args.out_dir

    if os.path.isfile(input_path):
        process_crossword(input_path, out_dir)
    elif os.path.isdir(input_path):
        process_docx_directory(input_path, out_dir)
    else:
        print("Invalid input path.")

if __name__ == "__main__":
    main()