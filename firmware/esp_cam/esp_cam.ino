#include "esp_err.h" // <<< Add this include for esp_err_to_name
#include "esp_camera.h"
#include "Arduino.h"
#include "FS.h"                // File System related headers
#include "SD_MMC.h"            // SD Card ESP32 specific library (usually uses slot 1)
#include "soc/soc.h"           // Disable brownout problems
#include "soc/rtc_cntl_reg.h"  // Disable brownout problems
#include "driver/rtc_io.h"
#include "img_converters.h"  // Include header for image conversion functions like fmt2jpg

// --- Pin Definitions ---
// Pin definition for CAMERA_MODEL_AI_THINKER
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1  // NC
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27

#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

// --- Trigger Pin ---
#define TRIGGER_PIN 13  // GPIO pin to trigger image capture

// --- Global Variables ---
int pictureNumber = 0;
bool triggerPinState = LOW;  // Stores the previous state of the trigger pin
uint8_t jpegQuality = 12;    // Store JPEG quality globally or pass it around (0-63, lower is higher quality)

// --- Function Declarations ---
bool initCamera();
bool initSDCard();
void captureAndSavePhoto();

void setup() {
  // Disable brownout detector (Use with caution, might hide power supply issues)
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  Serial.println("\n\n--- ESP32-CAM Capture on GPIO Trigger ---");

  // Configure the trigger pin
  pinMode(TRIGGER_PIN, INPUT_PULLDOWN);        // Use internal pulldown
  triggerPinState = digitalRead(TRIGGER_PIN);  // Read initial state
  Serial.printf("Trigger Pin %d configured. Initial state: %s\n", TRIGGER_PIN, triggerPinState == HIGH ? "HIGH" : "LOW");

  // Initialize SD Card
  if (!initSDCard()) {
    Serial.println("SD Card initialization failed! Check connection/format. Halting.");
    while (1)
      ;  // Stop execution
  }

  // Initialize Camera
  // IMPORTANT: Ensure PSRAM is enabled in Arduino IDE Tools menu for resolutions SVGA or higher!
  if (!initCamera()) {
    Serial.println("Camera initialization failed! Check model/pins/PSRAM. Halting.");
    while (1)
      ;  // Stop execution
  }

  Serial.println("Setup complete. Waiting for trigger...");
}

void loop() {
  // Read the current state of the trigger pin
  bool currentState = digitalRead(TRIGGER_PIN);

  // Check for a rising edge (LOW to HIGH transition)
  if (currentState == HIGH && triggerPinState == LOW) {
    Serial.printf("Trigger detected on GPIO %d!\n", TRIGGER_PIN);
    captureAndSavePhoto();
    delay(200);  // Debounce / prevent immediate re-triggering
  }

  // Update the previous state for the next loop iteration
  triggerPinState = currentState;

  // Small delay to prevent hammering the CPU
  delay(50);
}

// --- Function Definitions ---

bool initSDCard() {
  Serial.println("Initializing SD card using SD_MMC (1-bit mode)...");
  // Pins: CLK=14, CMD=15, D0=2
  if (!SD_MMC.begin("/sdcard", true)) {  // true = 1-bit mode
    Serial.println("SD_MMC Card Mount Failed!");
    return false;
  }

  uint8_t cardType = SD_MMC.cardType();
  if (cardType == CARD_NONE) {
    Serial.println("No SD_MMC card attached");
    return false;
  }

  Serial.print("SD_MMC Card Type: ");
  if (cardType == CARD_MMC) Serial.println("MMC");
  else if (cardType == CARD_SD) Serial.println("SDSC");
  else if (cardType == CARD_SDHC) Serial.println("SDHC");
  else Serial.println("UNKNOWN");

  uint64_t cardSize = SD_MMC.cardSize() / (1024 * 1024);
  Serial.printf("SD_MMC Card Size: %lluMB\n", cardSize);

  // Find the next available picture number
  pictureNumber = 0;  // Reset counter for each boot
  while (true) {
    String filename = "/picture" + String(pictureNumber) + ".jpg";
    if (!SD_MMC.exists(filename)) {
      break;  // Found a non-existent filename
    }
    pictureNumber++;
    if (pictureNumber > 10000) {  // Safety break
      Serial.println("Warning: Picture number exceeded 10000, restarting count.");
      pictureNumber = 0;
      break;
    }
  }
  Serial.printf("Starting picture number: %d\n", pictureNumber);

  return true;
}


// ... other includes ...

bool initCamera() {
  Serial.println("Initializing Camera...");
  camera_config_t config;
  // ... (keep the rest of the config setup as before) ...
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_YUV422; // Keep this from the previous fix
  config.frame_size = FRAMESIZE_SVGA;
  config.jpeg_quality = jpegQuality;
  config.fb_count = 1;

#ifdef CONFIG_SPIRAM_SUPPORT
  config.fb_location = CAMERA_FB_IN_PSRAM;
  Serial.println("PSRAM enabled, using PSRAM for frame buffer.");
#else
  config.fb_location = CAMERA_FB_IN_DRAM;
  Serial.println("PSRAM not enabled, using DRAM for frame buffer (Resolution limited!)");
  if (config.frame_size > FRAMESIZE_CIF) {
      Serial.println("Warning: Frame size too large for DRAM, reducing to CIF.");
      config.frame_size = FRAMESIZE_CIF;
  }
#endif
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;


  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    // Print the error code number and its textual representation
    Serial.printf("Camera init failed with error 0x%x (%s)\n", err, esp_err_to_name(err)); // <<< Added esp_err_to_name

    // Check for specific known error codes
    if (err == ESP_ERR_CAMERA_NOT_SUPPORTED) {
        Serial.println("Reason: Camera format/configuration not supported. Check pixel_format and frame_size.");
    }
    // ******** CHANGE THIS LINE ********
    else if (err == ESP_ERR_NO_MEM) { // Use the standard ESP-IDF memory error
    // *********************************
        Serial.println("Reason: Not enough memory for frame buffer. Enable PSRAM in Tools menu, reduce frame_size/fb_count, or check partition scheme.");
    } else {
        // Generic message for other errors
        Serial.println("Reason: Could be pin definition issue, camera module hardware problem, insufficient power, or other configuration error.");
    }
    return false; // Indicate failure
  }
  Serial.println("Camera init success!");

  // ... (keep sensor settings adjustments as before) ...
  sensor_t * s = esp_camera_sensor_get();
  if (s->id.PID == OV2640_PID) {
      s->set_brightness(s, 0);
      s->set_contrast(s, 0);
      s->set_saturation(s, 0);
  }

  return true; // Indicate success
}


void captureAndSavePhoto() {
  Serial.println("Capturing photo (raw frame)...");
  camera_fb_t *fb = NULL;  // Pointer for the frame buffer

  // Acquire a frame from the camera (in YUV422 format as configured)
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed (fb is NULL)");
    return;  // Exit if capture failed
  }
  Serial.printf("Raw frame acquired. Format: %d, Size: %u bytes, Resolution: %ux%u\n",
                fb->format, fb->len, fb->width, fb->height);

  // --- Convert Raw Frame to JPEG ---
  uint8_t *jpeg_buf = NULL;  // Pointer for the JPEG buffer
  size_t jpeg_len = 0;       // Length of the JPEG buffer

  // Check if the captured format needs conversion (it should be YUV422)
  if (fb->format != PIXFORMAT_JPEG) {
    Serial.printf("Converting frame from %d to JPEG (Quality: %d)...\n", fb->format, jpegQuality);
    bool conversion_ok = fmt2jpg(fb->buf, fb->len, fb->width, fb->height,
                                 fb->format, jpegQuality,
                                 &jpeg_buf, &jpeg_len);

    // VERY IMPORTANT: Return the original frame buffer *after* conversion
    esp_camera_fb_return(fb);
    fb = NULL;  // Indicate the original buffer is returned

    if (!conversion_ok) {
      Serial.println("JPEG conversion failed");
      // Note: fmt2jpg allocates jpeg_buf, need to free it even if conversion fails?
      // Check esp32-camera source or examples, usually free is only needed on success.
      // For safety, let's free if ptr isn't NULL:
      if (jpeg_buf) {
        free(jpeg_buf);
        jpeg_buf = NULL;
      }
      return;  // Exit if conversion failed
    }
    Serial.printf("JPEG conversion successful. New size: %u bytes\n", jpeg_len);
  } else {
    // This case shouldn't happen with PIXFORMAT_YUV422 init, but good practice:
    Serial.println("Frame is already JPEG? Using original buffer.");
    jpeg_buf = fb->buf;
    jpeg_len = fb->len;
    // Don't return fb yet, we'll use its buffer directly.
  }

  // --- Save JPEG Buffer to SD Card ---
  // Create filename
  String path = "/picture" + String(pictureNumber) + ".jpg";
  Serial.printf("Saving file: %s\n", path.c_str());

  // Open file for writing
  fs::FS &fs = SD_MMC;
  File file = fs.open(path.c_str(), FILE_WRITE);
  if (!file) {
    Serial.println("Failed to open file for writing");
  } else {
    // Write JPEG data to file
    if (file.write(jpeg_buf, jpeg_len)) {
      Serial.printf("File saved: %s\n", path.c_str());
      pictureNumber++;  // Increment picture number only on successful write
    } else {
      Serial.println("File write failed");
    }
    // Close the file
    file.close();
  }

  // --- Cleanup ---
  // If conversion happened (fmt2jpg allocated memory), free the JPEG buffer
  if (fb == NULL && jpeg_buf != NULL) {  // fb is NULL means original was returned earlier
    Serial.println("Freeing JPEG buffer allocated by fmt2jpg.");
    free(jpeg_buf);
    jpeg_buf = NULL;
  }
  // If no conversion happened (we used fb->buf directly), return the original buffer now
  else if (fb != NULL) {
    Serial.println("Returning original frame buffer (was already JPEG?).");
    esp_camera_fb_return(fb);
    fb = NULL;
  }

  Serial.println("Capture and save process finished.");
}