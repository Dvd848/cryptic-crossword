from pathlib import Path
import argparse
import json
import csv


def export_to_csv(input_dir: str, output_path: str) -> None:
    with open(output_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["פתרון", "הגדרה", "אורך", "מחבר", "מספר"])

        for crossword_path in Path(input_dir).glob("*.json"):
            with open(crossword_path, "r") as crossword_file:
                data = json.load(crossword_file)
                if "solutions" not in data:
                    continue

                for direction in data["solutions"]:
                    for clue_id, solution in data["solutions"][direction].items():
                        writer.writerow([solution, data["definitions"][direction][clue_id], len(solution), data["author"], data['id']])

def main():
    parser = argparse.ArgumentParser(description="Export clues to CSV file")
    parser.add_argument("-i", "--input_dir", required=True, help="Path to crosswords folder")
    parser.add_argument("-o", "--output_path", required=True, help="Path to output CSV file")
    args = parser.parse_args()

    input_dir = args.input_dir
    output_path = args.output_path

    export_to_csv(input_dir, output_path)

if __name__ == "__main__":
    main()