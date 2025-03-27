#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>


// WiFi credentials
const char* WIFI_SSID = "SSID";
const char* WIFI_PASSWORD = "okokokok";

// HiveMQ Cloud MQTT Broker details
const char* MQTT_HOST = "46657a621d654437ab1f932a0ae4df15.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USERNAME = "pubsub";
const char* MQTT_PASSWORD = "69Pubsub";

// Root CA Certificate (copied from the provided document)
const char* root_ca =
  "-----BEGIN CERTIFICATE-----\n"
  "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\n"
  "-----END CERTIFICATE-----\n";

// Secure WiFi and MQTT clients
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// LCD Setup - Use the address you found with the I2C scanner
LiquidCrystal_I2C lcd(0x27, 16, 2);  // Change address if needed

unsigned long lastDisplayUpdate = 0;
const long displayUpdateInterval = 200;  // Update every 200ms


// Hardware Pins
const int BUZZER_PIN = 21;      // Buzzer pin
const int TRIGGER_LED_PIN = 2;  // Built-in LED or external trigger LED


enum SystemState {
  DISARMED,
  ARMED
};

SystemState currentState = DISARMED;

// Password configurations
const String ARM_PASSWORD = "5678";
const String DISARM_PASSWORD = "4321";

// Password entry variables
String passwordEntry = "";
bool isPasswordMode = false;
SystemState targetState = DISARMED;





// Keypad setup
const byte ROWS = 4;
const byte COLS = 4;

// Define keypad keys
char keys[ROWS][COLS] = {
  { '1', '2', '3', 'A' },
  { '4', '5', '6', 'B' },
  { '7', '8', '9', 'C' },
  { '*', '0', '#', 'D' }
};

// Working pin configuration
byte rowPins[ROWS] = { 32, 33, 25, 26 };  // Connected to row pinouts of the keypad
byte colPins[COLS] = { 27, 14, 12, 13 };  // Connected to column pinouts of the keypad

// Create keypad object
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// Variables to store input string
String inputStr = "";
const int MAX_INPUT_LENGTH = 16;  // Maximum length of input string (LCD width)

// WiFi and MQTT variables
unsigned long lastWiFiCheck = 0;
const long wifiCheckInterval = 5000;  // Check WiFi every 5 seconds


struct SensorConfig {
  int pin;
  String zoneName;
  bool isNC;  // true if Normally Closed, false if Normally Open
};


const int SENSOR_COUNT = 13;
SensorConfig sensors[SENSOR_COUNT] = {
  // Full GPIO Pins
  { 4, "zone0", false },
  { 5, "zone1", false },
  { 12, "zone2", false },
  { 13, "zone3", false },
  { 14, "zone4", false },
  { 15, "zone5", false },
  { 16, "zone6", false },
  { 17, "zone7", false },
  { 18, "zone8", false },
  { 19, "zone9", false },
  { 22, "zone10", false },
  { 23, "zone11", false },
  { 27, "zone12", false },

  // Input-Only Pins (Be careful with these)
  // {34, "zone_34", true, true},
  // {35, "zone_35", true, true},
  // {36, "zone_36", true, true},
  // {39, "zone_39", true, true}
};

// MQTT Topics
const char* TRIGGER_TOPIC = "trigger";

// Debounce Configuration
const unsigned long DEBOUNCE_DELAY = 50;  // 50ms debounce time

struct SensorState {
  int lastState;
  unsigned long lastDebounceTime;
  bool triggered;
};

SensorState sensorStates[SENSOR_COUNT] = { 0 };


// Timing and Debounce
unsigned long triggerStartTime = 0;
const unsigned long TRIGGER_COOLDOWN_TIME = 60000;  // 1 minute cooldown


void setup() {
  // Initialize serial for debugging
  Serial.begin(115200);


  // init pins
  for (int i = 0; i < SENSOR_COUNT; i++) {
    if (sensors[i].isNC) {
      // NC sensors use INPUT_PULLUP to detect low state
      pinMode(sensors[i].pin, INPUT_PULLUP);
    } else {
      // NO sensors use default INPUT mode to detect high state
      pinMode(sensors[i].pin, INPUT);
    }

    // Initialize sensor states
    sensorStates[i].lastState = sensors[i].isNC ? HIGH : LOW;
  }


  // Initialize Buzzer and LED
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(TRIGGER_LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(TRIGGER_LED_PIN, LOW);


  // Initialize I2C
  Wire.begin();

  // Initialize LCD
  lcd.begin();
  lcd.backlight();

  // Display welcome message
  lcd.setCursor(0, 0);
  lcd.print("MQTT Keypad Test");
  lcd.setCursor(0, 1);
  lcd.print("Connecting...");

  // Connect to WiFi
  connectToWiFi();

  // Set up secure client with root CA
  espClient.setCACert(root_ca);

  // Configure MQTT broker
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);

  delay(2000);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Input:");
}

void loop() {
  // Check WiFi connection periodically
  if (millis() - lastWiFiCheck > wifiCheckInterval) {
    if (WiFi.status() != WL_CONNECTED) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("WiFi Disconnected");
      lcd.setCursor(0, 1);
      lcd.print("Reconnecting...");
      connectToWiFi();
    }
    lastWiFiCheck = millis();
  }

  // Reconnect to MQTT if not connected
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }

  // Keep MQTT connection alive
  mqttClient.loop();

  checkSensors();

  // Handle keypad input
  char key = keypad.getKey();
  if (key) {
    handleKeyPress(key);
    // Force immediate display update on keypress
    lastDisplayUpdate = 0;
    updateDisplay();
  }

  // Update LCD based on current state
  updateDisplay();

  // // Get key press
  // char key = keypad.getKey();

  // if (key) {
  //   Serial.println("Key pressed: " + String(key));

  //   // Handle backspace (using * as backspace)
  //   if (key == '*' && inputStr.length() > 0) {
  //     inputStr = inputStr.substring(0, inputStr.length() - 1);
  //     lcd.clear();
  //     lcd.setCursor(0, 0);
  //     lcd.print("Input:");
  //     lcd.setCursor(0, 1);
  //     lcd.print(inputStr);
  //   }
  //   // Handle clear (using # as clear)
  //   else if (key == '#') {
  //     inputStr = "";
  //     lcd.clear();
  //     lcd.setCursor(0, 0);
  //     lcd.print("Input:");
  //   }
  //   // Add key to input string if not control characters and not exceeding max length
  //   else if (key != '*' && key != '#' && inputStr.length() < MAX_INPUT_LENGTH) {
  //     inputStr += key;
  //     lcd.setCursor(0, 1);
  //     lcd.print(inputStr);

  //     // Publish keystroke to MQTT
  //     publishKeyStroke(key);
  //   }
  // }
}

void publishKeyStroke(char key) {
  if (mqttClient.connected()) {
    // Convert key to string
    String keyStr(key);

    // Publish to a specific topic
    mqttClient.publish("esp32/keypad/input", keyStr.c_str());

    Serial.print("Published key: ");
    Serial.println(key);
  } else {
    Serial.println("MQTT not connected, cannot publish key");
  }
}



void connectToWiFi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting to");
  lcd.setCursor(0, 1);
  lcd.print("WiFi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 20000) {  // 20s timeout
    delay(500);
    lcd.setCursor(0, 1);
    lcd.print("WiFi...");
    lcd.print((millis() - startAttemptTime) / 1000);
    lcd.print("s");
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print("IP: ");
    lcd.print(WiFi.localIP().toString());
    Serial.println("\nWiFi Connected!");
    delay(2000);
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Retrying...");
    Serial.println("\nWiFi Connection Failed");
    delay(2000);
  }
}



void reconnectMQTT() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting to");
  lcd.setCursor(0, 1);
  lcd.print("MQTT Broker...");

  unsigned long startAttemptTime = millis();
  while (!mqttClient.connected() && millis() - startAttemptTime < 10000) {  // 10s timeout
    Serial.print("Attempting secure MQTT connection...");

    // Generate a random client ID
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);

    // Attempt to connect with credentials
    if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("connected");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("MQTT Connected!");
      delay(2000);

      mqttClient.setCallback(mqttCallback);

      // Subscribe to arm-disarm topic
      mqttClient.subscribe("arm-disarm-app");
      mqttClient.subscribe("cooldown");
      return;
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" Retrying in 5 seconds");
      lcd.setCursor(0, 1);
      lcd.print("Retry in 5s...");
      delay(5000);
    }
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MQTT Failed!");
  lcd.setCursor(0, 1);
  lcd.print("Retrying later...");
  delay(2000);
}



void checkSensors() {
  for (int i = 0; i < SENSOR_COUNT; i++) {
    int reading = digitalRead(sensors[i].pin);

    // Check for state change with debounce
    if (reading != sensorStates[i].lastState) {
      sensorStates[i].lastDebounceTime = millis();
    }

    // Debounce logic
    if ((millis() - sensorStates[i].lastDebounceTime) > DEBOUNCE_DELAY) {
      // Trigger conditions differ for NC and NO sensors
      bool shouldTrigger = sensors[i].isNC ? (reading == LOW) : (reading == HIGH);

      if (shouldTrigger && !sensorStates[i].triggered && currentState == ARMED) {
        triggerSensor(sensors[i].zoneName);
        sensorStates[i].triggered = true;
      }

      if (!shouldTrigger) {
        sensorStates[i].triggered = false;
      }
    }

    sensorStates[i].lastState = reading;
  }
}




void triggerSensor(const String& zoneName) {
  // Create JSON payload
  StaticJsonDocument<100> jsonDoc;
  jsonDoc["zone"] = zoneName;

  // Serialize JSON
  char jsonBuffer[100];
  serializeJson(jsonDoc, jsonBuffer);

  // Publish to MQTT
  mqttClient.publish(TRIGGER_TOPIC, jsonBuffer);

  // Optional: Serial output for debugging
  Serial.print("Sensor Triggered: ");
  Serial.println(zoneName);
}




void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String receivedTopic = String(topic);

  // Check for cooldown topic
  if (receivedTopic == "cooldown") {
    // Silence the alarm
    digitalWrite(TRIGGER_LED_PIN, LOW);
    noTone(BUZZER_PIN);
    triggerStartTime = 0;
    Serial.println("Cooled down from app");
    return;
  }

  // Handle arm/disarm via MQTT
  StaticJsonDocument<100> jsonDoc;
  DeserializationError error = deserializeJson(jsonDoc, payload, length);

  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }

  Serial.println(receivedTopic);

  if (receivedTopic == "arm-disarm-app") {
    const char* state = jsonDoc["state"];
    if (strcmp(state, "armed") == 0) {
      currentState = ARMED;
      Serial.println("System armed via MQTT");
    } else if (strcmp(state, "disarmed") == 0) {
      currentState = DISARMED;
      Serial.println("System disarmed via MQTT");
    }
  }
}

// void handleMainMenuSelection(char key) {
//   switch (key) {
//     case '1':  // Arm System
//       startPasswordEntry(ARMED);
//       break;
//     case '2':  // Disarm System
//       startPasswordEntry(DISARMED);
//       break;
//     case '3':  // Silent Mode
//       startPasswordEntry(SILENT_MODE);
//       break;
//   }
// }


// void handlePasswordEntry(char key) {
//   if (key == '#') {  // Confirm password
//     validatePassword();
//   } else if (key == '*') {  // Backspace
//     if (!passwordEntry.isEmpty()) {
//       passwordEntry = passwordEntry.substring(0, passwordEntry.length() - 1);
//     }
//   } else if (passwordEntry.length() < 4 && isdigit(key)) {
//     passwordEntry += key;
//   }
// }



// Keypad input handling
void handleKeyPress(char key) {
  if (isPasswordMode) {
    // Password entry mode
    handlePasswordEntry(key);
  } else {
    // Normal state selection mode
    switch (currentState) {
      case DISARMED:
        if (key == '1') {  // Arm system
          startPasswordEntry(ARMED);
        }
        break;

      case ARMED:
        if (key == '1') {  // Disarm system
          startPasswordEntry(DISARMED);
        } else if (key == '*') {  // Silence alarm
          silenceAlarm();
        }
        break;
    }
  }
}

// Handle password entry logic
void handlePasswordEntry(char key) {
  if (key == '#') {  // Confirm password
    validatePassword(currentState == DISARMED ? ARMED : DISARMED);
    isPasswordMode = false;
  } else if (key == '*') {  // Backspace
    if (!passwordEntry.isEmpty()) {
      passwordEntry = passwordEntry.substring(0, passwordEntry.length() - 1);
    }
  } else if (passwordEntry.length() < 4 && isdigit(key)) {
    // Add digit to password entry if length is less than 4
    passwordEntry += key;
  }
}

// Start password entry process
void startPasswordEntry(SystemState targetState) {
  passwordEntry = "";
  isPasswordMode = true;
}

// Validate entered password
void validatePassword(SystemState targetState) {
  String requiredPassword = (targetState == ARMED) ? ARM_PASSWORD : DISARM_PASSWORD;

  if (passwordEntry == requiredPassword) {
    currentState = targetState;
    publishSystemState();

    // If disarming during an active alarm, silence it
    if (targetState == DISARMED) {
      silenceAlarm();
    }
  } else {
    // Optional: Add failed password attempt handling
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Invalid Password");
    delay(1000);
  }

  passwordEntry = "";
  isPasswordMode = false;
}

// Silence the alarm
void silenceAlarm() {
  digitalWrite(TRIGGER_LED_PIN, LOW);
  noTone(BUZZER_PIN);
  triggerStartTime = 0;
}

// Publish current system state to MQTT
void publishSystemState() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<100> jsonDoc;
  jsonDoc["state"] = (currentState == ARMED) ? "armed" : "disarmed";

  char jsonBuffer[100];
  serializeJson(jsonDoc, jsonBuffer);
  mqttClient.publish("arm-disarm", jsonBuffer);
}

// Update LCD display based on current state
void updateDisplay() {
  if (millis() - lastDisplayUpdate < displayUpdateInterval) return;

  lastDisplayUpdate = millis();
  lcd.clear();
  lcd.setCursor(0, 0);

  if (isPasswordMode) {
    lcd.print("Enter Password:");
    lcd.setCursor(0, 1);
    for (int i = 0; i < passwordEntry.length(); i++) {
      lcd.print("*");
    }
  } else {
    // Display system state and available actions
    if (currentState == ARMED) {
      lcd.print("SYSTEM ARMED");
      lcd.setCursor(0, 1);
      lcd.print("1:Disarm *:Quiet");
    } else {
      lcd.print("SYSTEM DISARMED");
      lcd.setCursor(0, 1);
      lcd.print("1:Arm");
    }
  }
}



void triggerAlarm(const String& zoneName) {
  // Activate buzzer and LED
  digitalWrite(TRIGGER_LED_PIN, HIGH);
  tone(BUZZER_PIN, 1000);  // 1kHz tone
  triggerStartTime = millis();

  // Create and publish trigger JSON
  StaticJsonDocument<100> jsonDoc;
  jsonDoc["zone"] = zoneName;
  char jsonBuffer[100];
  serializeJson(jsonDoc, jsonBuffer);
  mqttClient.publish("trigger", jsonBuffer);

  Serial.print("Trigger in zone: ");
  Serial.println(zoneName);
}

void checkTriggerCooldown() {
  // Stop alarm if cooldown is triggered
  if (triggerStartTime > 0 && (millis() - triggerStartTime >= TRIGGER_COOLDOWN_TIME)) {
    digitalWrite(TRIGGER_LED_PIN, LOW);
    noTone(BUZZER_PIN);
    triggerStartTime = 0;
  }
}

void cooldown() {
  digitalWrite(TRIGGER_LED_PIN, LOW);
  noTone(BUZZER_PIN);
}
