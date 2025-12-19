
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred, {
    'projectId': 'dindin-16493',
})

db = firestore.client()

doc_ref = db.collection('users').document('enomOP7DK5OHFMs6QK6jWIfGSV02')
doc_ref.set({
    'uid': 'enomOP7DK5OHFMs6QK6jWIfGSV02',
    'email': 'comatoukr@gmail.com',
    'name': 'dan',
    'role': 'admin',
    'companyId': 'LfvfHK3XIQMKjOo000GwSZG3Pb53'
})

print("User created successfully!")
