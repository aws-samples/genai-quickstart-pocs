from dataclasses import dataclass
from typing import Dict, Any, Optional, List

@dataclass
class ImageTemplate:
    id: str
    name: str
    description: str
    parameters: Dict[str, Dict[str, Any]]
    examples: List[str] = None

    def __post_init__(self):
        if self.examples is None:
            self.examples = []

@dataclass
class ImageRequest:
    prompt: str
    parameters: Optional[Dict[str, Any]] = None
    style_options: Optional[Dict[str, Any]] = None