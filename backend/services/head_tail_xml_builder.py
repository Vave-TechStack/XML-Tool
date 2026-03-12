from xml.etree.ElementTree import Element, SubElement, ElementTree, register_namespace
import os

# Register the ce namespace
CE_NS = "http://www.elsevier.com/xml/common/dtd"
register_namespace('ce', CE_NS)

def build_head_tail_xml(parsed_refs, uid):
    """
    Builds the Elsevier-style XML for Head and Tail references.
    """
    # Create the root <tail> or <bibliography>
    # Since the sample showed <tail> wrapping <bibliography>
    tail = Element("tail")
    bib = SubElement(tail, "bibliography", {"refcount": str(len(parsed_refs))})
    
    for r in parsed_refs:
        ref = SubElement(bib, "reference", {"seq": str(r["seq"])})
        
        info = SubElement(ref, "ref-info")
        
        # 1. Title (Must be first in info per sample)
        title_grp = SubElement(info, "ref-title")
        title_text = SubElement(title_grp, "ref-titletext-english")
        title_text.text = r["title_english"] if r["title_english"] else ""
            
        # 2. Authors (Sequence starts with 1)
        authors_grp = SubElement(info, "ref-authors")
        for idx, a in enumerate(r["authors"], start=1):
            author = SubElement(authors_grp, "author", {"seq": str(idx)})
            # Initials first per sample
            init = SubElement(author, f"{{{CE_NS}}}initials")
            init.text = a["initials"] if a["initials"] else ""
            
            # Surname per sample
            sur = SubElement(author, f"{{{CE_NS}}}surname")
            sur.text = a["surname"] if a["surname"] else ""
                    
        # 3. Source Title (Italic text)
        src = SubElement(info, "ref-sourcetitle")
        src.text = r["source_title"] if r["source_title"] else ""
            
        # 4. Publication Year (Use 'first' attribute)
        year_val = r["year"] if r["year"] else ""
        year = SubElement(info, "ref-publicationyear", {"first": str(year_val)})
            
        # 5. Volume/Issue/Pages
        vis_grp = SubElement(info, "volisspag")
        
        vi_num = SubElement(vis_grp, "volume-issue-number")
        vol = SubElement(vi_num, "vol-first")
        vol.text = r["volume"] if r["volume"] else ""
        
        iss = SubElement(vi_num, "iss-first")
        iss.text = r["issue"] if r["issue"] else ""
                
        page_info = SubElement(vis_grp, "page-information")
        pages = SubElement(page_info, "pages")
        fp = SubElement(pages, "first-page")
        fp.text = r["fpage"] if r["fpage"] else ""
        
        lp = SubElement(pages, "last-page")
        lp.text = r["lpage"] if r["lpage"] else ""
                
        # 6. Ref Text (Any text after italic)
        rt = SubElement(info, "ref-text")
        rt.text = r["ref_text"] if r["ref_text"] else ""
            
        # 7. Overall Metadata
        fulltext = SubElement(ref, "ref-fulltext")
        fulltext.text = r["full_text"]
        
        source_text = SubElement(ref, f"{{{CE_NS}}}source-text")
        source_text.text = r["full_text"]

    # Output to file
    out_dir = "outputs"
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
        
    out_path = os.path.join(out_dir, f"head_tail_{uid}.xml")
    
    # Save with XML declaration
    with open(out_path, "wb") as f:
        # We need a custom way to handle the ce: prefix for namespaced elements
        # ElementTree.write does this if we used the register_namespace earlier
        tree = ElementTree(tail)
        tree.write(f, encoding="utf-8", xml_declaration=True)
        
    return out_path
