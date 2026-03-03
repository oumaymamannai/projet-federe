# 🎓 GradFlow — Plateforme de Gestion des Soutenances

Interface bicolore : **Violet foncé (#2d1b69) + Violet pastel (#ede9fe)**

---

## ⚡ Installation rapide

### Prérequis
- Node.js v18+
- MySQL 8+

### 1. Base de données MySQL
```bash
mysql -u root -p < database.sql
```

### 2. Backend
```bash
cd backend
npm install
# Configurer .env (voir ci-dessous)
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

L'application sera disponible sur : **http://localhost:5173**

---

## ⚙️ Configuration `.env` Backend

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=VOTRE_MOT_DE_PASSE_MYSQL
DB_NAME=gradflow
JWT_SECRET=gradflow_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_app_password_gmail
EMAIL_FROM=GradFlow <votre_email@gmail.com>

FRONTEND_URL=http://localhost:5173
```

> **Note Gmail** : Activez la vérification en 2 étapes et créez un "App Password" sur https://myaccount.google.com/apppasswords

---

## 👥 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@gradflow.dz | Admin@1234 |
| Jury | jury1@gradflow.dz | Jury@1234 |
| Étudiant | etudiant1@gradflow.dz | Student@1234 |

> ⚠️ Les mots de passe dans database.sql sont des hashs bcrypt. Pour les utiliser, régénérez-les avec `bcrypt.hash("Admin@1234", 10)` ou utilisez les comptes pré-insérés directement.

**Pour générer de vrais hash bcrypt :**
```bash
cd backend
node -e "const b=require('bcryptjs'); b.hash('Admin@1234',10).then(h=>console.log(h))"
```
Puis remplacez dans database.sql.

---

## 🏗️ Architecture du projet

```
gradflow/
├── database.sql              # Script SQL complet
├── README.md
├── backend/
│   ├── .env                  # Variables d'environnement
│   ├── package.json
│   ├── server.js             # Point d'entrée Express
│   ├── config/
│   │   ├── db.js             # Pool MySQL
│   │   └── email.js          # Nodemailer templates
│   ├── middleware/
│   │   ├── auth.js           # JWT + roles
│   │   └── upload.js         # Multer
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── etudiantController.js
│   │   ├── juryController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── etudiant.js
│   │   ├── jury.js
│   │   └── admin.js
│   └── uploads/              # Fichiers uploadés (auto-créé)
└── frontend/
    ├── .env
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js
        ├── components/
        │   └── Sidebar.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── student/
            │   ├── Dashboard.jsx
            │   ├── Stage.jsx
            │   ├── Documents.jsx
            │   └── Reclamations.jsx
            ├── jury/
            │   ├── Planning.jsx
            │   └── Evaluations.jsx
            └── admin/
                ├── Dashboard.jsx
                ├── Soutenances.jsx
                ├── Jury.jsx
                ├── Reclamations.jsx
                └── Documents.jsx
```

---

## 🔐 Sécurité

- JWT avec expiration 7 jours
- Middleware de rôles (`verifyToken`, `requireRole`)
- Hash bcrypt pour les mots de passe
- Multer avec validation extension + taille (10MB max)
- CORS restreint au frontend

## 📡 API Endpoints

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

### Étudiant (JWT requis, rôle: etudiant)
- `GET /api/etudiant/soutenance`
- `POST /api/etudiant/stage` (multipart)
- `GET /api/etudiant/stage/soumissions`
- `POST /api/etudiant/reclamation`
- `GET /api/etudiant/reclamations`
- `GET /api/etudiant/documents`

### Jury (JWT requis, rôle: jury)
- `GET /api/jury/soutenances`
- `POST /api/jury/evaluer/:id`

### Admin (JWT requis, rôle: admin)
- `GET /api/admin/dashboard`
- `GET/POST /api/admin/soutenances`
- `GET /api/admin/jury`
- `POST /api/admin/jury/:id`
- `POST /api/admin/periode`
- `POST /api/admin/affecter-dates`
- `GET /api/admin/reclamations`
- `POST /api/admin/reclamations/:id/repondre`
- `POST /api/admin/resultat/:id/envoyer`
- `GET/POST /api/admin/documents`
- `PATCH /api/admin/documents/:id/toggle`
- `GET /api/admin/soumissions`
