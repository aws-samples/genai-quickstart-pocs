"""
Generic content processing utilities for AWS documentation extraction
"""
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

class ContentProcessor:
    """Generic content processing for AWS documentation"""
    
    @staticmethod
    def extract_section_content(html_content, section_type='actions'):
        """Extract complete sections from HTML without truncation"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove unnecessary elements
        for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'form', 'button', 'input']):
            element.decompose()
        
        if section_type == 'actions':
            return ContentProcessor._extract_actions_section(soup)
        elif section_type == 'parameters':
            return ContentProcessor._extract_parameters_section(soup, html_content)
        else:
            return soup.get_text(separator=' ', strip=True)
    
    @staticmethod
    def _extract_actions_section(soup):
        """Extract complete actions table or section"""
        # Find actions table
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
    def smart_chunk_content(content, max_size, split_patterns):
        """Split content at logical boundaries, never truncating mid-sentence"""
        if len(content) <= max_size:
            return [content]
        
        chunks = []
        current_pos = 0
        
        while current_pos < len(content):
            end_pos = min(current_pos + max_size, len(content))
            
            if end_pos >= len(content):
                chunks.append(content[current_pos:])
                break
            
            # Find best split point before end_pos
            best_split = end_pos
            for pattern in split_patterns:
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
        
        return chunks
