import os
import configparser
from dotenv import load_dotenv

load_dotenv()

# Load AWS credentials from ~/.aws/credentials if not in environment
def load_aws_credentials():
    """Load AWS credentials from ~/.aws/credentials file."""
    if not os.getenv('AWS_ACCESS_KEY_ID'):
        credentials_path = os.path.expanduser('~/.aws/credentials')
        if os.path.exists(credentials_path):
            config = configparser.ConfigParser()
            config.read(credentials_path)
            profile = os.getenv('AWS_PROFILE', 'default')
            if profile in config:
                os.environ['AWS_ACCESS_KEY_ID'] = config[profile].get('aws_access_key_id', '')
                os.environ['AWS_SECRET_ACCESS_KEY'] = config[profile].get('aws_secret_access_key', '')
                print(f"Loaded AWS credentials from profile: {profile}")

load_aws_credentials()

# AWS Configuration
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
os.environ['AWS_DEFAULT_REGION'] = AWS_REGION
NOVA_SONIC_MODEL_ID = os.getenv('NOVA_SONIC_MODEL_ID', 'amazon.nova-2-sonic-v1:0')

# Audio Configuration
INPUT_SAMPLE_RATE = 16000
OUTPUT_SAMPLE_RATE = 24000
CHANNELS = 1
CHUNK_SIZE = 1024

# Server Configuration
SERVER_HOST = os.getenv('SERVER_HOST', '0.0.0.0')
SERVER_PORT = int(os.getenv('SERVER_PORT', '3001'))
CORS_ORIGIN = os.getenv('CORS_ORIGIN', 'http://localhost:5173')

# Language Configuration
SUPPORTED_LANGUAGES = {
    'en-US': {
        'name': 'English (US)',
        'voice_id': 'matthew',
        'flag': '🇺🇸'
    },
    'en-GB': {
        'name': 'English (UK)',
        'voice_id': 'matthew',
        'flag': '🇬🇧'
    },
    'en-AU': {
        'name': 'English (Australia)',
        'voice_id': 'matthew',
        'flag': '🇦🇺'
    },
    'en-IN': {
        'name': 'English (India)',
        'voice_id': 'matthew',
        'flag': '🇮🇳'
    },
    'es-US': {
        'name': 'Spanish (US)',
        'voice_id': 'pedro',
        'flag': '🇪🇸'
    },
    'fr-FR': {
        'name': 'French',
        'voice_id': 'lea',
        'flag': '🇫🇷'
    },
    'it-IT': {
        'name': 'Italian',
        'voice_id': 'giorgio',
        'flag': '🇮🇹'
    },
    'de-DE': {
        'name': 'German',
        'voice_id': 'hans',
        'flag': '🇩🇪'
    },
    'pt-BR': {
        'name': 'Portuguese (Brazil)',
        'voice_id': 'camila',
        'flag': '🇧🇷'
    },
    'hi-IN': {
        'name': 'Hindi',
        'voice_id': 'aditi',
        'flag': '🇮🇳'
    }
}

# Polyglot voices that can speak all languages
POLYGLOT_VOICES = ['tiffany', 'matthew']

# Default fallback language
DEFAULT_LANGUAGE = 'en-US'

# Helper functions
def get_language_config(locale: str) -> dict:
    """
    Get language configuration for a given locale.
    
    Args:
        locale: Language locale code (e.g., 'en-US')
        
    Returns:
        Dictionary with language configuration (name, voice_id, flag)
        Returns default language config if locale not found
    """
    return SUPPORTED_LANGUAGES.get(locale, SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE])

def get_voice_id(locale: str) -> str:
    """
    Get voice ID for a given locale.
    
    Args:
        locale: Language locale code (e.g., 'en-US')
        
    Returns:
        Voice ID string for the locale
    """
    config = get_language_config(locale)
    return config.get('voice_id', 'matthew')

def is_supported_language(locale: str) -> bool:
    """
    Check if a language locale is supported.
    
    Args:
        locale: Language locale code (e.g., 'en-US')
        
    Returns:
        True if locale is supported, False otherwise
    """
    return locale in SUPPORTED_LANGUAGES
