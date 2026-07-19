import re
text = open('index.html', 'r', encoding='utf-8').read()

start_marker = '  <!-- HOW TO EXPORT -->'
end_marker = '      </div>\n    </label>\n  </div>'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker, start_idx) + len(end_marker)

block = text[start_idx:end_idx]

how_to_match = re.search(r'(  <!-- HOW TO EXPORT -->.*?</section>)', block, re.DOTALL)
upload_match = re.search(r'(  <!-- UPLOAD -->.*?</div>\n    </label>\n  </div>)', block, re.DOTALL)

if how_to_match and upload_match:
    how_to = how_to_match.group(1)
    upload = upload_match.group(1)
    
    # modify styles to fit the flex container
    how_to = how_to.replace('<section class="how-to" id="how-to-export-section">', '<section class="how-to" id="how-to-export-section" style="margin: 0; max-width: 100%; height: 100%;">')
    upload = upload.replace('<label for="file-input" class="upload-card" id="drop-zone" style="display: block;">', '<label for="file-input" class="upload-card" id="drop-zone" style="display: flex; flex-direction: column; justify-content: center; margin: 0; max-width: 100%; height: 100%; box-sizing: border-box;">')
    upload = upload.replace('<div class="upload-section" id="upload-section">', '<div class="upload-section" id="upload-section" style="margin: 0; flex: 1; display: flex;">')

    new_block = '''  <!-- TOP CONTENT WRAPPER -->
  <div class="top-content-wrapper" style="display: flex; flex-wrap: wrap; gap: 40px; max-width: 1200px; margin: 0 auto 60px auto; padding: 0 20px; align-items: stretch; justify-content: center;">
    
    <!-- LEFT: UPLOAD -->
    <div style="flex: 1 1 450px; display: flex; flex-direction: column;">
''' + upload + '''
    </div>

    <!-- RIGHT: HOW TO EXPORT -->
    <div style="flex: 1 1 450px; display: flex; flex-direction: column;">
''' + how_to + '''
    </div>
  </div>'''
    
    new_text = text[:start_idx] + new_block + text[end_idx:]
    open('index.html', 'w', encoding='utf-8').write(new_text)
    print('Layout fixed!')
else:
    print('Failed to match inner blocks')
