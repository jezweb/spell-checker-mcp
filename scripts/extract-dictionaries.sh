#!/bin/bash
# Extract dictionary files from node_modules for manual R2 upload

echo "📦 Extracting dictionary files from node_modules..."
echo ""

# Create upload directory
mkdir -p dictionaries-upload/dictionaries

# Counter
count=0

# Find all dictionary packages and copy their files
for pkg in node_modules/dictionary-*; do
  if [ -d "$pkg" ]; then
    pkg_name=$(basename "$pkg")
    lang_code="${pkg_name#dictionary-}"

    # Check if both files exist
    if [ -f "$pkg/index.aff" ] && [ -f "$pkg/index.dic" ]; then
      cp "$pkg/index.aff" "dictionaries-upload/dictionaries/${lang_code}.aff"
      cp "$pkg/index.dic" "dictionaries-upload/dictionaries/${lang_code}.dic"

      aff_size=$(du -h "$pkg/index.aff" | cut -f1)
      dic_size=$(du -h "$pkg/index.dic" | cut -f1)

      echo "  ✓ $lang_code ($aff_size + $dic_size)"
      ((count++))
    fi
  fi
done

echo ""
echo "═══════════════════════════════════════════"
echo "  EXTRACTION COMPLETE"
echo "═══════════════════════════════════════════"
echo "✅ Extracted: $count languages"
echo "📁 Location: dictionaries-upload/dictionaries/"
echo ""
echo "Next steps:"
echo "1. Go to Cloudflare Dashboard → R2 → spell-checker-dictionaries"
echo "2. Click 'Upload' button"
echo "3. Drag and drop all files from: dictionaries-upload/dictionaries/"
echo "4. Make sure files are uploaded to 'dictionaries/' folder in R2"
echo "═══════════════════════════════════════════"
