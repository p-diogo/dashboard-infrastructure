# Email Templates

This directory contains email templates for OTP authentication.

## Files

- `email.html` - HTML email template with The Graph branding
- `grt_logo.svg` - Placeholder logo (SVG format)

## Adding the Logo

The email template expects a PNG logo file at `grt_logo.png`. Currently, an SVG placeholder is provided.

To add the official The Graph logo:

1. Obtain the official `grt_logo.png` file (recommended size: 200x50px)
2. Convert `grt_logo.svg` to PNG if needed:
   ```bash
   # Using ImageMagick (if available)
   convert grt_logo.svg grt_logo.png

   # Using rsvg-convert (if available)
   rsvg-convert -o grt_logo.png grt_logo.svg
   ```
3. Place `grt_logo.png` in this directory

The logo will be automatically embedded in OTP emails as an inline image.
