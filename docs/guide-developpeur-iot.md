# Guide Développeur IoT — PRESENSE v2
## Intégration ESP32 avec la plateforme CORE TANGA GROUP

---

## Table des matières

1. [Architecture générale](#1-architecture-générale)
2. [Connexion MQTT](#2-connexion-mqtt)
3. [Topics MQTT — Convention et structure](#3-topics-mqtt--convention-et-structure)
4. [Flux de pointage RFID](#4-flux-de-pointage-rfid)
5. [Flux de statut / heartbeat](#5-flux-de-statut--heartbeat)
6. [Flux de mise à jour OTA (FOTA)](#6-flux-de-mise-à-jour-ota-fota)
7. [Codes de commande](#7-codes-de-commande)
8. [Correction critique — Double abonnement MQTT](#8-correction-critique--double-abonnement-mqtt)
9. [Identification du terminal](#9-identification-du-terminal)
10. [Checklist de conformité](#10-checklist-de-conformité)

---

## 1. Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                     HiveMQ Cloud                            │
│                   (broker MQTT TLS 8883)                    │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
   ┌───────────────────┐           ┌──────────────────────┐
   │   ESP32 RFID      │           │   Backend Laravel     │
   │   (PRESENSE V2)   │           │   (core-back)         │
   │                   │           │                       │
   │  Publie sur :     │           │  Souscrit sur :       │
   │  core/rfid/       │ ────────► │  core/rfid/           │
   │  sensor/{id}/event│           │  sensor/+/event       │
   │                   │           │                       │
   │  Souscrit sur :   │ ◄──────── │  Publie sur :         │
   │  core/rfid/       │           │  core/rfid/           │
   │  sensor/{id}/     │           │  sensor/{id}/response │
   │  response         │           │                       │
   │                   │           │  ET publie sur :      │
   │  [MANQUANT] ◄──── │ ◄──────── │  devices/{serial}/ota │
   │  devices/{id}/ota │           │  (commandes OTA)      │
   └───────────────────┘           └──────────────────────┘
```

**Important :** Le backend utilise deux canaux distincts vers l'ESP32 :
- `core/rfid/sensor/{id}/response` — réponses aux pointages + commandes générales
- `devices/{serial}/ota` — commandes de mise à jour firmware (OTA)

L'ESP32 actuel ne souscrit **pas** au topic OTA. Voir [section 8](#8-correction-critique--double-abonnement-mqtt).

---

## 2. Connexion MQTT

### Paramètres de connexion

| Paramètre   | Valeur                                          |
|-------------|------------------------------------------------|
| Host        | `fd286f0fca334917b338f6f5882a2763.s1.eu.hivemq.cloud` |
| Port        | `8883` (TLS obligatoire)                        |
| Protocol    | MQTT 3.1.1                                      |
| TLS         | Activé — certificat CA inclus dans `ca_cert.h`  |
| Username    | `perseus911`                                    |
| Password    | `Wemtinga2026@`                                 |
| Client ID   | Unique par terminal (ex: `presense-RFID-001`)   |
| Keep Alive  | 60 secondes                                     |

### Notes importantes

- Le TLS doit être configuré **avant** d'appeler `begin()` ou `connect()`.
- Le `ClientID` doit être unique pour chaque terminal physique. Si deux terminaux utilisent le même `ClientID`, le broker déconnectera l'un d'eux.
- Le buffer MQTT doit être agrandi à **1024 bytes minimum** pour accueillir les payloads JSON OTA :
  ```cpp
  client.setBufferSize(1024);
  ```

---

## 3. Topics MQTT — Convention et structure

### Structure des topics

```
core/rfid/sensor/{DEVICE_ID}/event      ← ESP32 publie (scan RFID)
core/rfid/sensor/{DEVICE_ID}/response   ← ESP32 souscrit (réponses + commandes)
devices/{DEVICE_ID}/ota                 ← ESP32 souscrit (commandes OTA)  [À AJOUTER]
devices/{DEVICE_ID}/ota/response        ← ESP32 publie (résultat OTA)     [À AJOUTER]
```

### Correspondance `DEVICE_ID` vs `serial_number`

Le `DEVICE_ID` dans les topics MQTT doit correspondre exactement au champ `serial_number` de l'appareil en base de données.

```
config.h → MQTT_DEVICE_ID = "RFID-001"
           ↕ doit être identique
base de données → rfid_devices.serial_number = "RFID-001"
```

Si ces deux valeurs ne correspondent pas, le backend ne retrouvera pas l'appareil et ne pourra pas associer les pointages ni mettre à jour le firmware.

---

## 4. Flux de pointage RFID

### Étape 1 — L'ESP32 détecte un badge et publie

**Topic :** `core/rfid/sensor/RFID-001/event`

**Payload JSON :**
```json
{
  "card_uid": "1A7B91AE"
}
```

- `card_uid` : UID de la carte RFID en hexadécimal majuscule, sans séparateurs (`:` retirés).
- Le backend accepte également le champ `uid` pour compatibilité legacy, mais `card_uid` est le format attendu.

**Code Arduino actuel (conforme) :**
```cpp
String uidClean = uid;
uidClean.replace(":", "");
String payload = "{\"card_uid\":\"" + uidClean + "\"}";
mqttController->publish(mqttController->getPublishTopic().c_str(), payload);
```

### Étape 2 — Le backend traite et répond

Le backend Laravel (`MqttListenRfidCommand`) :
1. Trouve l'appareil par `serial_number` et met à jour `is_online = true`
2. Vérifie que la carte existe et est active
3. Vérifie que l'employé associé est actif
4. Détecte si c'est une entrée ou une sortie (logique entry/exit)
5. Publie la réponse sur `core/rfid/sensor/RFID-001/response`

### Étape 3 — L'ESP32 reçoit la réponse

**Topic :** `core/rfid/sensor/RFID-001/response`

**Payload (texte brut, pas JSON) :**

| Payload        | Signification                                  |
|----------------|------------------------------------------------|
| `0x001020`     | Accepté — pointage enregistré                  |
| `0x003020`     | Refusé — carte inactive ou employé inactif     |
| `0x108080`     | Rejeté — carte inconnue                        |

### Diagramme séquence

```
ESP32                     Backend (Laravel)
  │                            │
  │──── event: {card_uid} ────►│
  │                            │── Vérifie carte, employé
  │                            │── Enregistre pointage
  │◄─── response: 0x001020 ───│
  │                            │
  │   [BUZZER + OLED OK]       │
```

---

## 5. Flux de statut / heartbeat

### Commande STATUS envoyée par le backend

Le backend peut demander à l'ESP32 son état en envoyant :

**Topic :** `core/rfid/sensor/RFID-001/response`  
**Payload :** `0x100010`

### Réponse attendue de l'ESP32

L'ESP32 répond en **republiant sur son topic d'événement** (`/event`) :

**Topic :** `core/rfid/sensor/RFID-001/event`  
**Payload JSON :**
```json
{
  "version": "V2.0.1",
  "uptime": 3600,
  "sleep": false,
  "ip": "192.168.1.45",
  "rssi": -70
}
```

> **Important :** Le champ `version` est utilisé par le backend pour synchroniser `firmware_version` dans la base de données. Il doit correspondre exactement à `FIRMWARE_VERSION` défini dans `config.h`.

**Code Arduino actuel (conforme) :**
```cpp
else if (message == CMD_STATUS) {
  String s = "{";
  s += "\"version\":\"" + String(FIRMWARE_VERSION) + "\",";
  s += "\"uptime\":"    + String(millis() / 1000)  + ",";
  s += "\"sleep\":"     + String(sleepMode ? "true" : "false") + ",";
  s += "\"ip\":\""      + WiFi.localIP().toString() + "\",";
  s += "\"rssi\":"      + String(WiFi.RSSI());
  s += "}";
  mqttController->publish(s);
}
```

Ce comportement est conforme. Le backend extrait `firmware_version` depuis le payload event et met à jour la DB.

---

## 6. Flux de mise à jour OTA (FOTA)

C'est la partie la plus complexe. Elle implique **deux topics supplémentaires** que l'ESP32 doit gérer.

### 6.1 Vue d'ensemble

```
Backend                     ESP32
   │                          │
   │── devices/RFID-001/ota ─►│  (commande OTA)
   │                          │── Télécharge .bin via HTTP
   │                          │── Flash firmware
   │                          │── Redémarre
   │◄─ devices/RFID-001/      │  (résultat OTA)
   │   ota/response ──────────│
```

### 6.2 Commande OTA reçue par l'ESP32

**Topic :** `devices/RFID-001/ota`

**Payload JSON :**
```json
{
  "log_id": "uuid-du-log-ota",
  "version": "V2.1.0",
  "url": "https://tonserveur.com/firmware/v2.1.0.bin"
}
```

| Champ     | Type   | Description                                                   |
|-----------|--------|---------------------------------------------------------------|
| `log_id`  | string | Identifiant UUID du log OTA en base — **doit être renvoyé** dans la réponse |
| `version` | string | Version cible du firmware (format `VX.Y.Z`)                  |
| `url`     | string | URL HTTP(S) du fichier `.bin` à télécharger                  |

### 6.3 Réponse OTA publiée par l'ESP32

**Topic :** `devices/RFID-001/ota/response`

**Payload JSON (succès) :**
```json
{
  "log_id": "uuid-du-log-ota",
  "success": true,
  "version": "V2.1.0",
  "error": null
}
```

**Payload JSON (échec) :**
```json
{
  "log_id": "uuid-du-log-ota",
  "success": false,
  "version": null,
  "error": "HTTP 404 - firmware introuvable"
}
```

| Champ     | Type    | Description                                                    |
|-----------|---------|----------------------------------------------------------------|
| `log_id`  | string  | Même valeur que dans la commande reçue — obligatoire           |
| `success` | boolean | `true` si le flash a réussi, `false` sinon                     |
| `version` | string  | Version installée (si succès), `null` sinon                    |
| `error`   | string  | Message d'erreur (si échec), `null` sinon                      |

> **Le `log_id` est critique.** Sans lui, le backend ne peut pas mettre à jour le statut du log OTA en base de données et l'opération restera en état `in_progress` indéfiniment.

### 6.4 Ce que fait le backend après réception

```php
// core-back/app/Console/Commands/MqttListenRfidCommand.php
// processOtaResponse()

if ($success && $version && $serial) {
    RfidDevice::where('serial_number', $serial)
        ->update(['firmware_version' => $version]);
}
```

Le backend extrait le `serial_number` depuis le topic (`devices/{serial}/ota/response`) et met à jour `firmware_version` dans la table `rfid_devices`.

---

## 7. Codes de commande

Tous les codes sont reçus sur le topic `core/rfid/sensor/{id}/response` sous forme de **texte brut** (pas de JSON), sauf le FOTA qui arrive en JSON.

| Code       | Constante    | Action ESP32                                      |
|------------|--------------|---------------------------------------------------|
| `0x001020` | CMD_ACCEPTED | Buzzer OK + OLED "Accepté" + LED vert clignotant  |
| `0x003020` | CMD_REFUSED  | Buzzer erreur + OLED "Refusé" + LED rouge rapide  |
| `0x108080` | CMD_REJECTED | Buzzer erreur + OLED "Rejeté" + LED rouge rapide  |
| `0x108090` | CMD_REBOOT   | Redémarrage ESP32 après 2 secondes                |
| `0x108070` | CMD_RESET    | Réinitialisation config WiFi                      |
| `0x1080B0` | CMD_SLEEP    | Passe en mode veille (ignore les scans RFID)      |
| `0x1080A0` | CMD_WAKE_UP  | Sort du mode veille                               |
| `0x100010` | CMD_STATUS   | Publie le statut système sur le topic `/event`    |
| `0x1080D0` | CMD_FOTA     | Déclenche une mise à jour firmware (JSON payload) |

### Format FOTA via le topic response (legacy)

Le backend peut aussi déclencher une FOTA via le topic response habituel avec un JSON :

```json
{
  "cmd": "0x1080D0",
  "url": "https://tonserveur.com/firmware/v2.1.0.bin",
  "version": "V2.1.0"
}
```

Dans ce mode, **pas de `log_id`** et donc pas de tracking du statut OTA. Préférer le topic `devices/{id}/ota` qui inclut le `log_id`.

---

## 8. Correction critique — Double abonnement MQTT

### Problème actuel

L'ESP32 actuel n'est abonné qu'à **un seul topic** :
```
core/rfid/sensor/RFID-001/response   ✓ (abonné)
devices/RFID-001/ota                  ✗ (NON abonné)
```

Or le backend publie les commandes OTA sur `devices/{serial}/ota`. L'ESP32 ne reçoit donc **jamais** les commandes de mise à jour firmware depuis la plateforme.

### Limitation du MQTTController actuel

La classe `MQTTController` dans `mqtt.h` ne supporte qu'**un seul topic d'abonnement** via `setSubscribeTopic()`. Elle stocke le topic dans `subscribeTopic` (String unique) et le resouscrit à chaque reconnexion.

De plus, le `mqttCallback` filtre les messages :
```cpp
if (strcmp(topic, mqttController->getSubscribeTopic().c_str()) != 0) return;
```
Cela ignore silencieusement tout message arrivant sur un topic différent du topic principal.

### Solution — Modifications à apporter

#### 1. Étendre `MQTTController` pour plusieurs topics

Dans `mqtt.h`, remplacer le `String subscribeTopic` unique par une liste, et modifier `applySubscription()` pour souscrire à tous les topics.

#### 2. Modifier `mqttCallback` pour accepter plusieurs topics

Supprimer le filtre strict et traiter le message selon le topic reçu :

```cpp
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  if (!mqttController) return;

  String topicStr = String(topic);
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  
  logger.debug("MQTT recu [" + topicStr + "] : " + message);

  // Topic réponse standard (pointage, commandes)
  String expectedResponseTopic = String(MQTT_TOPIC_PREFIX) + String(MQTT_DEVICE_ID) + String(MQTT_CMD_SUFFIX);
  
  // Topic OTA
  String otaTopic = "devices/" + String(MQTT_DEVICE_ID) + "/ota";

  if (topicStr == expectedResponseTopic) {
    // Traitement des réponses de pointage et commandes générales
    handleResponseMessage(message);
  }
  else if (topicStr == otaTopic) {
    // Traitement des commandes OTA
    handleOtaCommand(message);
  }
}
```

#### 3. Implémenter `handleOtaCommand()`

```cpp
void handleOtaCommand(const String& message) {
  // Extraire log_id, version, url depuis le JSON
  // {"log_id":"uuid","version":"V2.1.0","url":"https://..."}
  
  String logId   = extractFromJSON(message, "log_id");
  String version = extractFromJSON(message, "version");
  String url     = extractFromJSON(message, "url");

  oled.displayText("MAJ firmware", 0, 0, 1, true);
  oled.displayText(version, 0, 20, 1, false);
  led.setPattern(LEDManager::Pattern::BLINK_FAST);

  // Effectuer la mise à jour
  bool success = performOTA(url, version);

  // Publier le résultat (AVANT le reboot si succès)
  String otaResponseTopic = "devices/" + String(MQTT_DEVICE_ID) + "/ota/response";
  String responsePayload;
  if (success) {
    responsePayload = "{\"log_id\":\"" + logId + "\",\"success\":true,\"version\":\"" + version + "\",\"error\":null}";
  } else {
    responsePayload = "{\"log_id\":\"" + logId + "\",\"success\":false,\"version\":null,\"error\":\"OTA failed\"}";
  }
  mqttController->publish(otaResponseTopic.c_str(), responsePayload);
  
  delay(500); // Laisser le temps au message d'être envoyé avant reboot
}
```

#### 4. Ajouter l'abonnement OTA dans `initMQTT()`

Dans `presenseV2.ino`, après la configuration des topics existants :

```cpp
void initMQTT() {
  // ... code existant ...
  
  String pubTopic = String(MQTT_TOPIC_PREFIX) + String(MQTT_DEVICE_ID) + "/event";
  String subTopic = String(MQTT_TOPIC_PREFIX) + String(MQTT_DEVICE_ID) + String(MQTT_CMD_SUFFIX);
  
  mqttController->setPublishTopic(pubTopic);
  mqttController->setSubscribeTopic(subTopic);           // topic principal (réponses pointage)
  
  // NOUVEAU — abonnement au topic OTA
  String otaTopic = "devices/" + String(MQTT_DEVICE_ID) + "/ota";
  mqttController->addSubscribeTopic(otaTopic);           // à implémenter dans MQTTController
  
  // ...
}
```

---

## 9. Identification du terminal

### Convention de nommage `DEVICE_ID`

Le `MQTT_DEVICE_ID` défini dans `config.h` est utilisé comme identifiant dans les topics MQTT. Il doit correspondre au `serial_number` enregistré dans la base de données pour l'appareil.

```
config.h           → MQTT_DEVICE_ID = "RFID-001"
rfid_devices table → serial_number  = "RFID-001"
```

**Format recommandé :** `RFID-{numéro}` pour les terminaux RFID (ex: `RFID-001`, `RFID-002`).

### Extraction du serial depuis le topic

Le backend extrait le `serial_number` depuis le topic en splitant sur `/` :

```php
// Topic: core/rfid/sensor/RFID-001/event
$parts = explode('/', $topic);
$uniqueId = $parts[3] ?? null;  // → "RFID-001"

// Topic: devices/RFID-001/ota/response
$serial = explode('/', $topic)[1] ?? null;  // → "RFID-001"
```

Assurer la cohérence entre la position dans le topic et le format attendu.

### Client ID MQTT unique

Le `MQTT_CLIENT_ID` dans `config.h` est actuellement `"presense"` (valeur partagée). Si plusieurs terminaux utilisent le même `ClientID`, le broker déconnectera l'ancien terminal quand un nouveau se connecte.

**Recommandation :** Utiliser le `DEVICE_ID` comme `ClientID` ou l'inclure dedans :
```cpp
mqttController->setClientId("presense-" + String(MQTT_DEVICE_ID));
```

---

## 10. Checklist de conformité

Avant de flasher un terminal en production, vérifier les points suivants :

### Configuration

- [ ] `MQTT_DEVICE_ID` correspond au `serial_number` enregistré en base
- [ ] `MQTT_CLIENT_ID` est unique (différent pour chaque terminal physique)
- [ ] `FIRMWARE_VERSION` est au format `VX.Y.Z` (ex: `V2.0.1`)
- [ ] Buffer MQTT = 1024 bytes minimum

### Topics

- [ ] Publication sur `core/rfid/sensor/{id}/event` avec `{"card_uid":"..."}`
- [ ] Abonnement à `core/rfid/sensor/{id}/response` (réponses pointage + commandes)
- [ ] **Abonnement à `devices/{id}/ota`** (commandes OTA — **CRITIQUE, à ajouter**)
- [ ] Publication sur `devices/{id}/ota/response` avec `log_id` après chaque OTA

### Payloads

- [ ] Scan RFID : champ `card_uid` (majuscule, sans `:`)
- [ ] Status : champ `version` présent avec la valeur exacte de `FIRMWARE_VERSION`
- [ ] OTA response : `log_id` echoed back, `success` boolean, `version` si succès

### OTA

- [ ] La commande OTA sur `devices/{id}/ota` est reçue et traitée
- [ ] La réponse OTA est publiée sur `devices/{id}/ota/response` **avant** le reboot
- [ ] Le `log_id` reçu est renvoyé dans la réponse

---

## Résumé des topics — Tableau de référence

| Direction       | Topic                                    | Format  | Description                    |
|-----------------|------------------------------------------|---------|-------------------------------|
| ESP32 → Backend | `core/rfid/sensor/{id}/event`            | JSON    | Scan badge / Statut heartbeat  |
| Backend → ESP32 | `core/rfid/sensor/{id}/response`         | Texte   | Résultat pointage + commandes  |
| Backend → ESP32 | `devices/{id}/ota`                       | JSON    | Commande mise à jour firmware  |
| ESP32 → Backend | `devices/{id}/ota/response`              | JSON    | Résultat mise à jour firmware  |

---

*Guide généré pour PRESENSE V2 — TANGA GROUP*  
*Dernière mise à jour : 2026-03-31*
