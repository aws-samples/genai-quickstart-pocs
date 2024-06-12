import streamlit as st
from logic import generate_bedrock_prompts, get_column_headers

prompt_instructions = [
    {
        "type": "Q&A",
        "prompt": "Respond with the correct answer from the choices provided.",
    },
    {"type": "Text Summarization", "prompt": "Summarize the text provided."},
    {"type": "General Text Generation", "prompt": "Generate a general text response."},
    {
        "type": "Classificaton",
        "prompt": "Classify the text provided using the included categories.",
    },
]


def main():
    if "tags_input" not in st.session_state:
        st.session_state["tags_input"] = ""
    if "tags" not in st.session_state:
        st.session_state["tags"] = []
    if "headers" not in st.session_state:
        st.session_state["headers"] = []
    if "disable_all" not in st.session_state:
        st.session_state["disable_all"] = False
    if "main_status_open" not in st.session_state:
        st.session_state["main_status_open"] = True
    if "main_status_state" not in st.session_state:
        st.session_state["main_status_state"] = "running"
    if "main_status_text" not in st.session_state:
        st.session_state["main_status_text"] = "Configure your data details"
    if "data_mapping_complete" not in st.session_state:
        st.session_state["data_mapping_complete"] = False
    st.title("Amazon Bedrock Model Evaluator")
    st.subheader(
        "Quickly convert your existing dataset into a Bedrock Model Evaluator promptset"
    )
    upload_form = st.status(
        "Select the CSV dataset file to use with Model Evaluator",
        expanded=True,
        state="running",
    )
    upload_form.subheader("Upload Data CSV")
    upload_form.info(
        "Select the CSV file that contains the data that will be used for model evaluation."
    )
    # Get configuration input from user
    csv_file = upload_form.file_uploader("Upload CSV file", type="csv")
    st.session_state["csv_file"] = csv_file

    if "csv_file" in st.session_state and st.session_state["csv_file"] is not None:
        mapping_form(csv_file, upload_form)

        if st.session_state["data_mapping_complete"] == True:
            create_output_form(csv_file)
    else:
        upload_form.update(expanded=True)


def create_output_form(csv_file):
    with st.status(
        "Configure your output file details", expanded=True, state="running"
    ) as output_form:
        output_form.subheader("Configure Output File")
        output_file = output_form.text_input(
            "Enter output file base name",
            value="output.jsonl",
            disabled=st.session_state["disable_all"],
        )
        # Run model evaluation when button is clicked
        if output_form.button(
            "Generate Model Evaluator Formatted Data",
        ):
            if csv_file:

                if st.session_state["prompt_type"] in [
                    "General Text Generation",
                    "Text Summarization",
                    "Classification",
                ]:
                    headers_dict = dict(
                        zip(
                            [vals["name"] for vals in st.session_state["headers"]],
                            [vals["id"] for vals in st.session_state["headers"]],
                        )
                    )

                    usable_columns = {
                        key: headers_dict[key]
                        for key, value in dict(
                            st.session_state["text_generation_columns"]
                        ).items()
                        if value
                    }
                else:
                    usable_columns = st.session_state["column_mapping"]
                try:
                    generate_bedrock_prompts(
                        csv_file.name,
                        output_file,
                        st.session_state["prompt_type"],
                        st.session_state["answer_choices_format"],
                        column_mapping=usable_columns,
                        final_instructions=st.session_state["added_instruction"],
                        include_column_names=(
                            st.session_state["include_column_names"] == "Yes"
                            if "include_column_names" in st.session_state
                            else False
                        ),
                        tags=st.session_state["tags"],
                        expected_response=(
                            st.session_state["expected_response"]
                            if "expected_response" in st.session_state
                            else None
                        ),
                    )
                    output_form.update(
                        label="Data generated successfully!",
                        state="complete",
                        expanded=False,
                    )
                    st.session_state['data_generated_successfully'] = True
                except Exception as e:
                    output_form.write(f"Error: {e}")
                    output_form.update(
                        label="Error!",
                        state="error",
                        expanded=False,
                    )
    if 'data_generated_successfully' in st.session_state and st.session_state['data_generated_successfully'] == True:
        st.success("Data generated successfully!")
        if st.button("Run Tool Again"):
            clear_session_state_values(csv_file)
            st.rerun()

def mapping_form(csv_file, upload_form):
    upload_form.update(
        label="CSV dataset file select", expanded=False, state="complete"
    )
    with st.status(
        "Configure your dataset details",
        expanded=st.session_state["main_status_open"],
        state=st.session_state["main_status_state"],
    ) as main_form:
        main_form.subheader("CSV File Properties")
        main_form.write(
            "To ensure all data is mapped properly, validate CSV file properties are accurate"
        )
        st.session_state["has_header_row"] = main_form.checkbox(
            "My CSV has file has a header row",
            value=st.session_state["has_header_row"] if "has_header_row" in st.session_state else None,
            disabled=st.session_state["disable_all"],
        )
        main_form.divider()
        main_form.subheader("Configure Model Evaluation Type")
        prompt_type = main_form.selectbox(
            "Select prompt type",
            [
                "Q&A",
                "Text Summarization",
                "General Text Generation",
                "Classification",
            ],
            index=None,
            disabled=st.session_state["disable_all"],
        )
        selected_instructions = []
        if prompt_type is not None:
            selected_instructions = []
            selected_instructions.append(None)
            for instruction in prompt_instructions:
                if instruction["type"] == prompt_type:
                    selected_instructions.append(instruction["prompt"])

        st.session_state["headers"] = get_column_headers(csv_file.name)
        if "column_mapping" not in st.session_state:
            st.session_state["column_mapping"] = {}
        st.session_state["answer_choices_format"] = None
        if prompt_type == "Q&A" and csv_file is not None:
            main_form.subheader("Configure Q&A Model Evaluation")
            main_form.info(
                "Map your CSV columns to fields needed for the prompt"
                if st.session_state["has_header_row"]
                else "Map the column value to the fields"
            )
            with main_form.container(border=True):
                st.session_state["column_mapping"]["question_id"] = create_dropdown(
                    st.session_state["headers"],
                    "Question ID",
                    "question_id",
                    drowndown_parent=main_form,
                )
                st.session_state["column_mapping"]["question"] = create_dropdown(
                    st.session_state["headers"], "Question", "question", main_form
                )
                st.session_state["column_mapping"]["answer"] = create_dropdown(
                    st.session_state["headers"], "Answer", "answer", main_form
                )
                st.session_state["column_mapping"]["is_corect"] = create_dropdown(
                    st.session_state["headers"],
                    "Is Correct Answer",
                    "is_correct",
                    main_form,
                )
                st.session_state["column_mapping"]["category"] = create_dropdown(
                    st.session_state["headers"], "Category", "category", main_form
                )

            main_form.divider()
            main_form.subheader("Configure your formatting of questions")
            st.session_state["answer_choices_format"] = main_form.radio(
                "Select answer choices format",
                ("letter", "number", "original"),
                index=0,
                format_func=lambda x: {
                    "letter": "Add lettering (A,B,C)",
                    "number": "Add numbering (1,2,3)",
                    "original": "Don't modify",
                }[x],
                disabled=st.session_state["disable_all"],
            )
        elif (
            prompt_type
            in ["Text Summarization", "General Text Generation", "Classification"]
            and csv_file is not None
        ):
            main_form.subheader(f"Configure {prompt_type} Model Evaluation")

            main_form.write(
                "Which columns should be included in the prompt for model evaluation?"
            )
            if (
                prompt_type
                in ["Text Summarization", "Classification", "Classification"]
                and st.session_state["has_header_row"]
            ):
                st.session_state["include_column_names"] = main_form.radio(
                    "Include columns names with data?",
                    ("Yes", "No"),
                    index=1,
                    disabled=st.session_state["disable_all"],
                    help="Choose whether to include column names with the data or not.",
                )

            st.session_state["expected_response"] = create_dropdown(
                st.session_state["headers"],
                "Which column contains the expected response from the model?",
                "expected_response",
                drowndown_parent=main_form,
            )

            with main_form.container(border=True):
                st.session_state["text_generation_columns"] = {}
                for i, column in enumerate(st.session_state["headers"]):
                    st.session_state["text_generation_columns"][column["name"]] = main_form.checkbox(
                        column["name"], key=f"column-checkbox-{column['name']}",
                        value=st.session_state["text_generation_columns"][column["name"]].value if column["name"] in st.session_state["text_generation_columns"] else None
                    )
            if prompt_type == "Classification":
                with main_form.container(border=True):
                    st.session_state["tags_input"] = main_form.text_input(
                        "Enter the categories for the classification (comma seperated)",
                        help="Example: Dog, Cat, Chicken",
                        value=(
                            st.session_state["tags_input"]
                            if "tags_input" in st.session_state
                            else ""
                        ),
                        placeholder="Dog, Cat, Chicken",
                    )
                    # Split the string by comma and trim the elements
                    tags = [
                        tag.strip() for tag in st.session_state["tags_input"].split(",")
                    ]

                    # Remove any empty elements and duplicates
                    unique_tags = list(set(tag for tag in tags if tag))

                    # Update the session state with the unique tags
                    st.session_state["tags"] = unique_tags

                    for tag in st.session_state["tags"]:
                        main_form.markdown(
                            f"<span style='background-color:#e6e6e6;padding:5px 10px;border-radius:20px;margin-right:5px;'>{tag}",
                            unsafe_allow_html=True,
                        )

        st.session_state["added_instruction"] = main_form.selectbox(
            "Should a final instruction be added to the prompts?",
            selected_instructions,
            index=None,
            disabled=st.session_state["disable_all"],
        )
        if main_form.button("Data Mapping Complete", key="Data-Mapping-Complete"):
            main_form.update(
                label="Mapping complete",
                state="complete",
                expanded=False,
            )
            st.session_state["data_mapping_complete"] = True
            st.session_state["prompt_type"] = prompt_instructions
            st.session_state["data_mapping_complete"] = True
            return True

        if (
            "data_mapping_complete" in st.session_state
            and st.session_state["data_mapping_complete"]
        ):
            main_form.update(
                label="Mapping complete",
                state="complete",
                expanded=False,
            )
            st.session_state["data_mapping_complete"] = True
            st.session_state["prompt_type"] = prompt_instructions
            st.session_state["data_mapping_complete"] = True
            return True


def create_dropdown(options, label, name, drowndown_parent=None):
    """
    Creates a dropdown with the given options and label.
    """
    # Get an array of all the options Ids
    option_values = [option.get("id") for option in options]
    format_func = lambda x: {
        option.get("id"): option.get("name") for option in options
    }[x]
    if drowndown_parent:
        return drowndown_parent.selectbox(
            label,
            option_values,
            format_func=format_func,
            key=f"key-{name}",
            index=None,
            disabled=st.session_state["disable_all"],
        )

    return st.selectbox(
        label,
        option_values,
        format_func=format_func,
        key=f"key-{name}",
        index=None,
        disabled=st.session_state["disable_all"],
    )

def clear_session_state_values(csv_file):
    """
    Resets the session state values
    """
    del csv_file
    for key in st.session_state.keys():
        print(f"deleting {key}")
        del st.session_state[key]
    st.rerun()

if __name__ == "__main__":
    main()
