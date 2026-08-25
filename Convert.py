#!/usr/bin/env python3
"""
pdf_to_docx_ocr.py — Batch-convert a folder of scanned/photographed question
paper PDFs into editable Word (.docx) files using local OCR (Tesseract).

This gives you REAL, selectable, editable text instead of an image-in-a-PDF.
Note: OCR is good at plain text but NOT reliable for math symbols
(∑, ∫, superscripts, fractions, Greek letters). Expect to manually fix
formula lines after conversion — the script flags likely formula lines
with a "[CHECK FORMULA]" marker so you can find them fast.

USAGE:
    python pdf_to_docx_ocr.py --input "path/to/pdf_folder" --output "path/to/output_folder"

Requires (see requirements.txt):
    pip install pytesseract pdf2image python-docx opencv-python numpy pillow

Also requires two system programs (NOT installed via pip):
    1. Tesseract OCR engine
       - Windows: https://github.com/UB-Mannheim/tesseract/wiki (installer)
       - Mac:     brew install tesseract
       - Linux:   sudo apt install tesseract-ocr
    2. Poppler (needed for pdf2image to read PDFs)
       - Windows: https://github.com/oschwartz10612/poppler-windows/releases
                  (unzip, then pass its \\bin folder with --poppler-path)
       - Mac:     brew install poppler
       - Linux:   sudo apt install poppler-utils

If tesseract isn't on your PATH after installing (common on Windows), set:
    --tesseract-path "C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
"""

import argparse
import glob
import os
import re
import sys

import cv2
import numpy as np
import pytesseract
from pdf2image import convert_from_path
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

FORMULA_HINTS = re.compile(
    r"[∑∫√π≤≥≠∞±÷×∂∇θαβγλμσΔ]|"
    r"\^|_{|\\frac|\\int|\\sum|"
    r"\b[a-zA-Z]\s*=\s*[a-zA-Z0-9]|"
    r"\d\s*/\s*\d"
)


def preprocess_for_ocr(pil_img):
    """Clean up the page image so Tesseract reads it more accurately."""
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # upscale small scans, helps OCR accuracy a lot
    h, w = gray.shape
    if max(h, w) < 2000:
        scale = 2000 / max(h, w)
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 15)
    return thresh


def ocr_page(pil_img, lang="eng"):
    processed = preprocess_for_ocr(pil_img)
    config = "--oem 3 --psm 4"  # psm 4: assume a single column of text, varying sizes
    text = pytesseract.image_to_string(processed, lang=lang, config=config)
    return text


def looks_like_formula(line):
    return bool(FORMULA_HINTS.search(line))


def build_docx(pages_text, out_path, source_name):
    doc = Document()

    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title_p.add_run(f"[OCR draft — source: {source_name}]")
    run.italic = True
    run.font.size = Pt(9)

    note_p = doc.add_paragraph()
    note_run = note_p.add_run(
        "Note: This is a raw OCR conversion. Lines flagged [CHECK FORMULA] likely "
        "contain math symbols that OCR may have misread — verify against the original."
    )
    note_run.italic = True
    note_run.font.size = Pt(9)
    doc.add_paragraph()

    for page_num, text in enumerate(pages_text, start=1):
        if len(pages_text) > 1:
            hp = doc.add_paragraph()
            hr = hp.add_run(f"--- Page {page_num} ---")
            hr.bold = True
            hr.font.size = Pt(9)

        lines = [l.rstrip() for l in text.split("\n")]
        # collapse 3+ blank lines down to 1
        cleaned = []
        blank_run = 0
        for l in lines:
            if l.strip() == "":
                blank_run += 1
                if blank_run > 1:
                    continue
            else:
                blank_run = 0
            cleaned.append(l)

        for line in cleaned:
            if line.strip() == "":
                doc.add_paragraph()
                continue

            p = doc.add_paragraph()
            flagged = looks_like_formula(line)
            display_line = line.strip()

            is_heading = bool(re.match(r"^(Q\.?\s*\d|Q\d)", display_line, re.IGNORECASE))

            if flagged:
                r = p.add_run("[CHECK FORMULA] ")
                r.bold = True
                r.font.color.rgb = None  # keep default; highlight via bold + tag
            r2 = p.add_run(display_line)
            if is_heading:
                r2.bold = True

    doc.save(out_path)


def process_pdf(pdf_path, output_dir, poppler_path, lang):
    base = os.path.splitext(os.path.basename(pdf_path))[0]
    print(f"\n{base}:")
    try:
        images = convert_from_path(pdf_path, dpi=300, poppler_path=poppler_path or None)
    except Exception as e:
        print(f"  [!] Failed to open PDF: {e}")
        return

    pages_text = []
    for i, img in enumerate(images, start=1):
        print(f"  OCR page {i}/{len(images)} ...")
        text = ocr_page(img, lang=lang)
        pages_text.append(text)

    out_path = os.path.join(output_dir, f"{base}.docx")
    build_docx(pages_text, out_path, os.path.basename(pdf_path))
    print(f"  -> saved {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Batch OCR question-paper PDFs into editable docx.")
    parser.add_argument("--input", required=True, help="Folder containing PDF files")
    parser.add_argument("--output", required=True, help="Folder to save docx files")
    parser.add_argument("--lang", default="eng", help="Tesseract language code (default: eng)")
    parser.add_argument("--tesseract-path", default=None, help="Full path to tesseract.exe (Windows, if not on PATH)")
    parser.add_argument("--poppler-path", default=None, help="Path to poppler's bin folder (Windows, if not on PATH)")
    args = parser.parse_args()

    if args.tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = args.tesseract_path

    os.makedirs(args.output, exist_ok=True)

    pdfs = sorted(glob.glob(os.path.join(args.input, "*.pdf")))
    if not pdfs:
        print(f"No PDF files found in {args.input}")
        sys.exit(1)

    print(f"Found {len(pdfs)} PDF(s). Starting OCR batch...")

    for pdf_path in pdfs:
        process_pdf(pdf_path, args.output, args.poppler_path, args.lang)

    print(f"\nAll done. {len(pdfs)} docx file(s) saved to: {args.output}")
    print("Remember to review lines marked [CHECK FORMULA] against the original photos.")


if __name__ == "__main__":
    main()