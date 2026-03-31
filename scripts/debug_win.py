import requests, re, json

s = requests.Session()
s.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

s.get('https://www.patentisuperiori.com')
s.post('https://www.patentisuperiori.com/login/registrati.php', data={
    'username': 'andreadromi92',
    'password': '@Div44354',
    'tryToLog': 'true',
    'menu_login': 'true',
})

r = s.get('https://www.patentisuperiori.com/quiz-patente-c/argomento/dimensione-massa-velocita-1.html')
print('Status:', r.status_code)
print('imageSolution count:', r.text.count('imageSolution'))

with open('pag.html', 'w', encoding='utf-8') as f:
    f.write(r.text)
print('Salvato pag.html')

# Cerca immagini in modo diverso
idx = r.text.find('imageSolution')
if idx > 0:
    print('Contesto:', r.text[max(0,idx-200):idx+200])
else:
    print('imageSolution NON trovato nella pagina')
    print('Loggato?', 'logout' in r.text.lower())
