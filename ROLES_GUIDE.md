# 🎭 Système de Rôles - Organisateur vs Participant

## 📖 Vue d'ensemble

Le tournoi UNO dispose maintenant de deux modes d'accès distincts :

### 👑 Mode Organisateur
- **Accès complet** : Création, modification et gestion du tournoi
- **Contrôles administratifs** : Boutons d'action, édition des matchs
- **Sauvegarde et export** : Toutes les fonctonnalités de persistance
- **Interface** : `index.html` (avec sélecteur de rôle)

### 👁️ Mode Participant  
- **Lecture seule** : Visualisation du tournoi en temps réel
- **Synchronisation** : Mise à jour automatique des données
- **Interface simplifiée** : Sans boutons d'édition
- **Interface** : `participant.html`

## 🚀 Comment utiliser

### Démarrage
1. Ouvrir `index.html`
2. Choisir votre rôle au démarrage :
   - **👑 Organisateur** : Accès complet
   - **👁️ Participant** : Vue lecture seule

### Navigation entre les modes
- **Organisateur → Participant** : Bouton "👁️ Passer en Vue Participant"
- **Participant → Organisateur** : Bouton "👑 Passer en Mode Organisateur"

## 🔧 Fonctionnalités par mode

### Mode Organisateur ✅
- ✅ Créer un nouveau tournoi
- ✅ Modifier la liste des participants  
- ✅ Sélectionner les vainqueurs des matchs
- ✅ Sauvegarder/Charger/Exporter
- ✅ Imprimer les résultats
- ✅ Gérer l'avancement du tournoi
- ✅ Mode collaboration avec autres organisateurs

### Mode Participant 👁️
- ✅ Voir le tournoi en temps réel
- ✅ Suivre l'avancement des matchs
- ✅ Actualiser les données manuellement
- ✅ Imprimer (pour référence personnelle)
- ❌ Modifier les participants
- ❌ Changer les résultats des matchs
- ❌ Créer un nouveau tournoi
- ❌ Sauvegarder/Exporter

## 🔒 Sécurité et Permissions

### Protections en mode Participant
- **Boutons désactivés** : Les actions d'édition sont grisées
- **Champs en lecture seule** : Les inputs ne peuvent pas être modifiés
- **Blocage des clics** : Les matchs ne peuvent pas être sélectionnés
- **Messages d'alerte** : Notification quand une action est bloquée

### Synchronisation
- **Auto-sync** : Mise à jour toutes les 3 secondes en mode participant
- **Notifications** : Alertes quand le tournoi est modifié
- **Persistence** : Les données sont sauvegardées localement

## 📱 Interface Utilisateur

### Différences visuelles
- **Mode Organisateur** : En-tête bleu avec couronne 👑
- **Mode Participant** : En-tête vert avec œil 👁️
- **Indicateurs** : Labels "Lecture seule" sur les sections
- **Couleurs** : Thèmes distincts pour chaque mode

### Responsive
- Compatible mobile et desktop
- Interface adaptative selon l'écran
- Boutons tactiles optimisés

## 🌐 Collaboration Multi-Utilisateurs

### Scénarios d'utilisation

1. **Tournoi en Salle**
   - 1 Organisateur sur l'écran principal
   - Participants avec smartphones/tablettes en mode lecture

2. **Tournoi à Distance**
   - Organisateur partage son écran
   - Participants suivent via leur propre appareil

3. **Multi-Organisateurs**
   - Plusieurs personnes en mode organisateur
   - Synchronisation automatique entre eux

## 🔧 Installation et Configuration

### Fichiers nécessaires
```
index.html          # Interface principale avec sélecteur
participant.html    # Interface participant
script.js          # Logique JavaScript (modes intégrés)
style.css          # Styles avec thèmes pour les modes
```

### Lancement rapide
```bash
# Option 1 : Double-clic
Double-cliquer sur index.html

# Option 2 : Serveur local (pour collaboration)
python -m http.server 8000
# Puis ouvrir http://localhost:8000
```

## 💡 Conseils d'utilisation

### Pour les Organisateurs
- Utilisez le mode collaboration pour plusieurs organisateurs
- Sauvegardez régulièrement pendant le tournoi
- Exportez les résultats à la fin

### Pour les Participants
- Connectez-vous avec votre nom pour être identifié
- Utilisez le bouton "Actualiser" si la sync automatique échoue
- Le mode participant fonctionne même hors ligne (avec les dernières données)

### Pour l'Administration
- Changez les permissions en temps réel
- Basculez entre les modes selon les besoins
- Contrôlez qui peut modifier le tournoi

## 🐛 Résolution de Problèmes

### Problèmes fréquents
- **Sync qui ne fonctionne pas** : Vérifier la connexion réseau
- **Boutons grisés** : Vérifier que vous êtes en mode organisateur
- **Données non sauvegardées** : Actualiser la page et recharger

### Support
- Les données sont sauvegardées dans le navigateur (localStorage)
- En cas de problème, exporter/importer les données
- Compatible avec tous les navigateurs modernes

---

**Développé avec ❤️ par le Campus Norsys Agadir**  
*Innovation • Formation • Excellence Technologique*
