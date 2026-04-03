# Django DRF Order Manager
Applicazione web per la gestione degli ordini di magazzino.
Permette la creazione, visualizzazione, modifica ed eliminazione degli ordini tramite un'interfaccia web con API REST. 

## Tecnologie utilizzate
- Python / Django
- Django REST Framework
- Javascript / Axios
- Bootstrap 5
- SQLite

## Funzionalità
- CRUD completo degli ordini
- Visualizzazione clienti e prodotti
- API REST con DRF (ViewSets + Serializers)
- Interfaccia dinamica senza refresh della pagina

## Installazione
1) Clona ed entra nel repository:
```bash
git clone https://github.com/jadebo990/django-drf-order-manager.git
cd django-drf-order-manager
```

2) Crea e attiva il virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

3) Installa le dipendenze:
```bash
pip install -r requirements.txt
```

4) Crea il file .env copiando .env.example:
```bash
cp .env.example .env
```

5) Esegui le migrazioni:
```bash
python manage.py migrate
```

6) Avvia il server:
```bash
python manage.py runserver
```

## Autore
Andrea Monari - [GitHub](https://github.com/jadebo990) - [LinkedIn](https://www.linkedin.com/in/andrea-m-732176337)