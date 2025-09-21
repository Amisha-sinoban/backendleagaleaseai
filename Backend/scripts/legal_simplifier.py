import google.generativeai as genai
import os
from dotenv import load_dotenv
import PyPDF2

load_dotenv()

# Configure the API key
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

def read_text_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return content
    except Exception as e:
        print(f"❌ Error reading file: {e}")
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
        print(f"❌ Error extracting text from PDF: {e}")
        return None

def simplify_legal_text(legal_text):
    if not legal_text:
        return "No text to simplify."
    prompt = f"""
    Act as a helpful legal assistant. Simplify the following legal text into plain, easy-to-understand English for someone without a legal background.

    STRICT RULES:
    1. Replace all complex legal jargon (e.g., "hereinafter," "indemnification") with simple synonyms.
    2. Break down long, complex sentences into short, clear ones.
    3. Summarize dense paragraphs into their core meaning.
    4. Use bullet points or numbered lists for obligations, rights, and key terms.
    5. DO NOT add any information not present in the original text. Do not provide legal advice.
    6. At the end, provide a simple list of "Key Takeaways".

    TEXT TO SIMPLIFY:
    {legal_text}
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"❌ Error during simplification: {e}"

def main():
    try:
        file_path = input().strip().strip('"')
        if not os.path.exists(file_path):
            print(f"❌ Error: File '{file_path}' not found.")
            return
        file_ext = os.path.splitext(file_path)[1].lower()
        legal_text = ""
        if file_ext == '.pdf':
            legal_text = extract_text_from_pdf(file_path)
            if not legal_text:
                print("❌ Could not extract text from PDF.")
                return
        elif file_ext == '.txt':
            legal_text = read_text_file(file_path)
            if not legal_text:
                return
        else:
            print("❌ Unsupported file format. Please provide a PDF or TXT file.")
            return
        simplified_text = simplify_legal_text(legal_text)
        print(simplified_text)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()


