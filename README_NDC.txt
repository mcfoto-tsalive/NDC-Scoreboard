NDC live scoreboard files

Files:
- ndc_tv.html: TV version
- ndc_mobile.html: phone version
- scores.csv: sample/exported CSV for testing

How to use on GitHub Pages:
1. Create one repo for the TV page and upload ndc_tv.html renamed to index.html.
2. Create one repo for the mobile page and upload ndc_mobile.html renamed to index.html.
3. In each index.html, find this line near the top of the script:
   const CSV_URL = 'scores.csv';
4. Replace scores.csv with the published Google Sheets CSV link for the live sheet.
5. Commit the file. The page will refresh automatically every 30 seconds.

Alternative: upload a file called scores.csv beside index.html, but that requires re-uploading the CSV after every score update. The published Google Sheet CSV is better.

Colour scheme:
- Dark TSA-style navy background
- Blue panels
- Red TSA accent line
- White text
- Gold totals
- Green winning highlight
