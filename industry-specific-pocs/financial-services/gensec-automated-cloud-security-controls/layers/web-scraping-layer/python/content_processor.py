"""
Content Processor
Utilities for processing and chunking AWS documentation content
"""

import re
import logging
from bs4 import BeautifulSoup
from typing import List

logger = logging.getLogger(__name__)


class ContentProcessor:
    """Utilities for processing AWS documentation content"""
    
    @staticmethod
    def extract_section_content(html_content: str, section_type: str) -> str:
        """
        Extract specific section content from HTML with smart DOM-based extraction
        
        Args:
            html_content: Raw HTML content
            section_type: Type of section to extract ('actions' or 'parameters')
            
        Returns:
            Cleaned text content from the section
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove unnecessary elements
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'form', 'button', 'input']):
                element.decompose()
            
            # Extract relevant section based on type using DOM structure
            if section_type == 'actions':
                return ContentProcessor._extract_actions_section(soup)
            elif section_type == 'parameters':
                return ContentProcessor._extract_parameters_section(soup, html_content)
            else:
                return soup.get_text(separator=' ', strip=True)
            
        except Exception as e:
            logger.error(f"Error extracting section content: {str(e)}")
            # Return original content if extraction fails
            return html_content
    
    @staticmethod
    def _extract_actions_section(soup):
        """Extract complete actions table or section using DOM structure"""
        # Find actions table by analyzing table headers
        actions_table = None
        tables = soup.find_all('table')
        
        for table in tables:
            headers = table.find_all(['th', 'td'])[:10]
            header_text = ' '.join([h.get_text().lower() for h in headers])
            if 'actions' in header_text and ('description' in header_text or 'access level' in header_text):
                actions_table = table
                break
        
        if actions_table:
            # Extract complete table with parent context
            parent_section = actions_table.find_parent(['section', 'div', 'main'])
            if parent_section:
                text_content = parent_section.get_text(separator=' ', strip=True)
            else:
                text_content = actions_table.get_text(separator=' ', strip=True)
            logger.info(f"Found complete actions table with {len(text_content)} characters")
        else:
            # Find actions section by heading
            text_content = soup.get_text(separator=' ', strip=True)
            actions_heading = None
            
            for heading in soup.find_all(['h1', 'h2', 'h3', 'h4']):
                if 'actions' in heading.get_text().lower():
                    actions_heading = heading
                    break
            
            if actions_heading:
                # Get content from actions heading to next major heading
                current = actions_heading
                content_parts = [actions_heading.get_text()]
                
                while current.next_sibling:
                    current = current.next_sibling
                    if hasattr(current, 'name'):
                        if current.name in ['h1', 'h2', 'h3'] and current != actions_heading:
                            break
                        content_parts.append(current.get_text(separator=' ', strip=True))
                
                text_content = ' '.join(content_parts)
                logger.info(f"Found actions section from heading with {len(text_content)} characters")
        
        return text_content
    
    @staticmethod
    def _extract_parameters_section(soup, html_content):
        """Extract complete parameters section from Syntax through Properties descriptions"""
        # Find complete sections by headings
        syntax_heading = None
        see_also_heading = None
        
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4']):
            heading_text = heading.get_text().lower()
            if 'syntax' in heading_text and not syntax_heading:
                syntax_heading = heading
            elif ('see also' in heading_text or 'return values' in heading_text) and syntax_heading:
                see_also_heading = heading
                break
        
        if syntax_heading:
            # Extract from Syntax to See Also (includes Properties section)
            current = syntax_heading
            content_elements = [syntax_heading]
            
            while current.next_sibling:
                current = current.next_sibling
                if hasattr(current, 'name'):
                    # Stop at See Also or Return Values (end of properties)
                    if current == see_also_heading or (current.name in ['h1', 'h2'] and
                        any(term in current.get_text().lower() for term in ['see also', 'return values', 'examples']) and
                        current != syntax_heading):
                        break
                    content_elements.append(current)
            
            # Create new soup with relevant content
            section_soup = BeautifulSoup('', 'html.parser')
            for element in content_elements:
                if hasattr(element, 'name'):
                    section_soup.append(element.extract())
            
            soup = section_soup
            logger.info(f"Extracted complete Properties section including descriptions")
        
        # Only remove very large code examples (>1000 chars with clear JSON structure)
        for code_block in soup.find_all(['pre', 'code']):
            code_text = code_block.get_text()
            if len(code_text) > 1000 and code_text.count('{') > 5 and code_text.count('"') > 10:
                code_block.decompose()
        
        return soup.get_text(separator=' ', strip=True)
    
    @staticmethod
    def smart_chunk_content(
        content: str,
        max_chunk_size: int,
        split_markers: List[str]
    ) -> List[str]:
        """
        Split content into chunks intelligently, preserving logical boundaries
        Never truncates mid-sentence or mid-entry
        
        Args:
            content: Text content to chunk
            max_chunk_size: Maximum size of each chunk in characters
            split_markers: List of markers to use as split points (in priority order)
            
        Returns:
            List of content chunks
        """
        if len(content) <= max_chunk_size:
            return [content]
        
        chunks = []
        current_pos = 0
        
        while current_pos < len(content):
            end_pos = min(current_pos + max_chunk_size, len(content))
            
            if end_pos >= len(content):
                chunks.append(content[current_pos:])
                break
            
            # Find best split point before end_pos
            best_split = end_pos
            for pattern in split_markers:
                split_pos = content.rfind(pattern, current_pos, end_pos)
                if split_pos > current_pos:
                    best_split = min(best_split, split_pos + len(pattern))
            
            # Fallback to sentence boundary
            if best_split == end_pos:
                sentence_end = content.rfind('. ', current_pos, end_pos)
                if sentence_end > current_pos:
                    best_split = sentence_end + 2
            
            chunks.append(content[current_pos:best_split])
            current_pos = best_split
        
        logger.info(f"Split content into {len(chunks)} chunks")
        return chunks
    
    @staticmethod
    def _split_long_line(
        line: str,
        max_size: int,
        split_markers: List[str]
    ) -> List[str]:
        """
        Split a long line using split markers
        
        Args:
            line: Line to split
            max_size: Maximum size per chunk
            split_markers: Markers to use for splitting
            
        Returns:
            List of line chunks
        """
        if len(line) <= max_size:
            return [line]
        
        chunks = []
        remaining = line
        
        while len(remaining) > max_size:
            # Try each split marker in order
            split_pos = -1
            
            for marker in split_markers:
                # Find the last occurrence of the marker within max_size
                search_text = remaining[:max_size]
                pos = search_text.rfind(marker)
                
                if pos > 0:
                    split_pos = pos + len(marker)
                    break
            
            # If no marker found, split at max_size
            if split_pos == -1:
                split_pos = max_size
            
            # Add chunk and continue with remainder
            chunks.append(remaining[:split_pos])
            remaining = remaining[split_pos:].lstrip()
        
        # Add the last piece
        if remaining:
            chunks.append(remaining)
        
        return chunks
    
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Clean and normalize text content
        
        Args:
            text: Text to clean
            
        Returns:
            Cleaned text
        """
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might cause issues
        text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        
        # Normalize line endings
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        # Remove excessive newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text.strip()
