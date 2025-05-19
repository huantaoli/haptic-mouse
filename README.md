# Haptic Mouse

This is a haptic feedback mouse project that includes firmware, Chrome plugin, and hardware design.

## Project Structure

- `haptic-mouse-firmware/` - ESP32 firmware code (using MAX98357A audio amplifier)
  - `main/` - Main source code
  - `flash_data/` - Audio files
  - `audio_bak/` - Audio file backups
  
- `haptic-mouse-firmware-lra/` - ESP32 firmware code (using DRV2605L Linear Resonant Actuator driver)
  - `main/` - Main source code, including DRV2605L driver and USB HID device implementation

- `haptic-mouse-plugin/` - Chrome browser extension
  - `manifest.json` - Plugin configuration file
  - `popup.html` - Plugin popup interface
  - `content.js` - Content script
  - `background.js` - Background script
  - `images/` - Plugin icons

- `hardware/` - Hardware design files
  - `Schematic.pdf` - Circuit schematic
  - `PCB_layout.pdf` - PCB layout

## Testing Webpage

Use the following command to start a local server for testing the interaction_test.html page:

```bash
python -m http.server 8000```
