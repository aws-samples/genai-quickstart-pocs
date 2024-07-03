from typing import Optional, List

def total_tokens(tokens_list: List[str]) -> int:
    """
    Calculates the total number of tokens in a list of token tuples.

    Args:
        tokens_list (List[str]): A list of tuples, where each tuple contains a token and its count.

    Returns:
        int: The total number of tokens in the list.
    """
    total_tokens = 0
    for x in tokens_list:
        total_tokens += x[1]  # Add the count of each token to the total
    return total_tokens

def get_default_prompt(prompt_file: str) -> str:
    """
    Reads the contents of a file and returns it as a string with newline characters replaced by spaces.

    Args:
        prompt_file (str): The path to the file containing the prompt text.

    Returns:
        str: The contents of the file with newline characters replaced by spaces.
    """
    with open(prompt_file, 'r') as file:
        data = file.read().replace('\n', ' ')  # Read the file and replace newlines with spaces
    return data
