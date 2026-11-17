# CLAUDE.md — Secret

## Informations du projet
| | |
|---|---|
| Nom | Secret (album privé photos/vidéos) |
| Stack | Capacitor 8.6.2 + vanilla JS/CSS (`www/`), plugin natif Java `VaultPlugin` |
| applicationId | `com.bralexandre.secret` — **NE JAMAIS CHANGER** |
| Workflow APK | `.github/workflows/android.yml` (push sur toute branche + manuel) → artifact `Secret-v<versionName>-<versionCode>` (ZIP contenant l'APK, connexion GitHub requise) |
| Signature | Keystore PKCS12 permanent, alias `secret`, fourni par les secrets GitHub `SECRET_KEYSTORE_BASE64`, `SECRET_KEYSTORE_PASSWORD`, `SECRET_KEY_ALIAS`, `SECRET_KEY_PASSWORD`. Empreinte SHA-256 du certificat : `B5:C9:75:EB:78:82:0A:9E:7C:5C:64:D6:15:F3:B5:FD:F7:D2:7A:50:B5:33:F1:1B:D7:82:AA:C1:81:4C:AA:EB`. Sans ces secrets, le build échoue volontairement. |
| Versions | `versionCode` / `versionName` dans `android/app/build.gradle`. +1 sur `versionCode` à chaque APK distribué ; `versionName` en semver (1.0.0). |
| Données locales | Fichiers : `filesDir/vault/media` + `filesDir/vault/thumbs`. Métadonnées : `localStorage` clé `secret.db.v1` + copie `filesDir/vault/db.json` (restaurée si localStorage vide). Code PIN : `localStorage` clé `secret.pin` (hash SHA-256 salé). |

## Architecture
- `www/index.html` / `styles.css` / `app.js` : UI style iOS liquid glass (sombre). Police : Inter variable intégrée (`www/fonts/`, licence OFL), graisses renforcées façon iOS (SF Pro non redistribuable). `www/capacitor.js` = copie de `@capacitor/core` (régénérée par `npm run sync`).
- Écrans : verrou (empreinte + PIN, animation cadenas ≤ 2 s) → accueil (2 catégories renommables, couverture photo/vidéo) → catégorie (albums) → album (grille façon Photos, pincer = 2/3/5 colonnes, sélection) → visionneuse façon Photos iOS (ouverture/fermeture zoom depuis la miniature, pastille date, pellicule de miniatures (ne change de photo que sur geste utilisateur ; centrage instantané à l'ouverture), bouton Télécharger direct, favori, infos, couverture, swipe, zoom, glisser vers le bas, vidéos en boucle).
- Performance : visionneuse sur des aperçus 2560 px (`filesDir/vault/previews`, champ optionnel `preview`, créés à l'import ou à la volée via `ensurePreviews` ; pleine résolution seulement au zoom) ; rendus mis en cache par signature (`homeKey`, `el._key`) ; flou réduit, pas de blend-mode, pas de filtre animé sur les écrans.
- Pas de notifications toast : seulement un indicateur de progression centré (`#hud`) pendant import/export/téléchargement multiple.
- Ordre d'affichage par album : champ optionnel `sort` (`old` défaut, `new`, `added` = ordre de `a.items`, sans en-têtes de mois), menu « … » → Trier.
- Fluidité : pas de `backdrop-filter` sur les boutons/barres (fond translucide à la place), flou seulement sur feuilles/dialogues/menus ; `MainActivity` demande le taux de rafraîchissement maximal (HyperOS bride souvent les WebView à 60 Hz) et active `setOffscreenPreRaster` ; grille d'album rendue après l'animation d'ouverture si > 48 éléments (`el._defer`) ; aucun écouteur `touchmove` non passif hors glisser-sélection (sinon le défilement attend le JS).
- Vidéos : classe `vfade`, masquées jusqu'à la première image affichée (`playing` + `requestVideoFrameCallback`), miniature dessous (`.vposter`) ; pas d'attribut `poster` (images parasites sur WebView Android).
- Réglage `db.settings.stack` (défaut actif) : miniatures d'albums sur les cartes de catégorie.
- Tri Real / IA : champ optionnel `ai` sur chaque média ; filtre global `db.settings.kind` (`all`/`real`/`ai`, contrôle segmenté dans l'album, `viewItems`) ; bouton « IA » en sélection pour mentionner IA/Real ; badge « IA » sur les miniatures.
- Appui long : sur une photo = sélection directe (géré en événements tactiles, pas en pointer, pour éviter les annulations Android) (+ glisser pour étendre, pas de bouton « Sélectionner ») ; sur catégories et albums = menu contextuel avec aperçu (`contextMenu`) ; déplacer/ajouter vers un album (`moveMedia`, `pickAlbum`) ; sélection multiple par glissement + « Tout sélectionner » (aussi dans le menu « … » de l'album) ; déplacer un album vers l'autre catégorie.
- `android/app/src/main/java/com/bralexandre/secret/VaultPlugin.java` : `pickMedia` (copie dans le stockage privé + miniature + URI MediaStore d'origine), `deleteFromGallery` (Android 11+, `createDeleteRequest` : confirmation système, proposée après chaque import), `saveToGallery` (MediaStore → Pictures/Secret ou Movies/Secret), `deleteFiles`, `importZip` (UTF-8 puis CP437 ; dossier du ZIP → album), `exportZip` (→ Téléchargements/Secret, sans compression), `writeDb`/`readDb`, `biometricAvailable`/`authenticate`.
- `MainActivity` : enregistre le plugin. Captures d'écran autorisées (pas de `FLAG_SECURE`, demande utilisateur).
- Bouton retour Android géré via `history` (`openLayer` / `dismissLayer` dans `app.js`).

## Règles critiques (perte de données / mises à jour)
- Ne jamais modifier : `appId`, `server.androidScheme` (`https`) ni `server.hostname` (`localhost`) dans `capacitor.config.json` → sinon localStorage perdu (la copie `db.json` limite le risque).
- Ne jamais changer la structure de `secret.db.v1` sans migration (champ `v`).
- Ne jamais supprimer/renommer `filesDir/vault/*`. `allowBackup="false"` volontaire (vie privée).
- Ne jamais changer keystore/alias/certificat ; ne jamais générer une nouvelle clé si l'ancienne manque : signaler. Ne jamais commiter de `.jks`, mot de passe ou secret.
- Pas de désinstallation pour régler un problème de signature.

## Collaboration
- Réponses courtes en français. L'utilisateur décrit, Claude gère la technique.
- Modifications ciblées, réutiliser l'existant, pas de refonte d'écrans non concernés, pas de sous-agents ni d'analyses complètes répétées.
- Décision importante ou ambiguë : proposer brièvement et demander confirmation.
- Avant tout push : résumer les fichiers modifiés et demander une autorisation explicite. Ne supprimer ni historique, ni branche, ni données sans accord.
- Ne pas modifier le workflow sans nécessité expliquée. En cas d'échec de build : lire les erreurs utiles, corriger la cause, ne pas relancer en boucle.
- Design : cohérent, moderne, accessible, fluide ; priorité Xiaomi 17T Pro (encoches/caméra gérées via les safe areas `--sat/--sab/...`).

## Livraison de l'APK
- Après un build réussi, vérifier que l'APK existe, puis afficher en premier : **Télécharger l'APK : [lien]**, puis la version et un bref résumé.
- Artifact Actions = ZIP contenant l'APK, connexion GitHub requise, lien temporaire (30 j) : le dire, et donner le lien précis de l'artifact du run.
- GitHub Release (lien direct .apk) uniquement avec autorisation explicite. Ne jamais inventer d'URL.
