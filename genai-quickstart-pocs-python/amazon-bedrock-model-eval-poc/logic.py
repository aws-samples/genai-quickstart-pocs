import csv
import json
import warnings
import string
from bs4 import MarkupResemblesLocatorWarning, BeautifulSoup
import pandas as pd

# Ignore MarkupResemblesLocatorWarning that is printed due to short size and shape of possible HTML
warnings.filterwarnings("ignore", category=MarkupResemblesLocatorWarning)

evaluation_type = {
    "QAndA": "Q&A",
    "TextSummarization": "Text Summarization",
    "TextGeneration": "General Text Generation",
    "Classification": "Classification",
}

evaluation_type_value = {
    "Q&A": "QAndA",
    "Text Summarization": "TextSummarization",
    "General Text Generation": "TextGeneration",
    "Classification": "Classification",
}


def select_columns(df: pd.DataFrame, columns: list):
    """
    Create a new DataFrame with only the specified columns.

    Args:
        df (pandas.DataFrame): The input DataFrame.
        columns (list): A list of column names or column indices.

    Returns:
        pandas.DataFrame: A new DataFrame with only the specified columns.
    """
    if all(isinstance(col, str) for col in columns):
        # Columns are specified by name
        return df[columns]
    elif all(isinstance(col, int) for col in columns):
        # Columns are specified by index
        return df.iloc[:, columns]
    else:
        raise ValueError(
            "The 'columns' argument must be a list of all strings or all integers."
        )


def aggregate_q_and_a_records(df: pd.DataFrame):
    """
    Transform a Pandas DataFrame to have columns with the same question_id aggregated.
    The row's answer and is_correct values are transformed into a JSON object,
    and all the rows with the same question ID are merged into a single row with
    an array of answers in one column. The first row of each aggregate is also
    included in the output DataFrame.

    Args:
        df (pandas.DataFrame): The input DataFrame.

    Returns:
        pandas.DataFrame: The transformed DataFrame.
    """
    # Create a dictionary of answer information for each question_id
    data = {}
    for _, row in df.iterrows():
        question_id = row.get("question_id", None)
        if question_id not in data:
            data[question_id] = {"question": row["question"], "answers": []}
            # Add any other columns to the data dictionary
            for col in df.columns:
                if col not in ["question", "answer", "is_correct"]:
                    data[question_id][col] = row[col]

        data[question_id]["answers"].append(
            {"answer": row["answer"], "is_correct": row["is_correct"]}
        )
        if row["is_correct"]:
            data[question_id]["correct_answer"] = row["answer"]

    # Convert the dictionary to a DataFrame
    output_df = pd.DataFrame.from_dict(data, orient="index")
    return output_df


def get_column_headers(csv_file):
    """
    Returns an array of values that represent the first row values (which are the column headers) from a CSV file.

    Args:
        csv_file (str): The path to the CSV file.
    """
    with open(csv_file, "r", encoding="utf-8-sig") as file:
        reader = csv.reader(file)
        headers_output = next(reader)
        x = 0
        headers = []
        for i in headers_output:
            if not i:
                headers.append({"id": x, "name": "Column " + str(x + 1)})
            else:
                headers.append({"id": x, "name": strip_html(i)})
            x += 1

    return headers


def strip_html(html):
    """
    Strips HTML tags from the input string.

    Args:
        html (str): The input string.

    Returns:
        str: The string with HTML tags removed.
    """
    if type(html) in [dict, object]:
        for key in html.keys():
            html[key] = strip_html(html[key])
        return html
    elif type(html) in [list, pd.Series]:
        for idx, item in enumerate(html):
            html[idx] = strip_html(item)
        return html
    elif type(html) != str:
        return html
    else:
        soup = BeautifulSoup(html, "html.parser").decode('utf-8')
        return str(soup.replace('\n', ' ').replace('\r', '').strip())


def format_answer_value(
    answer: str, answer_format: str, idx: int, exclude_wrapper_tag=False
) -> str:
    """
    Formats the answer data based on the provided answer output type

    Args:
        answer (str): The answer value.
        answer_format (str): The format of the answer.
        idx (int): The index of the answer.

    Returns:
        str: The formatted answer.
    """
    answer_val = ""
    if answer_format == "letter":
        answer_val += get_alphabet_letter(idx) + ". "
    elif answer_format == "number":
        answer_val += f"{idx}. "

    answer_val += str(strip_html(answer))
    if exclude_wrapper_tag:
        return answer_val
    else:
        return f"<answer>{answer_val}</answer>"


def get_alphabet_letter(idx: int) -> str:
    """
    Returns the alphabet letter for the given index.

    Args:
        idx (int): The index.

    Returns:
        str: The alphabet letter.
    """
    return chr(idx + 65)


def format_correct_answer_value(answer: str, answer_format: str, answers: list):
    """
    Formats the correct answer data based on the provided answer output type

    Args:
        answer (str): The answer value.
        answer_format (str): The format of the answer.
        answers (dict): The dictionary of answers.

    Returns:
        str: The formatted correct answer.
    """
    idx = -1
    for answer_val in answers:
        idx += 1
        if answer_val["answer"] == answer:
            break
    return format_answer_value(answer, answer_format, idx, True)


def generate_bedrock_prompts_q_and_a(
    data: pd.DataFrame, answer_choices_format: str
) -> list[dict]:
    """
    Generates prompt data for each row in the DataFrame.

    Args:
        data (pd.DataFrame): The DataFrame containing the Q&A data.

    Returns:
        list[dict]: The generated prompts.
    """
    prompts = []
    for _, row in data.iterrows():
        prompt = {
            "prompt": (
                f"<question>{strip_html(row['question'])}</question>\n"
                + "\n".join(
                    format_answer_value(
                        answer_data["answer"], answer_choices_format, idx
                    )
                    for idx, answer_data in enumerate(row["answers"])
                )
                + "<instructions>"
                + (
                    f"\nPlease response with the correct {answer_choices_format} and answer value"
                    if answer_choices_format
                    else "\nPlease respond with the correct answer choice value."
                )
                + "</instructions>"
            ),
            "referenceResponse": format_correct_answer_value(
                row["correct_answer"], answer_choices_format, row["answers"]
            ),
            "category": row["category"],
        }
        prompts.append(prompt)
    return pd.DataFrame.from_records(prompts)


def generate_bedrock_prompts(
    data: pd.DataFrame,
    included_columns,
    expected_response,
    category,
    instruction,
    categories_input=None,
):
    """
    Generates prompt data for each row in the DataFrame.

    Args:
        data (pd.DataFrame): The DataFrame containing the text data.

    Returns:
        pd.DataFrame: The generated prompts.
    """
    print(f"generate_bedrock_prompts data = {data}")
    if expected_response:
        included_columns = [
            col for col in included_columns if col not in [expected_response, category]
        ]
        data = data.rename(columns={expected_response: "referenceResponse"})
    if category and not categories_input:
        data = data.rename(columns={category: "category"})
    elif category and categories_input:
        data.insert(0, "category", data["referenceResponse"])
    data.insert(
        0,
        "prompt",
        data[included_columns]
        .astype(str)
        .apply(
            lambda x: strip_html(x),
            axis=1,
        )
        .apply("\n".join, axis=1),
    )
    data["prompt"] = (
        "<text>"
        + data["prompt"].astype(str)
        + "</text>"
        + (f"<categories>{categories_input}</categories>" if categories_input else "")
        + f"<instruction>{instruction}</instruction>"
    )
    print(data["prompt"])
    return pd.DataFrame(
        data[["prompt", "referenceResponse", "category"]].to_dict("records")
    )


def get_download_data(dataframe: pd.DataFrame):
    """
    Returns the dataframe data for downloading

    """
    return dataframe.to_json(orient="records", lines=True)
