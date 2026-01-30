import os
from uuid import uuid4


file_dir = os.path.join(os.path.dirname(__file__), "..", "temp")
if not os.path.exists(file_dir):
    os.makedirs(file_dir)

def save_file(file):
    """
    Save a file to the temp directory and return the file path
    
    Args:
        file (FileStorage): The file to save
    
    Returns:
        str: The file path of the saved file
    """
    file_name = str(uuid4()) + "." + file.name.split(".")[-1]
    file_path = os.path.join(file_dir, file_name)
    with open(file_path, "wb") as f:
        f.write(file.getvalue())
    print(f"File saved to {file_path}")
    return file_path

def delete_file(file_path):
    """
    Delete a file
    
    Args:
        file_path (str): The path to the file to delete
    """
    os.remove(file_path)
