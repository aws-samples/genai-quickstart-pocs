import csv
import json
import warnings
import string
from bs4 import MarkupResemblesLocatorWarning, BeautifulSoup

# Ignore MarkupResemblesLocatorWarning that is printed due to short size and shape of possible HTML
warnings.filterwarnings("ignore", category=MarkupResemblesLocatorWarning)


def get_alphabet_letter(number):
    """
    Returns the alphabet letter corresponding to the given number.

    Args:
        number (int): The number to convert to an alphabet letter.
    """
    if number < 1 or number > 26:
        raise ValueError("Invalid number. Please enter a number between 1 and 26.")

    return string.ascii_uppercase[number - 1] + ". "


def get_column_headers(csv_file):
    """
    Returns an array of values that represent the first row values (which are the column headers) from a CSV file.

    Args:
        csv_file (str): The path to the CSV file.
    """
    with open(csv_file, "r") as file:
        reader = csv.reader(file)
        headers_output = next(reader)
        x = 0
        headers = []
        for i in headers_output:
            if not i:
                headers.append({"id": x, "name": "Column " + str(x + 1)})
            else:
                headers.append({"id": x, "name": i})
            x += 1

    return headers


def generate_bedrock_prompts(
    csv_file,
    output_file,
    eval_type: str = "Q&A",
    answer_choices_format="original",
    column_mapping=None,
    final_instructions=None,
    include_column_names=False,
    tags=None,
    expected_response=None,
):
    """
    Generates Bedrock prompts from a CSV file.

    Args:
        csv_file (str): The path to the CSV file.
        output_file (str): The path to the output file.
        eval_type (str): The evaluation type. Defaults to "Q&A".
        answer_choices_format (str): The format of the answer choices. Defaults to "original".
        column_mapping (dict): A dictionary mapping column names to column indices. Defaults to None.
        final_instructions (str): The final instructions. Defaults to None.
        include_column_names (bool): Whether to include column names in the prompts. Defaults to False.
        tags (list): A list of tags. Defaults to None.
        expected_response (str): The expected response. Defaults to None.
    """
    """
    Generates Bedrock prompts from a CSV file.

    Args:
        csv_file (str): The path to the CSV file.
        output_file (str): The path to the output file.
        eval_type (str): The evaluation type. Defaults to "Q&A"."""
    prompts = {}
    data = {}
    try:
        if eval_type == "Q&A":
            generate_bedrock_prompts_q_and_a(csv_file, data, column_mapping)
        elif eval_type == "Text Summarization":
            generate_bedrock_prompts_basic_text(
                csv_file,
                data,
                column_mapping,
                include_column_names,
            )
        elif eval_type == "General Text Generation":
            generate_bedrock_prompts_text_generation(
                csv_file,
                data,
                column_mapping,
                expected_response=expected_response,
            )
        elif eval_type == "Classification":
            generate_bedrock_prompts_classification(
                csv_file,
                data,
                column_mapping,
                tags,
                include_column_names,
                expected_response=expected_response,
            )

    except FileNotFoundError:
        print(f"Error: File '{csv_file}' not found.")
        return
    except Exception as e:
        print(f"Error: {e}")
        return
    try:
        prompts = generate_json_data(
            eval_type, data, answer_choices_format, final_instructions=final_instructions
        )
        return write_output(output_file, prompts)
    except Exception as e:
        print(f"Error: {e}")
        return


def generate_bedrock_prompts_q_and_a(csv_file, data, column_mapping):
    """
    Generates prompt data for each row in the CSV and the provided tags

    Args:
        csv_file (str): Path to the input CSV file.
        data (dict): Dictionary to store the generated prompts.
        column_mapping (dict): Dictionary mapping column names to column indices.

    Returns:
        dict: The generated prompts.
    """
    with open(csv_file, "r") as file:
        reader = csv.reader(file)
        has_header = None
        skip_row = False
        for row in reader:
            if has_header is None:
                skip_row = True
                has_header = isinstance(row[0], str) and not row[0].isdigit()
                if has_header and column_mapping is None:
                    print("Using auto column name mapping")
                    column_mapping = {col: idx for idx, col in enumerate(row)}
                    continue
            if not skip_row:
                row = process_q_and_a_row(row, column_mapping)

                if not row.get("question_id", 0):
                    print("Skipping row with empty question ID")
                    continue

                if row.get("question_id", 0) not in data:
                    data[row.get("question_id", 0)] = {
                        "question_text": row.get("question", 1),
                        "answers": [],
                        "category": row.get("category", 4),
                    }

                is_correct = process_is_correct(row.get("is_correct", 3))

                data[row.get("question_id", 0)]["answers"].append(
                    {
                        "answer_text": BeautifulSoup(
                            row.get("answer", 2), features="html.parser"
                        ).get_text(),
                        "is_correct": is_correct,
                    }
                )
            else:
                skip_row = False
    return data


def generate_bedrock_prompts_classification(
    csv_file,
    data,
    column_mapping,
    tags,
    include_column_names=False,
    expected_response=None,
):
    """
    Generates prompt data for each row in the CSV and the provided tags

    Args:
        csv_file (str): Path to the input CSV file.
        data (dict): Dictionary to store the generated prompts.
        column_mapping (dict): Dictionary mapping column names to column indices.
        tags (list): List of tags to add to the prompts.
        include_column_names (bool): Whether to include column names in the prompts.
        expected_response (str): The expected response.
    Returns:
        dict: The generated prompts.
    """
    data = generate_bedrock_prompts_basic_text(
        csv_file,
        data,
        column_mapping,
        include_column_names,
        expected_response=expected_response,
    )
    for idx, row in enumerate(data):
        data[idx]["tags"] = tags
    return data


def generate_bedrock_prompts_basic_text(
    csv_file, data, column_mapping, include_column_names=False, expected_response=None
):
    """
    Generates prompt data for each row in the CSV
    Args:
        csv_file (str): Path to the input CSV file.
        data (dict): Dictionary to store the generated prompts.
        column_mapping (dict): Dictionary mapping column names to column indices.
        include_column_names (bool): Whether to include column names in the prompts.
        expected_response (str): The expected response.
    Returns:
        dict: The generated prompts.
    """
    with open(csv_file, "r") as file:
        reader = csv.reader(file)
        has_header = None
        skip_row = False
        x = 0
        for row in reader:
            if has_header is None:
                skip_row = True
                has_header = isinstance(row[0], str) and not row[0].isdigit()
                if has_header and column_mapping is None:
                    print("Using auto column name mapping")
                    column_mapping = {col: idx for idx, col in enumerate(row)}
                    continue
            if not skip_row:
                text_to_summarize = process_text_columns(
                    row, column_mapping, include_column_names
                )
                data[x] = {"text": text_to_summarize}
                if expected_response:
                    data[x]["expected_response"] = row[expected_response]
                x += 1
            else:
                skip_row = False
    return data


def generate_bedrock_prompts_text_generation(
    csv_file, data, column_mapping, expected_response=None
):
    """
    Generates prompt data for each row in the

    Args:
        csv_file (str): Path to the input CSV file.
        data (dict): Dictionary to store the generated prompts.
        column_mapping (dict): Dictionary mapping column names to column indices.
        expected_response (str): The expected response.

    Returns:
        dict: The generated prompts.
    """
    with open(csv_file, "r") as file:
        reader = csv.reader(file)
        has_header = None
        skip_row = False
        x = 0
        for row in reader:
            if has_header is None:
                skip_row = True
                has_header = isinstance(row[0], str) and not row[0].isdigit()
                if has_header and column_mapping is None:
                    print("Using auto column name mapping")
                    column_mapping = {col: idx for idx, col in enumerate(row)}
                    continue
            if not skip_row:
                text_to_summarize = process_text_generation_row(row, column_mapping)
                data[x]["text"] = text_to_summarize
                if expected_response:
                    data[x]["expected_response"]
                x += 1
            else:
                skip_row = False
    return data


def process_text_generation_row(row, column_mapping):
    """
    Processes a row from the CSV file and returns the text to summarize

    Args:
        row (list): A row from the CSV file.
        column_name_mapping (dict): A mapping of column names to field names.
        column_number_mapping (dict): A mapping of column numbers to field names.

    Returns:
        str: The text to summarize.
    """
    row_out = ""

    for text in column_mapping.values():
        row_out += row[text] + " "
    return row_out


def process_text_columns(row, column_mapping, include_column_names=False):
    """
    Processes a row from the CSV file and returns the text to summarize

    Args:
        row (list): A row from the CSV file.
        column_name_mapping (dict): A mapping of column names to field names.
        column_number_mapping (dict): A mapping of column numbers to field names.

    Returns:
        str: The text to summarize.
    """
    row_out = ""
    for key, value in column_mapping.items():
        if include_column_names:
            row_out += f"{key}: "
        row_out += row[value] + "\n"
    return row_out


def process_q_and_a_row(row, column_mapping):
    """
    Processes a row from the CSV file and returns the question and answer data

    Args:
        row (list): A row from the CSV file.
        column_name_mapping (dict): A mapping of column names to field names.
        column_number_mapping (dict): A mapping of column numbers to field names.

    Returns:
        dict: The question and answer data.
    """
    row_out = {}

    row_out["question_id"] = row[column_mapping.get("question_id", 0)]
    row_out["question"] = row[column_mapping.get("question", 1)]
    row_out["answer"] = row[column_mapping.get("answer", 2)]
    row_out["is_correct"] = row[column_mapping.get("is_correct", 3)]
    row_out["category"] = row[column_mapping.get("category", 4)]

    return row_out


def process_is_correct(is_correct):
    """
    Processes the is_correct field and returns the boolean value
    Args:
        is_correct (str or int): The is_correct field value
    Returns:
        bool: The boolean value
    """
    if isinstance(is_correct, str):
        is_correct = is_correct.lower() == "true"
    else:
        is_correct = bool(int(is_correct))

    return is_correct



def generate_json_data(
    eval_type, data, answer_output_type=None, final_instructions=None
):
    """
    Generates JSON data for the provided data
    
    Args:
        eval_type (str): The evaluation type.
        data (dict): The data to generate JSON data for.
        answer_output_type (str): The type of answer output.
        final_instructions (str): The final instructions.

    Returns:
        list: The generated JSON data.
    """
    structured_return = []
    for entry in data.values():
        prompt = ""
        if eval_type == "Q&A":
            referenceResponse = ""
            category = entry["category"]
            prompt = f"<question>{BeautifulSoup(entry['question_text'], features='html.parser').get_text()}</question>"

            for idx, answer in enumerate(entry["answers"], start=1):
                prompt += "<answer>"
                answer_val = format_answer(answer, answer_output_type, idx)
                prompt += answer_val + "</answer>"

                if answer["is_correct"]:
                    referenceResponse = answer_val
                if final_instructions:
                    prompt += f"<instruction>{final_instructions}</instruction>"
            structured_return.append(
                {
                    "prompt": prompt,
                    "referenceResponse": referenceResponse,
                    "category": category,
                }
            )
        elif eval_type == "Text Summarization":
            prompt = f"<text>{entry['text']}</text>"
            if final_instructions is not None:
                prompt += "".join(
                    ["<instruction>", final_instructions, "</instruction>"]
                )
            structured_return.append(
                {
                    "prompt": prompt,
                    "referenceResponse": (
                        entry["expected_response"]
                        if "expected_response" in entry
                        else None
                    ),
                }
            )
        elif eval_type == "General Text Generation":
            prompt = f"<text>{entry['text']}</text>"
            if final_instructions is not None:
                prompt += f"<instruction>{final_instructions}</instruction>"
            structured_return.append(
                {
                    "prompt": prompt,
                    "referenceResponse": (
                        entry["expected_response"]
                        if "expected_response" in entry
                        else None
                    ),
                }
            )
        elif eval_type == "Classification":
            prompt = f"<text>{entry['text']}</text>"
            prompt += f"<classifications>{','.join(entry['tags'])}</classifications>"
            if final_instructions is not None:
                prompt += f"<instruction>{final_instructions}</instruction>"
            structured_return.append(
                {
                    "prompt": prompt,
                    "referenceResponse": (
                        entry["expected_response"]
                        if "expected_response" in entry
                        else None
                    ),
                }
            )
    return structured_return


def format_answer(answer, answer_output_type, idx):
    """
    Formats the answer data based on the provided answer output type

    Args:
        answer (dict): The answer data.
        answer_output_type (str): The type of answer output.
        idx (int): The index of the answer.

    Returns:
        str: The formatted answer.
    """
    answer_val = ""
    if answer_output_type == "letter":
        answer_val += answer.get("answer_letter", get_alphabet_letter(idx))
    elif answer_output_type == "number":
        answer_val += str(idx) + ". "

    answer_val += BeautifulSoup(
        answer["answer_text"], features="html.parser"
    ).get_text()

    return answer_val


def write_output(output_file, prompts):
    """
    Writes the generated prompts to a JSON file

    Args:
        output_file (str): The path to the output file.
        prompts (list): The generated prompts.
    """
    try:
        with open(output_file, "w") as file:
            for prompt in prompts:
                json.dump(prompt, file, indent=None)
                file.write("\n")
    except Exception as e:
        print(f"Error writing output file: {e}")
        return False
    return True
