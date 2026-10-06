import io
import qrcode
from qrcode.image.svg import SvgPathImage
from django.conf import settings
from django.core.files.base import ContentFile

def get_card_target_url(card_id, domain=None):
    base = domain or settings.PUBLIC_DOMAIN
    return f"{base.rstrip('/')}/go/{card_id}"

def generate_qr_png_bytes(card_id, domain=None, box_size=12, border=4):
    """
    Generates a print-ready, high-contrast, high-error-correction PNG for the card.
    Uses ERROR_CORRECT_H (approx 30% recovery) and adequate quiet zone.
    """
    url = get_card_target_url(card_id, domain)
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

def generate_qr_svg_bytes(card_id, domain=None):
    """
    Generates a print-ready vector SVG for the card.
    """
    url = get_card_target_url(card_id, domain)
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
        image_factory=SvgPathImage
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image()

    buffer = io.BytesIO()
    img.save(buffer)
    return buffer.getvalue()

def attach_qr_to_card(card, domain=None):
    """
    Generates and saves the PNG image to card.qr_image field.
    """
    png_data = generate_qr_png_bytes(card.card_id, domain)
    filename = f"qr_{card.card_id}.png"
    card.qr_image.save(filename, ContentFile(png_data), save=False)
