"""
Prompt loader utility for EMR Log Analytics Chatbot
"""

import os
import yaml
from typing import Dict, Any


class PromptLoader:
    """Utility class for loading prompts from YAML files"""

    def __init__(self, prompts_dir: str = None):
        """Initialize the prompt loader with the prompts directory"""
        if prompts_dir is None:
            # Default to 'prompts' directory at app root level
            script_dir = os.path.dirname(os.path.abspath(__file__))
            app_root = os.path.dirname(script_dir)  # Go up from core/ to app/
            self.prompts_dir = os.path.join(app_root, 'prompts')
        else:
            self.prompts_dir = prompts_dir

        self.prompts = {}
        self._load_prompts()

    def _load_prompts(self):
        """Load all prompts from the prompts directory"""
        if not os.path.exists(self.prompts_dir):
            raise FileNotFoundError(f"Prompts directory not found: {self.prompts_dir}")

        for filename in os.listdir(self.prompts_dir):
            if filename.endswith('.yaml') or filename.endswith('.yml'):
                file_path = os.path.join(self.prompts_dir, filename)
                try:
                    with open(file_path, 'r') as f:
                        prompt_data = yaml.safe_load(f)
                        if 'name' in prompt_data and 'prompt' in prompt_data:
                            self.prompts[prompt_data['name']] = prompt_data
                except Exception as e:
                    print(f"Error loading prompt file {filename}: {e}")

    def get_prompt(self, name: str) -> str:
        """Get a prompt by name"""
        if name not in self.prompts:
            raise ValueError(f"Prompt not found: {name}")

        return self.prompts[name]['prompt']

    def format_prompt(self, name: str, metadata="") -> str:
        """Load a prompt and prepend metadata"""
        prompt_template = self.get_prompt(name)
        if metadata:
            # amazonq-ignore-next-line
            return f"{metadata}\n\n{prompt_template}"
        # Sanitize prompt template for XSS prevention
        import html
        safe_prompt = html.escape(prompt_template, quote=True)
        return safe_prompt

    def get_all_prompts(self) -> Dict[str, Any]:
        """Get all loaded prompts"""
        return self.prompts
