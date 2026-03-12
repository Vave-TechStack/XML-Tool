import fitz
import re
import os

def extract_head_tail_data(pdf_path):
    """
    Extracts reference-like blocks from a PDF and returns a list of parsed components.
    Uses fitz to detect italicized text for the 'source' rule.
    """
    doc = fitz.open(pdf_path)
    references = []
    
    # Simple heuristic to find references: look for "References" or "Bibliography"
    # or just start from the end of the document.
    found_ref_header = False
    ref_blocks = []
    
    total_pages = len(doc)
    for i, page in enumerate(doc):
        # Only start being "greedy" in the second half of the document if no header found
        is_last_half = (i + 1) > (total_pages / 2)
        
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            if "lines" not in b: continue
            
            block_text = ""
            spans_metadata = []
            
            for l in b["lines"]:
                for s in l["spans"]:
                    is_italic = bool(s["flags"] & 2)
                    spans_metadata.append({
                        "text": s["text"],
                        "italic": is_italic
                    })
                    block_text += s["text"] + " "
            
            block_text = block_text.strip()
            if len(block_text) < 10: continue
            
            # 1. Header Detection (Highest Priority)
            if not found_ref_header and re.search(r"(References|Bibliography|Literature Cited|Works Cited)", block_text, re.I):
                # Optimization: if it's just the word "References" in a small block, it's definitely a header
                if len(block_text) < 30:
                    found_ref_header = True
                    continue
            
            # 2. Reference Detection (Greedy Fallback)
            # - Starts with [1], 1., (1), or just "1 "
            # - Starts with "Surname, I." or "Surname I." or "I. Surname" (Uppercase Name followed by initials)
            is_citation_start = re.match(r"^(\[?\(?\d+\]?\)?[.\s]|([A-Z][a-z]+,\s*[A-Z]\.)|([A-Z]\.\s*[A-Z][a-z]+))", block_text)
            has_year = re.search(r"\((19|20)\d{2}\)", block_text)
            
            # If we found a header, or it looks like a citation, or it's a block in the end of the doc with a year
            if found_ref_header or is_citation_start or (is_last_half and has_year):
                ref_blocks.append({
                    "full_text": block_text,
                    "spans": spans_metadata
                })

    doc.close()
    
    parsed_results = []
    for idx, block in enumerate(ref_blocks, start=1):
        parsed_results.append(parse_rules(block, idx))
        
    return parsed_results

def parse_rules(block, seq):
    """
    Applies the user's specific rules:
    - Author: . -> initials, , -> surname
    - Year: (YYYY)
    - After Year: 
        - Non-italic -> ref-titletext-english
        - Italic -> ref-sourcetitle
    - After that: ref-text
    - Volume: number
    - Issue: number in parenthesis
    """
    full_text = block["full_text"]
    spans = block["spans"]
    
    result = {
        "seq": seq,
        "authors": [],
        "year": None,
        "title_english": "",
        "source_title": "",
        "volume": "",
        "issue": "",
        "fpage": "",
        "lpage": "",
        "ref_text": "",
        "full_text": full_text
    }
    
    # 1. Extract Year and Split
    year_match = re.search(r"\((\d{4})\)", full_text)
    year = ""
    prefix_text = full_text
    suffix_spans = spans
    
    if year_match:
        year = year_match.group(1)
        result["year"] = year
        # Split text into authors (before year) and the rest
        split_point = year_match.start()
        prefix_text = full_text[:split_point].strip()
        
        # We need to find where the suffix spans start in the metadata
        # (Simplified: filter spans that appear after the year in the sequence)
        pass # Handle below
    
    # 2. Parse Authors (Punctuation Rules)
    # Ends with . -> initials; Ends with , -> surname
    # We split the prefix into tokens by looking for . or ,
    author_parts = re.split(r"(?<=[.,])\s*", prefix_text)
    current_author = {"surname": "", "initials": ""}
    
    for part in author_parts:
        part = part.strip()
        if not part: continue
        
        if part.endswith("."):
            current_author["initials"] = part
            if current_author["surname"]:
                result["authors"].append(current_author)
                current_author = {"surname": "", "initials": ""}
            # If no surname yet, maybe initials came first? Keep for next part or add if it looks complete
        elif part.endswith(","):
            if current_author["surname"]: 
                # Already have a surname, push it and start new
                result["authors"].append(current_author)
                current_author = {"surname": part.rstrip(","), "initials": ""}
            else:
                current_author["surname"] = part.rstrip(",")
        else:
            # If it's a number followed by a name (e.g. "[1] Surname")
            cleaned_part = re.sub(r"^\[?\d+\]?[\.\s]*", "", part)
            if cleaned_part != part:
                current_author["surname"] = cleaned_part.strip()
            elif not current_author["surname"]:
                current_author["surname"] = part
            else:
                current_author["initials"] = part
                result["authors"].append(current_author)
                current_author = {"surname": "", "initials": ""}

    # Clean up last author if incomplete
    if current_author["surname"] or current_author["initials"]:
        result["authors"].append(current_author)

    # 3. Parse Title/Source/Volume/Issue (Strict Style Rules)
    # Stage 0: Title (Non-italic before first italic)
    # Stage 1: Source (Italic text)
    # Stage 2: Ref-Text (Everything after last italic)
    
    current_stage = 0 
    
    for s in spans:
        txt = s["text"].strip()
        if not txt: continue
        
        # Skip the author/year prefix if we are still at the start
        # Use year or author termination as heuristic
        
        # Heuristic: transition from Title to Source on first italic
        if current_stage == 0 and s["italic"]:
            current_stage = 1
            
        # Heuristic: transition from Source to Ref-Text on first non-italic AFTER some italics
        if current_stage == 1 and not s["italic"]:
            # Check if this non-italic is just a small punctuation or actually the next section
            if len(txt) > 3 or re.search(r"[a-zA-Z]", txt):
                current_stage = 2
                
        if current_stage == 0:
            # Check if we should skip author names already handled
            # (Crude check: if this span text matches prefix_text partly)
            result["title_english"] += " " + txt
        elif current_stage == 1:
            result["source_title"] += " " + txt
        else:
            result["ref_text"] += " " + txt

    # Extract Volume/Issue from the Ref Text or Title areas if missed
    # Issue: number in parenthesis (e.g., "(2)")
    issue_match = re.search(r"\((\d+)\)", full_text)
    if issue_match:
        result["issue"] = issue_match.group(1)

    # Volume: any number (that isn't year or issue)
    vol_match = re.search(r"\b(\d+)\b", full_text)
    if vol_match:
        val = vol_match.group(1)
        if val != result["year"] and val != result["issue"]:
            result["volume"] = val

    # Remove duplicates between title and authors
    # (Title usually starts after the year or last author)
    if prefix_text and isinstance(result["title_english"], str):
        result["title_english"] = result["title_english"].replace(prefix_text, "").strip()
    if result["year"] and isinstance(result["title_english"], str):
        result["title_english"] = result["title_english"].replace(f"({result['year']})", "").strip()
        result["title_english"] = result["title_english"].replace(str(result["year"]), "").strip()

    # 4. Clean up strings
    for key in ["title_english", "source_title", "ref_text"]:
        if isinstance(result[key], str):
            result[key] = result[key].strip().strip(".,")
    
    # 5. Page detection in ref_text
    ft = str(result["full_text"])
    page_match = re.search(r"(\d+)[–-](\d+)", ft)
    if page_match:
        result["fpage"] = page_match.group(1)
        result["lpage"] = page_match.group(2)
    elif re.search(r":\s*(\d+)", ft):
        result["fpage"] = re.search(r":\s*(\d+)", ft).group(1)

    print(f"DEBUG: Parsed Ref {seq} - Year: {result['year']}, TitleLen: {len(result['title_english'])}")
    return result
