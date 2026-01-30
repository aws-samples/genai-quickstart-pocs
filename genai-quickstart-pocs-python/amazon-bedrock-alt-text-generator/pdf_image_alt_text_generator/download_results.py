import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet
import base64
from io import BytesIO
import os
from uuid import uuid4
from pypdf import PdfMerger, PdfReader, PdfWriter
from reportlab.platypus import Table, TableStyle
import logging

logger = logging.getLogger(__name__)


def generate_pdf(alt_text_results):
    try:
        logger.debug("Starting PDF Generation")
        if not os.path.exists("files"):
            os.makedirs("files")
        rand = str(uuid4())
        output_path = os.path.join("files", rand)
        logger.debug(f"Output path = {output_path}")
        os.makedirs(output_path, exist_ok=True)
        styles = getSampleStyleSheet()
        style = styles["Normal"]
        file_name = f"{output_path}/output.pdf"
        c = canvas.Canvas(file_name, pagesize=letter)
        width, height = letter
        y_position = height - 40  # Start from the top of the page
        logger.debug("Starting to iterate over results")
        x = 0
        for result in alt_text_results:
            x += 1
            try:
                logger.debug(
                    f"Current result page = {result['page']} with type {type(result['page'])}"
                )
                if "image" in result:
                    image_data = result["image"]
                    # Remove the data URL prefix if present
                    if isinstance(image_data, str) and image_data.startswith(
                        "data:image"
                    ):
                        image_data = image_data.split(",")[1]
                    image_data = base64.b64decode(image_data)
                    image = ImageReader(BytesIO(image_data))
                    image_width = 200
                    image_height = 200
                    w, h = image.getSize()
                    image_aspect_ratio = w / h
                    if image_aspect_ratio > 1:
                        image_width = min(image_width, width)
                        image_height = image_width / image_aspect_ratio
                    else:
                        image_height = min(image_height, height)
                        image_width = image_height * image_aspect_ratio
                    c.drawImage(
                        image,
                        40,
                        y_position - 175,
                        width=image_width,
                        height=image_height,
                    )
                    text_y_position = (
                        y_position - 50
                    )  # Adjust text position below the image
                else:
                    c.drawString(40, y_position, "Error displaying image")
                    text_y_position = y_position

                c.drawString(250, text_y_position, f"Image Number: {x}")
                text_y_position = text_y_position - 20

                if "page" in result:
                    try:
                        page_number = result["page"] + 1
                        c.drawString(
                            250, text_y_position, f"Page Number: {page_number}"
                        )
                    except Exception as e:
                        logger.error("Page number error!", e)
                    finally:
                        text_y_position -= 70

                else:
                    c.drawString(
                        250, text_y_position - 20, "Error generating page number"
                    )

                if "alt_text" in result:
                    alt_text = result["alt_text"]
                    p = Paragraph(alt_text, style)
                    p.wrapOn(c, 300, 200)  # Wrap the text within a width of 300
                    p.drawOn(c, 250, text_y_position)
                    text_y_position -= 20  # Adjust for the next line of text
                else:
                    c.drawString(250, text_y_position, "Error generating alt text")

                if "score" in result:
                    c.drawString(
                        250,
                        text_y_position - 20,
                        f"Confidence Score: {result['score']}",
                    )
                    text_y_position -= 20
                else:
                    c.drawString(
                        250, text_y_position - 20, "Error generating confidence score"
                    )
                    text_y_position -= 20

                if "metadata" in result:
                    p = Paragraph(
                        f"Metadata\n\n{json.dumps(result['metadata']['usage'])}", style
                    )
                    p.wrapOn(c, 300, 200)  # Wrap the text within a width of 300
                    p.drawOn(c, 250, text_y_position - 50)
                    text_y_position -= 50
                else:
                    c.drawString(250, text_y_position - 20, "Error generating metadata")

                # Draw a divider line
                c.setStrokeColor(colors.black)
                c.setLineWidth(1)
                c.line(40, text_y_position - 30, width - 40, text_y_position - 30)

                y_position -= 300  # Move down for the next image and text

                if y_position < 250:  # Check if we need to add a new page
                    c.showPage()
                    y_position = height - 40

            except Exception as e:
                print(f"Error adding image to PDF: {e}")

        headers = ["Image Number", "Prompt Tokens", "Completion Tokens", "Total Tokens"]

        table_data = []
        x = 0
        for result in alt_text_results:
            x += 1
            try:
                image_number = x
                metadata = result.get("metadata", None)
                if metadata is not None:
                    usage = metadata.get("usage", None)
                    if usage is not None:
                        prompt_tokens = int(usage.get("prompt_tokens", 0))
                        completion_tokens = int(usage.get("completion_tokens", 0))
                        total_tokens = int(usage.get("total_tokens", 0))
                        table_data.append(
                            [image_number, prompt_tokens, completion_tokens, total_tokens]
                        )
            except Exception as e:
                logger.error("Error adding record to PDF", e)
        total_prompt_tokens = sum([data[1] for data in table_data if data[1]])
        total_completion_tokens = sum([data[2] for data in table_data if data[2]])
        total_total_tokens = sum([data[3] for data in table_data if data[3]])
        table_data.append(
            [
                "GRAND TOTAL",
                total_prompt_tokens,
                total_completion_tokens,
                total_total_tokens,
            ]
        )

        table_style = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.gray),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 12),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ]

        table = Table([headers] + table_data[:30])  # Select the first 50 rows
        table.setStyle(TableStyle(table_style))
        table_width, table_height = table.wrapOn(
            c, width, height
        )  # Calculate table dimensions
        table_x = (width - table_width) / 2  # Calculate table position
        table_y = y_position - table_height - 50
        c.showPage()  # Add a new page
        table.drawOn(c, table_x, table_y)  # Draw the table on the canvas

        if len(table_data) > 30:  # Check if there are more than 50 rows
            c.showPage()  # Add a new page
            y_position = height - 40  # Reset the y_position
            remaining_table_data = table_data[30:]  # Get the remaining rows
            while remaining_table_data:  # Iterate until all rows are processed
                table = Table(
                    [headers] + remaining_table_data[:30]
                )  # Select the next 50 rows
                table.setStyle(TableStyle(table_style))
                table_width, table_height = table.wrapOn(
                    c, width, height
                )  # Calculate table dimensions
                table_x = (width - table_width) / 2  # Calculate table position
                table_y = y_position - table_height - 50
                table.drawOn(c, table_x, table_y)  # Draw the table on the canvas

                if (
                    len(remaining_table_data) > 30
                ):  # Check if there are more than 30 rows remaining
                    c.showPage()  # Add a new page
                    y_position = height - 40  # Reset the y_position
                    remaining_table_data = remaining_table_data[
                        30:
                    ]  # Get the remaining rows
                else:
                    break  # Exit the loop if there are no more rows remaining

        # Draw the grand total
        c.save()

        print(f"PDF saved to {file_name}")
        return file_name
    except Exception as e:
        logger.error(e)


def create_merged_pdf(input_pdf, alt_text_pdf):
    merger = PdfMerger()
    merger.append(PdfReader(input_pdf))
    merger.append(PdfReader(alt_text_pdf))
    output_pdf = f"files/{uuid4()}_merged.pdf"
    merger.write(output_pdf)
    return output_pdf
