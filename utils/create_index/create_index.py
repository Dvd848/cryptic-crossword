import json
from pathlib import Path

def process_directory(directory_path):
    file_names = set()

    for json_path in directory_path.glob("*.json"):
        if json_path.stem.isnumeric():
            file_names.add(int(json_path.stem))

    return file_names

def main():
    input_directory = Path(Path(__file__).resolve().parent / ".." / ".." / "crosswords")
    index_file = "index.json"

    if not input_directory.is_dir():
        print("Invalid directory path.")
        return

    file_names = process_directory(input_directory)

    data = {
        "ids": list(sorted(file_names, reverse=True))
    }

    with open(input_directory / ".." / index_file, "w") as index_json:
        json.dump(data, index_json)

    print(f"Processed {len(file_names)} JSON files and saved to {index_file}.")

if __name__ == "__main__":
    main()
