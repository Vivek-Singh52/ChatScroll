import re

text = open('index.html', 'r', encoding='utf-8').read()

start_marker = '  <!-- TOP CONTENT WRAPPER -->'
end_marker = '  </section>\n    </div>\n  </div>'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker, start_idx) + len(end_marker)

if start_idx != -1 and end_idx != -1:
    block = text[start_idx:end_idx]
    
    upload_match = re.search(r'(  <!-- UPLOAD -->.*?</label>\n  </div>)', block, re.DOTALL)
    how_to_match = re.search(r'(  <!-- HOW TO EXPORT -->.*?</section>)', block, re.DOTALL)
    
    if upload_match and how_to_match:
        upload = upload_match.group(1)
        how_to = how_to_match.group(1)
        
        # Restore styles for Upload
        upload = upload.replace('<div class="upload-section" id="upload-section" style="margin: 0; flex: 1; display: flex;">', '<div class="upload-section" id="upload-section">')
        upload = upload.replace('<label for="file-input" class="upload-card" id="drop-zone" style="display: flex; flex-direction: column; justify-content: center; margin: 0; max-width: 100%; height: 100%; box-sizing: border-box;">', '<label for="file-input" class="upload-card" id="drop-zone" style="display: block;">')
        
        # Restore styles for How-to
        how_to = how_to.replace('<section class="how-to" id="how-to-export-section" style="margin: 0; max-width: 100%; height: 100%;">', '<section class="how-to" id="how-to-export-section">')
        
        new_text = text[:start_idx] + '\n' + upload + '\n\n' + how_to + '\n' + text[end_idx:]
        open('index.html', 'w', encoding='utf-8').write(new_text)
        print("Successfully reverted layout!")
    else:
        print("Could not find blocks inside wrapper.")
else:
    print("Could not find wrapper boundaries.")
