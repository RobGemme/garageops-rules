# GarageOps Rules — Instructions de déploiement
## De zéro à rules.garageops.ca

---

## ÉTAPE 1 — Télécharger et préparer les fichiers

1. Télécharge le fichier ZIP du projet
2. Décompresse-le sur ton ordinateur
3. Tu devrais voir un dossier `garageops-rules/`

---

## ÉTAPE 2 — Créer le repo GitHub

1. Va sur https://github.com et connecte-toi
2. Clique sur **"New repository"** (bouton vert)
3. Nom du repo : `garageops-rules`
4. Laisse tout le reste par défaut
5. Clique **"Create repository"**

---

## ÉTAPE 3 — Uploader les fichiers sur GitHub

**Option A — Via l'interface web GitHub (plus simple)**

1. Dans ton nouveau repo, clique **"uploading an existing file"**
2. Glisse-dépose tous les fichiers du dossier `garageops-rules/`
   ⚠️ IMPORTANT : Ne glisse PAS le fichier `.env` — il contient tes clés!
3. Clique **"Commit changes"**

**Option B — Via GitHub Desktop (si installé)**

1. Ouvre GitHub Desktop
2. File → Add Local Repository → sélectionne le dossier `garageops-rules/`
3. Commit → Push

---

## ÉTAPE 4 — Déployer sur Vercel

1. Va sur https://vercel.com et connecte-toi avec ton compte GitHub
2. Clique **"Add New Project"**
3. Sélectionne le repo `garageops-rules`
4. Vercel détecte automatiquement Vite/React — clique **"Deploy"**

### Ajouter les variables d'environnement dans Vercel

**AVANT de déployer**, dans la section "Environment Variables" :

| Nom | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | `https://mnqqlqcfpapomygrhvxs.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (ta clé anon complète) |

5. Clique **"Deploy"**
6. Dans 2-3 minutes, l'app est en ligne sur une URL Vercel (ex: `garageops-rules.vercel.app`)

---

## ÉTAPE 5 — Brancher le domaine rules.garageops.ca

### Dans Vercel

1. Va dans ton projet → **Settings → Domains**
2. Clique **"Add Domain"**
3. Entre : `rules.garageops.ca`
4. Vercel va te donner une valeur CNAME — copie-la

### Dans Hostinger (DNS)

1. Connecte-toi à Hostinger → **Domaines → garageops.ca → DNS**
2. Clique **"Ajouter un enregistrement"**
3. Remplis :
   - **Type** : CNAME
   - **Nom** : `rules`
   - **Valeur** : `cname.vercel-dns.com`
   - **TTL** : 3600 (ou Auto)
4. Sauvegarde

⏳ Attends 5-15 minutes pour la propagation DNS

### Le SSL

Vercel génère le certificat SSL **automatiquement** après que le DNS est propagé. Tu n'as rien à faire.

---

## ÉTAPE 6 — Tester

1. Ouvre https://rules.garageops.ca
2. Tu devrais voir l'interface GarageOps Rules
3. Crée une première règle pour tester
4. Va dans le Simulateur et teste un VIN

---

## En cas de problème

**Erreur "Failed to fetch" dans le simulateur**
→ Normal si tu testes en local. L'API NHTSA fonctionne sur Vercel.

**Page blanche après déploiement**
→ Vérifie que les variables d'environnement sont bien configurées dans Vercel

**DNS pas encore propagé**
→ Attends 15 minutes et réessaie. Parfois jusqu'à 24h dans les cas extrêmes.

---

## Contact
Pour toute question : info@garageops.ca
