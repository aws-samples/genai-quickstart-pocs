from logic import (
    evaluation_type,
    evaluation_type_value,
    get_column_headers,
    select_columns,
    aggregate_q_and_a_records,
    generate_bedrock_prompts_q_and_a,
    generate_bedrock_prompts_text_summarization,
    get_download_data,
)
import streamlit as st
import pandas as pd
import math


prompt_instructions = [
    {
        "type": evaluation_type["QAndA"],
        "prompt": "Respond with the correct answer from the choices provided.",
    },
    {
        "type": evaluation_type["TextSummarization"],
        "prompt": "Summarize the text provided.",
    },
    {
        "type": evaluation_type["TextGeneration"],
        "prompt": "Generate a general text response.",
    },
    {
        "type": evaluation_type["Classification"],
        "prompt": "Classify the text provided using the included categories.",
    },
]


def get_upload_form(xkey):
    """
    Generates the upload form and returns the form and csv file uploaded in the form

    Returns:
        upload_form (st.form): The upload form
        csv_file (st.file_uploader): The CSV file uploaded
    """
    upload_form = st.status("Upload Data", expanded=True)
    upload_form.subheader("Upload Data CSV")
    upload_form.info(
        "Select the CSV file that contains the data that will be used for model evaluation."
    )
    # Get configuration input from user
    csv_file = upload_form.file_uploader(
        "Upload CSV file", type="csv", key=f"file_upload_{xkey}"
    )
    return (
        upload_form,
        csv_file,
    )


def get_prompt_type_from_value(promt_type_value):
    """
    Gets the prompt type from the value
    Args:
        promt_type_value (str): The value of the prompt type
    Returns:
        str: The prompt type
    """
    return evaluation_type_value.get(promt_type_value, None)


def get_base_configuration_form():
    base_config_form = st.status("Provide base configuration details", expanded=True)
    base_config_form.subheader("Base Configuration")
    base_config_form.info(
        "Configure the base settings for your model evaluation promptset."
    )
    has_header_row = base_config_form.checkbox(
        "CSV Data has Header Row",
        value=True,
        help="If the first row of the CSV are the column names, check this box. If there isn't a header row, uncheck this box.",
    )
    prompt_type_value = base_config_form.selectbox(
        "Prompt Type",
        evaluation_type.values(),
        index=None,
        help="Select the type of prompt you would like to use for your model evaluation.",
    )
    answer_choices_format = None
    if prompt_type_value == "Q&A":
        answer_choices_format = base_config_form.radio(
            "How should answers be formatted?",
            options=["original", "letter", "numbers"],
            format_func=lambda x: {
                "original": "Don't modify questions",
                "letter": "Map questions to letters (a, b, c, etc)",
                "numbers": "Map questions to numbers (1, 2, 3, etc)",
            }[x],
            index=None,
            help="How should the answer choices be formatted?",
        )
    prompt_type = get_prompt_type_from_value(prompt_type_value)
    return base_config_form, has_header_row, prompt_type, answer_choices_format


def get_q_and_a_form_data(headers, csv_data, answer_choices_format):
    """
    Gets the Q&A form data
    Args:
        headers (list): The column headers
        csv_data (pd.DataFrame): The CSV data

    Returns:
        dict: The form data
    """
    details_form = st.status("Provide Q&A details", expanded=True)
    details_form.subheader("Q&A Details")
    form_fields = {
        "question_id": details_form.selectbox(
            "Question ID Column",
            [option.get("name") for option in headers],
            index=None,
            help="Which column contains a question identifier? The identifier should be a column that has a unique value that is the same across all rows for the same question.",
        ),
        "question": details_form.selectbox(
            "Question Column",
            [option.get("name") for option in headers],
            index=None,
            help="Which column contains the question text?",
        ),
        "answer": details_form.selectbox(
            "Answer Column",
            [option.get("name") for option in headers],
            index=None,
            help="Which column contains the answer text?",
        ),
        "is_correct": details_form.selectbox(
            "Is Correct Column",
            [option.get("name") for option in headers],
            index=None,
            help="Which column indicates if the answer to the question is correct or not? This column should be 1/0 or true/false",
        ),
        "category": details_form.selectbox(
            "Category Column",
            [option.get("name") for option in headers],
            index=None,
            help="Which column contains the value use to categorize questions?",
        ),
    }

    if is_form_complete(form_fields):
        data = select_columns(csv_data, form_fields.values())
        data = data.rename(
            columns={
                form_fields["question_id"]: "question_id",
                form_fields["question"]: "question",
                form_fields["answer"]: "answer",
                form_fields["is_correct"]: "is_correct",
                form_fields["category"]: "category",
            }
        )
        data = aggregate_q_and_a_records(data)
        data = generate_bedrock_prompts_q_and_a(data, answer_choices_format)
        details_form.update(
            label="Q&A Mapping Complete", expanded=False, state="complete"
        )
        return data


def get_text_summarization_form_data(headers, csv_data):
    """
    Gets the form data for Text Summarization Prompt Type

    Args:
        headers (list): The column headers
        csv_data (pd.DataFrame): The CSV data

    Returns:
        dict: The form data
    """
    details_form = st.status("Provide Text Summarization details", expanded=True)
    details_form.subheader("Text Summarization Details")
    details_form.write(
        "Check the boxes of the columns you'd like included for text summarization"
    )
    form_fields = {}
    expected_response = details_form.selectbox(
        "Select the column that contains the expected answer",
        options=[option.get("name") for option in headers],
        index=None,
    )
    if expected_response:
        form_fields[expected_response] = True
    category = details_form.selectbox(
        "Select the column that contains the category",
        options=[option.get("name") for option in headers],
        index=None,
    )
    if category:
        form_fields[category] = True
    for header in headers:
        form_fields[header.get("name")] = details_form.checkbox(
            header.get("name"),
            value=False,
            disabled=(
                header.get("name") in [expected_response, category]
                if not None
                else False
            ),
            help=(
                "You cannot select this field for summary as it is currently selected as the field containing the expected answer from the LLM."
                if header.get("name") == expected_response
                else None
            ),
        )
    if details_form.button("Proceed"):
        form_fields[expected_response] = True
        if category:
            form_fields[category] = True
        data = select_columns(csv_data, [k for k, v in form_fields.items() if v])

        if is_form_complete(
            form_fields, must_complete_all_fields=False
        ) and is_form_complete(
            {"expected_response": expected_response, "category": category}
        ):

            data = generate_bedrock_prompts_text_summarization(
                data,
                [k for k, v in form_fields.items() if v],
                expected_response,
                category,
            )
            details_form.update(
                label="Text Summarization Mapping Complete",
                expanded=False,
                state="complete",
            )
            return data
    return None


def main():
    if "xkey" not in st.session_state:
        st.session_state.xkey = 0
    st.title("Amazon Bedrock Model Evaluator Data Prep")
    st.subheader(
        "Quickly convert your existing dataset into a Bedrock Model Evaluator promptset"
    )
    data: pd.DataFrame = None
    prompt_type = ""
    # First we want an upload form to allow the user to upload their data
    upload_form, csv_file = get_upload_form(st.session_state["xkey"])
    if csv_file is not None:
        upload_form.update(label="Data Uploaded", expanded=False, state="complete")
        base_config_form, has_header_row, prompt_type, answer_choices_format = (
            get_base_configuration_form()
        )
        if (
            prompt_type is not None
            and (prompt_type not in "QAndA")
            or (prompt_type == "QAndA" and answer_choices_format is not None)
        ):
            if has_header_row:
                headers = get_column_headers(csv_file.name)
            else:
                headers = None
            csv_data = pd.read_csv(
                csv_file, skip_blank_lines=True, header=0 if has_header_row else None
            )
            csv_data.dropna(how="all", inplace=True)
            match prompt_type:
                case "QAndA":
                    base_config_form.update(
                        label="Base Configuration Complete",
                        expanded=False,
                        state="complete",
                    )
                    data = get_q_and_a_form_data(
                        headers, csv_data, answer_choices_format
                    )
                    pass
                case "TextSummarization":
                    data = get_text_summarization_form_data(headers, csv_data)

                    pass
                case "TextGeneration":
                    pass
                case "Classification":
                    pass
    if data is not None:
        with st.status("Data Mapping Complete. Create files.", expanded=True):
            st.subheader("Data Mapping Complete")
            total_records = len(data)
            batch_size = 1000
            st.write(f"Prompts Generated: {total_records}")
            st.write(
                f"Download the prompt dataset {'file' if total_records <= batch_size else 'files'} to use within Amazon Bedrock Model Evaluator."
            )
            st.balloons()
            if len(data) > batch_size:
                st.warning(
                    "You have more than 1,000 prompts. Model Evaluator only supports 1,000 prompts per evaluation. To ensure files are generated in a way that is supported"
                    + "by Model Evaluator, multiple files will be created, with a maximum of 1,000 prompts per file."
                )
            for batch_idx in range(math.ceil(total_records / batch_size)):
                start_idx = batch_idx * batch_size
                end_idx = min(start_idx + batch_size, total_records)
                batch_data = data.iloc[start_idx:end_idx]
                append_file_text = f"_{batch_idx}" if len(data) > batch_size else ""
                append_button_text = (
                    f" ({batch_idx+1} of {math.ceil(total_records/batch_size)})"
                    if len(data) > batch_size
                    else ""
                )
                st.download_button(
                    f"Download Formatted Prompt Dataset{append_button_text}",
                    data=get_download_data(batch_data),
                    file_name=f"formatted_prompts_{prompt_type}{append_file_text}.jsonl",
                    key=f"formatted_prompts_{prompt_type}{append_file_text}.jsonl",
                    mime="application/json",
                )
        if st.button("Rerun Tool"):
            st.session_state["xkey"] += 1
            st.rerun()


def is_form_complete(form_fields: dict, must_complete_all_fields=True):
    """
    Checks if the form fields are complete

    Args:
        form_fields (dict): A dictionary mapping column names to column indices

    Returns:
        bool: True if the form fields are complete, False otherwise
    """
    if must_complete_all_fields:
        for field_value in form_fields.values():
            if field_value is None:
                return False
        return True
    else:
        for field_value in form_fields.values():
            if field_value is not None:
                return True


if __name__ == "__main__":
    main()
