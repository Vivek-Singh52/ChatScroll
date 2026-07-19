import re

text = open('index.html', 'r', encoding='utf-8').read()

how_to_match = re.search(r'(  <!-- HOW TO EXPORT -->.*?</section>\n)', text, re.DOTALL)
if how_to_match:
    how_to = how_to_match.group(1)
    # Remove it from its current position
    text = text.replace(how_to, '')
    
    # Insert it right before <!-- FEATURES -->
    features_marker = '  <!-- FEATURES -->'
    if features_marker in text:
        text = text.replace(features_marker, how_to + '\n' + features_marker)
        open('index.html', 'w', encoding='utf-8').write(text)
        print("Successfully moved how-to section!")
    else:
        print("Features marker not found.")
else:
    print("How-to section not found.")
