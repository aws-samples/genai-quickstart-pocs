"""
Setup state manager for tracking application setup progress.
"""
import json
from pathlib import Path


class SetupState:
    """Manages setup state persistence."""
    
    def __init__(self):
        """Initialize setup state manager."""
        self.config_dir = Path.home() / '.genai_sales_analyst'
        self.state_file = self.config_dir / 'setup_state.json'
        self._ensure_config_dir()
    
    def _ensure_config_dir(self):
        """Create config directory if it doesn't exist."""
        self.config_dir.mkdir(exist_ok=True)
    
    def get_state(self):
        """Get current setup state."""
        if not self.state_file.exists():
            return self._get_default_state()
        
        try:
            with open(self.state_file, 'r') as f:
                return json.load(f)
        except:
            return self._get_default_state()
    
    def _get_default_state(self):
        """Get default setup state."""
        return {
            "setup_complete": False,
            "setup_option": None,
            "cluster_created": False,
            "data_loaded": False,
            "schema_indexed": False,
            "connection": {
                "host": "",
                "database": "",
                "schema": "",
                "user": "",
                "password": ""
            },
            "cluster_id": None,
            "bastion_id": None
        }
    
    def save_state(self, state):
        """Save setup state."""
        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)
    
    def update_state(self, **kwargs):
        """Update specific state fields."""
        state = self.get_state()
        state.update(kwargs)
        self.save_state(state)
    
    def update_connection(self, **kwargs):
        """Update connection details."""
        state = self.get_state()
        state['connection'].update(kwargs)
        self.save_state(state)
    
    def reset_state(self):
        """Reset setup state to default."""
        self.save_state(self._get_default_state())
    
    def is_setup_complete(self):
        """Check if setup is complete."""
        state = self.get_state()
        return state.get('setup_complete', False)
    
    def mark_setup_complete(self):
        """Mark setup as complete."""
        self.update_state(setup_complete=True)
