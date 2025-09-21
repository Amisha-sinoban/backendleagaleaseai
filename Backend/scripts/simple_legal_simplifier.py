import os
import PyPDF2

def read_text_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return content
    except Exception as e:
        print(f"Error reading file: {e}")
        return None

def extract_text_from_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

def simplify_legal_text(legal_text):
    if not legal_text:
        return "No text to simplify."
    
    # Simple text simplification (basic version without AI)
    simplified = legal_text
    
    # Replace common legal terms
    replacements = {
        "hereinafter": "from now on",
        "whereas": "because",
        "notwithstanding": "despite",
        "pursuant to": "according to",
        "in accordance with": "following",
        "shall": "will",
        "may": "can",
        "must": "has to",
        "hereby": "by this",
        "thereof": "of it",
        "therein": "in it",
        "thereto": "to it",
        "whereby": "by which",
        "wherein": "in which",
        "whereof": "of which",
        "heretofore": "before now",
        "hereinbefore": "before this",
        "hereinafter": "after this",
        "aforesaid": "mentioned above",
        "aforementioned": "mentioned above",
        "indemnification": "protection from loss",
        "liability": "responsibility",
        "obligation": "duty",
        "breach": "violation",
        "remedy": "solution",
        "damages": "compensation",
        "warranty": "guarantee",
        "covenant": "promise",
        "provision": "rule",
        "clause": "section",
        "paragraph": "section",
        "subparagraph": "subsection",
        "schedule": "list",
        "exhibit": "attachment",
        "annex": "attachment",
        "appendix": "attachment"
    }
    
    for legal_term, simple_term in replacements.items():
        simplified = simplified.replace(legal_term, simple_term)
        simplified = simplified.replace(legal_term.capitalize(), simple_term.capitalize())
        simplified = simplified.replace(legal_term.upper(), simple_term.upper())
    
    # Add a simple header
    result = "=== SIMPLIFIED LEGAL DOCUMENT ===\n\n"
    result += "This is a simplified version of the legal document:\n\n"
    result += simplified
    result += "\n\n=== KEY TAKEAWAYS ===\n"
    result += "• This document contains legal terms and conditions\n"
    result += "• Please consult a lawyer for legal advice\n"
    result += "• This simplified version is for general understanding only\n"
    
    return result

def main():
    try:
        file_path = input().strip().strip('"')
        # Handle both absolute and relative paths
        if not os.path.isabs(file_path):
            # If it's a relative path, make it relative to the current working directory
            file_path = os.path.join(os.getcwd(), file_path)
        
        if not os.path.exists(file_path):
            print(f"Error: File '{file_path}' not found.")
            return
        
        file_ext = os.path.splitext(file_path)[1].lower()
        legal_text = ""
        
        if file_ext == '.pdf':
            legal_text = extract_text_from_pdf(file_path)
            if not legal_text:
                print("Error: Could not extract text from PDF.")
                return
        elif file_ext == '.txt':
            legal_text = read_text_file(file_path)
            if not legal_text:
                return
        else:
            print("Error: Unsupported file format. Please provide a PDF or TXT file.")
            return
        
        simplified_text = simplify_legal_text(legal_text)
        print(simplified_text)
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
