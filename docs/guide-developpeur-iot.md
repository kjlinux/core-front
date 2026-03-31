# Guide Développeur IoT — PRESENSE v2
## Intégration ESP32 avec la plateforme Tangaflow

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

Le firmware est **universel** — un seul binaire pour tous les terminaux RFID. Chaque terminal est identifié par une constante `SERIAL_NUMBER` dans `config.h`. Pour flasher un nouveau terminal, il suffit de changer cette valeur et de recompiler. Tout le reste du firmware est identique.

```
┌─────────────────────────────────────────────────────────────┐
│                     HiveMQ Cloud                            │
│                   (broker MQTT TLS 8883)                    │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
   ┌───────────────────┐           ┌──────────────────────────┐
   │   ESP32 RFID-001  │           │   Backend Tangaflow       │
   │   (PRESENSE V2)   │           │   api.tangaflow.com       │
   │                   │           │                          │
   │  Publie sur :     │ ────────► │  Souscrit sur :          │
   │  core/rfid/       │           │  core/rfid/sensor/+/event│
   │  sensor/RFID-001  │           │                          │
   │  /event           │           │  Publie sur :            │
   │                   │ ◄──────── │  core/rfid/sensor/       │
   │  Souscrit sur :   │           │  RFID-001/response       │
   │  core/rfid/sensor │           │                          │
   │  /RFID-001/       │           │  ET publie sur :         │
   │  response         │           │  devices/RFID-001/ota    │
   │                   │ ◄──────── │  (commandes OTA)         │
   │  [À AJOUTER]      │           │                          │
   │  devices/RFID-001 │           │  Souscrit sur :          │
   │  /ota             │           │  devices/+/ota/response  │
   │                   │ ────────► │                          │
   │  [À AJOUTER]      │           │                          │
   │  devices/RFID-001 │           │                          │
   │  /ota/response    │           │                          │
   └───────────────────┘           └──────────────────────────┘
```

**Le backend utilise deux canaux distincts vers l'ESP32 :**
- `core/rfid/sensor/RFID-001/response` — réponses aux pointages + commandes générales
- `devices/RFID-001/ota` — commandes de mise à jour firmware

L'ESP32 actuel ne souscrit **pas** au topic OTA. Voir [section 8](#8-correction-critique--double-abonnement-mqtt).

---

## 2. Connexion MQTT

### Paramètres de connexion

| Paramètre   | Valeur                                                        |
|-------------|---------------------------------------------------------------|
| Host        | `fd286f0fca334917b338f6f5882a2763.s1.eu.hivemq.cloud`        |
| Port        | `8883` (TLS obligatoire)                                      |
| Protocol    | MQTT 3.1.1                                                    |
| TLS         | Activé — certificat CA inclus dans `ca_cert.h`               |
| Username    | `perseus911`                                                  |
| Password    | `Wemtinga2026@`                                               |
| Client ID   | Doit être unique par terminal (ex: `presense-RFID-001`)       |
| Keep Alive  | 60 secondes                                                   |

### Notes importantes

- Le TLS doit être configuré **avant** d'appeler `begin()` ou `connect()`.
- Le `ClientID` doit être **unique pour chaque terminal physique**. Si deux terminaux utilisent le même `ClientID`, le broker déconnectera l'un d'eux. Actuellement `MQTT_CLIENT_ID = "presense"` dans `config.h` est partagé — à corriger.
- Le buffer MQTT doit être à **1024 bytes minimum** pour les payloads JSON OTA :
  ```cpp
  client.setBufferSize(1024);
  ```

---

## 3. Topics MQTT — Convention et structure

### Topics du terminal RFID-001

Chaque terminal a ses propres topics fixes, construits avec son `MQTT_DEVICE_ID`.

```
core/rfid/sensor/RFID-001/event      ← RFID-001 publie (scan + statut)
core/rfid/sensor/RFID-001/response   ← RFID-001 souscrit (réponses + commandes)
devices/RFID-001/ota                 ← RFID-001 souscrit (commandes OTA)  [À AJOUTER]
devices/RFID-001/ota/response        ← RFID-001 publie (résultat OTA)     [À AJOUTER]
```

Pour un autre terminal, ex. `RFID-002`, remplacer `RFID-001` par `RFID-002` partout dans son `config.h`.

### Correspondance `DEVICE_ID` ↔ `serial_number`

Le `MQTT_DEVICE_ID` dans `config.h` doit correspondre **exactement** au champ `serial_number` enregistré dans la base de données Tangaflow pour cet appareil.

```
config.h           →  MQTT_DEVICE_ID = "RFID-001"
                             ↕  identique
DB tangaflow       →  rfid_devices.serial_number = "RFID-001"
```

Si ces deux valeurs diffèrent, le backend ne retrouvera pas l'appareil et ne pourra pas associer les pointages ni déclencher les mises à jour.

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

- `card_uid` : UID de la carte RFID en hexadécimal majuscule, séparateurs `:` retirés.
- Le backend accepte aussi `uid` (format legacy) mais `card_uid` est le format attendu.

**Code Arduino actuel (conforme) :**
```cpp
String uidClean = uid;
uidClean.replace(":", "");
String payload = "{\"card_uid\":\"" + uidClean + "\"}";
mqttController->publish(mqttController->getPublishTopic().c_str(), payload);
```

### Étape 2 — Le backend traite et répond

Le backend Tangaflow (`MqttListenRfidCommand`) :
1. Identifie le terminal via `serial_number = "RFID-001"` (extrait du topic)
2. Met à jour `is_online = true` sur l'appareil
3. Vérifie que la carte existe et est active
4. Vérifie que l'employé associé est actif
5. Détecte automatiquement si c'est une entrée ou une sortie
6. Publie la réponse sur `core/rfid/sensor/RFID-001/response`

### Étape 3 — L'ESP32 reçoit la réponse

**Topic :** `core/rfid/sensor/RFID-001/response`

**Payload (texte brut, pas JSON) :**

| Payload        | Signification                               |
|----------------|---------------------------------------------|
| `0x001020`     | Accepté — pointage enregistré               |
| `0x003020`     | Refusé — carte inactive ou employé inactif  |
| `0x108080`     | Rejeté — carte inconnue                     |

### Diagramme séquence

```
RFID-001 (ESP32)            Backend Tangaflow
      │                            │
      │── event: {card_uid} ──────►│
      │                            │── Vérifie carte + employé
      │                            │── Enregistre pointage (entrée ou sortie)
      │◄── response: 0x001020 ────│
      │                            │
      │  [BUZZER OK + OLED Accepté]│
```

---

## 5. Flux de statut / heartbeat

### Commande STATUS envoyée par le backend

Le backend peut interroger l'état d'un terminal en envoyant :

**Topic :** `core/rfid/sensor/RFID-001/response`
**Payload :** `0x100010`

### Réponse attendue de l'ESP32

L'ESP32 répond en republiant sur son topic d'événement :

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

> **Important :** Le champ `version` est utilisé par le backend Tangaflow pour synchroniser `firmware_version` dans la base de données. Il doit correspondre exactement à `FIRMWARE_VERSION` dans `config.h`.

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

---

## 6. Flux de mise à jour OTA (FOTA)

### 6.1 Vue d'ensemble

```
Backend Tangaflow              RFID-001 (ESP32)
        │                             │
        │── devices/RFID-001/ota ────►│  (commande OTA avec log_id)
        │                             │── Télécharge .bin via HTTP
        │                             │── Flash firmware
        │◄─ devices/RFID-001/         │  (résultat avec log_id)
        │   ota/response ─────────────│
        │                             │── Redémarre
```

### 6.2 Commande OTA reçue par l'ESP32

**Topic :** `devices/RFID-001/ota`

**Payload JSON :**
```json
{
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "version": "V2.1.0",
  "firmware_url": "https://api.tangaflow.com/firmware/v2.1.0.bin",
  "type": "ota_update",
  "timestamp": "2026-03-31T10:00:00.000Z"
}
```

| Champ          | Type   | Description                                                          |
|----------------|--------|----------------------------------------------------------------------|
| `log_id`       | string | UUID du log OTA en base — **doit être renvoyé tel quel** en réponse  |
| `version`      | string | Version cible du firmware (format `VX.Y.Z`)                         |
| `firmware_url` | string | URL HTTPS du fichier `.bin` à télécharger                            |
| `type`         | string | Toujours `"ota_update"` — peut être ignoré par le firmware           |
| `timestamp`    | string | Horodatage ISO 8601 — peut être ignoré par le firmware               |

### 6.3 Réponse OTA publiée par l'ESP32

**Topic :** `devices/RFID-001/ota/response`

**Payload JSON (succès) :**
```json
{
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "version": "V2.1.0",
  "error": null
}
```

**Payload JSON (échec) :**
```json
{
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "success": false,
  "version": null,
  "error": "HTTP 404 - firmware introuvable"
}
```

| Champ     | Type    | Description                                                   |
|-----------|---------|---------------------------------------------------------------|
| `log_id`  | string  | Même UUID que dans la commande — **obligatoire**              |
| `success` | boolean | `true` si le flash a réussi, `false` sinon                    |
| `version` | string  | Version installée si succès, `null` sinon                     |
| `error`   | string  | Message d'erreur si échec, `null` sinon                       |

> **Le `log_id` est critique.** Sans lui, le backend ne peut pas retrouver le log OTA et l'opération restera bloquée en état `in_progress`.

> **La réponse doit être publiée AVANT le reboot.** Ajouter un `delay(500)` entre la publication et `ESP.restart()` pour laisser le temps au message d'être transmis au broker.

### 6.4 Ce que fait le backend après réception

Le backend extrait le `serial_number` depuis le topic (`devices/RFID-001/ota/response` → `RFID-001`), met à jour le log OTA (`success` ou `failed`) et synchronise `firmware_version` dans la table `rfid_devices`.

---

## 7. Codes de commande

Tous les codes arrivent sur `core/rfid/sensor/RFID-001/response` en **texte brut** (sauf le FOTA legacy qui est JSON).

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

### FOTA via le topic response (mode legacy, sans tracking)

Le backend peut aussi déclencher une FOTA sans `log_id` via le topic response :

```json
{
  "cmd": "0x1080D0",
  "url": "https://api.tangaflow.com/firmware/v2.1.0.bin",
  "version": "V2.1.0"
}
```

Ce mode ne permet pas de tracker le statut dans la plateforme. Préférer le topic `devices/RFID-001/ota` décrit en section 6.

---

## 8. Correction critique — Double abonnement MQTT

### Problème actuel

L'ESP32 ne souscrit qu'à **un seul topic** :
```
core/rfid/sensor/RFID-001/response   ✓ abonné (réponses pointage + commandes)
devices/RFID-001/ota                  ✗ NON abonné (commandes OTA)
```

Le backend Tangaflow publie les commandes OTA sur `devices/RFID-001/ota`. L'ESP32 ne les reçoit donc **jamais** et les mises à jour firmware déclenchées depuis la plateforme sont sans effet.

### Cause dans le code

La classe `MQTTController` (`mqtt.h`) ne supporte qu'un seul topic d'abonnement. De plus, `mqttCallback` filtre les messages entrants :

```cpp
// Dans presenseV2.ino — filtre strict actuel
if (strcmp(topic, mqttController->getSubscribeTopic().c_str()) != 0) return;
```

Tout message arrivant sur un topic différent est ignoré silencieusement.

### Modifications à apporter

#### 1. Supprimer le filtre strict dans `mqttCallback`

Remplacer le filtre par un dispatch selon le topic reçu :

```cpp
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  if (!mqttController) return;

  String topicStr = String(topic);
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

  logger.debug("MQTT recu [" + topicStr + "] : " + message);

  // Topic réponse standard (pointage + commandes générales)
  if (topicStr == String(MQTT_TOPIC_PREFIX) + MQTT_DEVICE_ID + MQTT_CMD_SUFFIX) {
    handleResponseMessage(message);
    return;
  }

  // Topic OTA
  if (topicStr == String("devices/") + MQTT_DEVICE_ID + "/ota") {
    handleOtaCommand(message);
    return;
  }
}
```

#### 2. Extraire la logique de réponse dans `handleResponseMessage()`

Déplacer le contenu actuel du `mqttCallback` (gestion des CMD_ACCEPTED, CMD_REFUSED, CMD_STATUS, etc.) dans cette fonction.

#### 3. Implémenter `handleOtaCommand()`

```cpp
void handleOtaCommand(const String& message) {
  // Payload attendu: {"log_id":"uuid","version":"V2.1.0","firmware_url":"https://...","type":"ota_update","timestamp":"..."}
  String logId   = FOTA::extractJSON(message, "log_id");
  String version = FOTA::extractJSON(message, "version");
  String url     = FOTA::extractJSON(message, "firmware_url");

  if (url.isEmpty() || logId.isEmpty()) {
    logger.error("[OTA] Payload invalide : " + message);
    return;
  }

  oled.displayText("MAJ firmware", 0, 0, 1, true);
  oled.displayText(version, 0, 20, 1, false);
  led.setPattern(LEDManager::Pattern::BLINK_FAST);

  // Tenter la mise à jour
  // Note : FOTA::performUpdate() redémarre en cas de succès
  // La réponse doit être publiée AVANT le reboot — adapter fota.h en conséquence

  String otaResponseTopic = String("devices/") + MQTT_DEVICE_ID + "/ota/response";

  // En cas d'échec (performUpdate retourne sans redémarrer)
  String responsePayload = "{\"log_id\":\"" + logId + "\","
    "\"success\":false,"
    "\"version\":null,"
    "\"error\":\"OTA failed\"}";
  mqttController->publish(otaResponseTopic.c_str(), responsePayload);
}
```

> **Note sur le succès OTA :** `httpUpdate` redémarre automatiquement l'ESP32 si le flash réussit (`rebootOnUpdate(true)`). Il faut donc publier la réponse de succès dans le callback `onEnd` de `httpUpdate`, **avant** que le reboot ait lieu. Adapter `fota.h` pour accepter un callback ou un topic de réponse.

#### 4. Souscrire au topic OTA dans `MQTTController`

Ajouter un second appel `subscribe` dans `applySubscription()` de `mqtt.h` :

```cpp
void applySubscription() {
  // Abonnement principal (réponses pointage)
  if (!subscribeTopic.isEmpty()) {
    client.subscribe(subscribeTopic.c_str());
    logger.info("Abonne : " + subscribeTopic);
  }

  // Abonnement OTA
  String otaTopic = String("devices/") + MQTT_DEVICE_ID + "/ota";
  client.subscribe(otaTopic.c_str());
  logger.info("Abonne OTA : " + otaTopic);
}
```

---

## 9. Identification du terminal

### Principe : un seul firmware pour tous les terminaux

Le firmware est **universel** — un seul binaire est compilé et flashé sur tous les terminaux RFID. Chaque terminal se distingue par une constante `SERIAL_NUMBER` définie dans `config.h`, qui est injectée dans les topics MQTT au démarrage.

### Définir le serial number dans `config.h`

Remplacer `MQTT_DEVICE_ID` par une constante `SERIAL_NUMBER` plus explicite :

```cpp
// config.h — à adapter pour chaque terminal avant de flasher
#define SERIAL_NUMBER  "RFID-001"   // ← changer ici selon le terminal
```

### Construire les topics dynamiquement dans `presenseV2.ino`

```cpp
void initMQTT() {
  // ...

  String pubTopic = String(MQTT_TOPIC_PREFIX) + SERIAL_NUMBER + "/event";
  String subTopic = String(MQTT_TOPIC_PREFIX) + SERIAL_NUMBER + "/response";
  String otaTopic = String("devices/") + SERIAL_NUMBER + "/ota";

  mqttController->setPublishTopic(pubTopic);
  mqttController->setSubscribeTopic(subTopic);
  // otaTopic souscrit séparément — voir section 8

  // Client ID unique basé sur le serial
  mqttController->setClientId(String("presense-") + SERIAL_NUMBER);

  // ...
}
```

Et dans `mqttCallback`, utiliser la même variable :

```cpp
if (topicStr == String(MQTT_TOPIC_PREFIX) + SERIAL_NUMBER + "/response") {
  handleResponseMessage(message);
  return;
}
if (topicStr == String("devices/") + SERIAL_NUMBER + "/ota") {
  handleOtaCommand(message);
  return;
}
```

### Cohérence avec la base de données

Le `SERIAL_NUMBER` doit correspondre exactement au champ `serial_number` enregistré dans Tangaflow pour ce terminal :

```
config.h        →  SERIAL_NUMBER = "RFID-001"
                          ↕  identique
DB tangaflow    →  rfid_devices.serial_number = "RFID-001"
```

Pour flasher un nouveau terminal, il suffit de changer `SERIAL_NUMBER` dans `config.h` et de recompiler. Le reste du firmware est identique.

### Client ID MQTT unique

Avec la construction dynamique ci-dessus, le `ClientID` devient `presense-RFID-001`, `presense-RFID-002`, etc. — unique pour chaque terminal, ce qui évite les déconnexions mutuelles sur le broker.

---

## 10. Checklist de conformité

Avant de flasher un terminal en production :

### Configuration (`config.h`)

- [ ] `SERIAL_NUMBER` correspond au `serial_number` enregistré dans Tangaflow (ex: `"RFID-001"`)
- [ ] `MQTT_CLIENT_ID` construit dynamiquement depuis `SERIAL_NUMBER` (ex: `presense-RFID-001`)
- [ ] `FIRMWARE_VERSION` est au format `VX.Y.Z` (ex: `V2.0.1`)
- [ ] Buffer MQTT = 1024 bytes minimum dans le constructeur `MQTTController`

### Topics (abonnements)

- [ ] Abonnement à `core/rfid/sensor/RFID-001/response` (réponses pointage + commandes)
- [ ] **Abonnement à `devices/RFID-001/ota`** — CRITIQUE, absent du code actuel

### Topics (publications)

- [ ] Scan RFID publié sur `core/rfid/sensor/RFID-001/event` avec `{"card_uid":"..."}`
- [ ] Statut publié sur `core/rfid/sensor/RFID-001/event` avec champ `version`
- [ ] **Résultat OTA publié sur `devices/RFID-001/ota/response`** avec `log_id` — AVANT le reboot

### Payloads

- [ ] `card_uid` en majuscules, sans séparateurs
- [ ] `version` dans le statut = valeur exacte de `FIRMWARE_VERSION`
- [ ] Réponse OTA : `log_id` renvoyé tel quel, `success` boolean, `version` si succès

---

## Résumé des topics — Tableau de référence (pour RFID-001)

| Direction             | Topic                                       | Format      | Description                        |
|-----------------------|---------------------------------------------|-------------|-----------------------------------|
| ESP32 → Backend       | `core/rfid/sensor/RFID-001/event`           | JSON        | Scan badge + réponse statut        |
| Backend → ESP32       | `core/rfid/sensor/RFID-001/response`        | Texte brut  | Résultat pointage + commandes      |
| Backend → ESP32       | `devices/RFID-001/ota`                      | JSON        | Commande mise à jour firmware      |
| ESP32 → Backend       | `devices/RFID-001/ota/response`             | JSON        | Résultat mise à jour firmware      |

Ces topics sont construits dynamiquement depuis `SERIAL_NUMBER` dans `config.h`. Pour un nouveau terminal, seule cette valeur change — le reste du firmware est identique.

---

*Guide développeur IoT — PRESENSE V2 — Tangaflow*
*Dernière mise à jour : 2026-03-31*
