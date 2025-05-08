#pragma once

#include <stdint.h>
#include "driver/i2c_master.h"
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

#define DRV2605_ADDR 0x5A ///< Device I2C address

#define DRV2605_REG_STATUS 0x00       ///< Status register
#define DRV2605_REG_MODE 0x01         ///< Mode register
#define DRV2605_MODE_INTTRIG 0x00     ///< Internal trigger mode
#define DRV2605_MODE_EXTTRIGEDGE 0x01 ///< External edge trigger mode
#define DRV2605_MODE_EXTTRIGLVL 0x02  ///< External level trigger mode
#define DRV2605_MODE_PWMANALOG 0x03   ///< PWM/Analog input mode
#define DRV2605_MODE_AUDIOVIBE 0x04   ///< Audio-to-vibe mode
#define DRV2605_MODE_REALTIME 0x05    ///< Real-time playback (RTP) mode
#define DRV2605_MODE_DIAGNOS 0x06     ///< Diagnostics mode
#define DRV2605_MODE_AUTOCAL 0x07     ///< Auto calibration mode

#define DRV2605_REG_RTPIN 0x02    ///< Real-time playback input register
#define DRV2605_REG_LIBRARY 0x03  ///< Waveform library selection register
#define DRV2605_REG_WAVESEQ1 0x04 ///< Waveform sequence register 1
#define DRV2605_REG_WAVESEQ2 0x05 ///< Waveform sequence register 2
#define DRV2605_REG_WAVESEQ3 0x06 ///< Waveform sequence register 3
#define DRV2605_REG_WAVESEQ4 0x07 ///< Waveform sequence register 4
#define DRV2605_REG_WAVESEQ5 0x08 ///< Waveform sequence register 5
#define DRV2605_REG_WAVESEQ6 0x09 ///< Waveform sequence register 6
#define DRV2605_REG_WAVESEQ7 0x0A ///< Waveform sequence register 7
#define DRV2605_REG_WAVESEQ8 0x0B ///< Waveform sequence register 8

#define DRV2605_REG_GO 0x0C          ///< Go register
#define DRV2605_REG_OVERDRIVE 0x0D   ///< Overdrive time offset register
#define DRV2605_REG_SUSTAINPOS 0x0E  ///< Sustain time offset, positive register
#define DRV2605_REG_SUSTAINNEG 0x0F  ///< Sustain time offset, negative register
#define DRV2605_REG_BREAK 0x10       ///< Brake time offset register
#define DRV2605_REG_AUDIOCTRL 0x11   ///< Audio-to-vibe control register
#define DRV2605_REG_AUDIOLVL 0x12    ///< Audio-to-vibe minimum input level register
#define DRV2605_REG_AUDIOMAX 0x13    ///< Audio-to-vibe maximum input level register
#define DRV2605_REG_AUDIOOUTMIN 0x14 ///< Audio-to-vibe minimum output drive register
#define DRV2605_REG_AUDIOOUTMAX 0x15 ///< Audio-to-vibe maximum output drive register
#define DRV2605_REG_RATEDV 0x16      ///< Rated voltage register
#define DRV2605_REG_CLAMPV 0x17      ///< Overdrive clamp voltage register
#define DRV2605_REG_AUTOCALCOMP 0x18 ///< Auto-calibration compensation result register
#define DRV2605_REG_AUTOCALEMP 0x19  ///< Auto-calibration back-EMF result register
#define DRV2605_REG_FEEDBACK 0x1A    ///< Feedback control register
#define DRV2605_REG_CONTROL1 0x1B    ///< Control1 Register
#define DRV2605_REG_CONTROL2 0x1C    ///< Control2 Register
#define DRV2605_REG_CONTROL3 0x1D    ///< Control3 Register
#define DRV2605_REG_CONTROL4 0x1E    ///< Control4 Register
#define DRV2605_REG_VBAT 0x21        ///< Vbat voltage-monitor register
#define DRV2605_REG_LRARESON 0x22    ///< LRA resonance-period register

/* -------------------------------------------------------------------------- */
/*  Configuration and Handle Structures                                       */
/* -------------------------------------------------------------------------- */
typedef struct {
    i2c_device_config_t drv2605_device;  /*!< Configuration for eeprom device */
} drv2605_config_t;

struct drv2605_t {
    i2c_master_dev_handle_t i2c_dev;      /*!< I2C device handle */
};

typedef struct drv2605_t *drv2605_handle_t;

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * @brief  Create and initialize a DRV2605 device on an existing I²C bus.
 *
 * @param[in]  bus_handle  I²C master bus handle (from i2c_master_bus_create)
 * @param[in]  cfg         Device configuration
 * @param[out] v_handle    Returned driver handle
 *
 * @return ESP_OK on success or an error code from esp_err.h
 */
esp_err_t drv2605_init(i2c_master_bus_handle_t bus_handle, const drv2605_config_t *drv2605_config, drv2605_handle_t *drv2605_handle);

/**
 * @brief Write an 8-bit value to a DRV2605 register.
 *
 * Sends a two-byte I²C transaction—register address followed by data—using the
 * device handle returned by ::drv2605_init.
 *
 * @param[in] handle  Driver handle obtained from ::drv2605_init.
 * @param[in] reg     Register address (0x00 – 0x7F) to be written.
 * @param[in] val     Data byte to write into the specified register.
 *
 * @return
 *  - ESP_OK on success
 *  - ESP_ERR_INVALID_ARG if @p handle is NULL
 *  - Propagated I²C errors (e.g., ESP_ERR_TIMEOUT, ESP_FAIL)
 */
esp_err_t drv2605_write_reg8(drv2605_handle_t handle, uint8_t reg, uint8_t val);

/**
 * @brief Read an 8-bit value from a DRV2605 register.
 *
 * Performs a combined I²C transaction (write register address, then read one
 * byte) and stores the result in @p out_val.
 *
 * @param[in]  handle   Driver handle returned by ::drv2605_init.
 * @param[in]  reg      Register address (0x00 – 0x7F) to read from.
 * @param[out] out_val  Pointer to a byte where the register value will be stored.
 *                      Must not be NULL.
 *
 * @return
 *  - ESP_OK on success
 *  - ESP_ERR_INVALID_ARG if @p handle or @p out_val is NULL
 *  - Propagated I²C errors (e.g., ESP_ERR_TIMEOUT, ESP_FAIL)
 */
esp_err_t drv2605_read_reg8(drv2605_handle_t handle, uint8_t reg, uint8_t *out_val);

/**
 * @brief Assign a vibration waveform to one of the DRV2605’s eight sequence slots.
 *
 * The DRV2605 contains eight 1-byte “waveform sequence” registers located at
 * addresses 0x04–0x0B.  Each register holds a waveform ID that the device will
 * play when the sequence is triggered with ::drv2605_go().
 *
 * @param[in] handle       Driver handle obtained from ::drv2605_init.
 * @param[in] slot         Sequence slot index (0–7).  
 *                         *Slot 0 → register 0x04, …, Slot 7 → 0x0B.*
 * @param[in] waveform_id  Waveform/library ID to store in the slot.  
 *                         Use 0x00 to mark the end of a sequence.
 *
 * @return
 *  - ESP_OK on success  
 *  - ESP_ERR_INVALID_ARG if @p handle is NULL or @p slot > 7  
 *  - Propagated I²C errors (e.g., ESP_ERR_TIMEOUT, ESP_FAIL)
 */
esp_err_t drv2605_set_waveform(drv2605_handle_t handle, uint8_t slot, uint8_t waveform_id);

/**
 * @brief Select one of the internal haptic waveform libraries.
 *
 * The DRV2605 stores eight ROM waveform sets (library numbers 0 – 7, see the
 * datasheet for detailed contents).  This function writes the library number
 * to register 0x03 so that subsequent waveform-ID look-ups use the chosen set.
 *
 * @param[in] handle  Driver handle obtained from ::drv2605_init.
 * @param[in] lib     Library index to load (valid range 0–7).
 *
 * @return
 *  - ESP_OK on success  
 *  - ESP_ERR_INVALID_ARG if @p handle is NULL or @p lib > 7  
 *  - Propagated I²C errors (e.g., ESP_ERR_TIMEOUT, ESP_FAIL)
 */
esp_err_t drv2605_select_library(drv2605_handle_t handle, uint8_t lib);

/**
 * @brief Start the haptic waveform sequence stored in the DRV2605.
 *
 * Writes `0x01` to the **GO** register (0x0C).  
 * If at least one non-zero waveform ID is present in slots 0–7, the device
 * will play the sequence immediately according to the current operating mode.
 *
 * @param[in] handle  Driver handle returned by ::drv2605_init. Must not be NULL.
 *
 * @return
 *  - ESP_OK on success  
 *  - ESP_ERR_INVALID_ARG if @p handle is NULL  
 *  - Propagated I²C errors (e.g., ESP_ERR_TIMEOUT, ESP_FAIL)
 */
esp_err_t drv2605_go(drv2605_handle_t handle);

/**
 * @brief Stop the current haptic playback.
 *
 * Writes `0x00` to the **GO** register (0x0C), halting any waveform that is
 * currently running.  The sequence pointer is reset, so the next call to
 * ::drv2605_go() will start again from slot 0.
 *
 * @param[in] handle  Driver handle returned by ::drv2605_init. Must not be NULL.
 *
 * @return
 *  - ESP_OK on success  
 *  - ESP_ERR_INVALID_ARG if @p handle is NULL  
 *  - Propagated I²C errors from the underlying I²C driver
 */
esp_err_t drv2605_stop(drv2605_handle_t handle);

/**
 * @brief Set the DRV2605 operating mode.
 *
 * Writes the MODE register (0x01) with the value supplied in @p mode, selecting
 * how the device interprets triggers and drives the actuator.  Valid options
 * are enumerated in ::drv2605_mode_t (internal trigger, external edge/level,
 * PWM/analog, audio-to-haptic, real-time playback, diagnostics, or
 * auto-calibration).
 *
 * @note Changing the mode does not automatically start playback; call
 *       ::drv2605_go() after the mode is set (except for real-time or
 *       diagnostic modes, which have their own trigger conditions).
 *
 * @param[in] handle  Driver handle obtained from ::drv2605_init.
 * @param[in] mode    Desired operating mode.
 *
 * @return
 *  - ESP_OK on success  
 *  - ESP_ERR_INVALID_ARG if @p handle is NULL  
 *  - Propagated I²C errors from the lower-level driver
 */
esp_err_t drv2605_set_mode(drv2605_handle_t handle, uint8_t mode);

/**
 * @brief Set the real-time playback (RTP) amplitude.
 *
 * When the DRV2605 is in **Real-Time Playback Mode** (MODE = 0x05), the value
 * written to the RTP Input register (0x02) directly modulates the motor drive
 * level on every I²C transaction—no waveform sequencing is used.
 *
 * @param[in] handle  Driver handle returned by ::drv2605_init.
 * @param[in] rtp     Amplitude byte to write (0 – 255).  
 *                    *0x00* = no drive, *0xFF* = maximum drive.
 *
 * @return
 *  - ESP_OK on success  
 *  - ESP_ERR_INVALID_ARG if @p handle is NULL  
 *  - Propagated I²C errors (e.g., ESP_ERR_TIMEOUT, ESP_FAIL)
 *
 * @note Make sure the device is already in real-time mode
 *       (call ::drv2605_set_mode(handle, DRV2605_MODE_REALTIME) first).
 */
esp_err_t drv2605_set_realtime_value(drv2605_handle_t handle, uint8_t rtp);

/**
 * @brief Configure the DRV2605 for an ERM (Eccentric Rotating Mass) motor.
 *
 * Clears the “LRA” selection bits so the driver outputs a standard ERM drive
 * waveform.  Internally this function:
 *  1. Clears bit 7 (*LRA_EN*) in the **FEEDBACK** register (0x1A).
 *  2. Clears bit 5 (*N_LRA*) in the **CONTROL 3** register (0x1D).
 *
 * Call this once during initialization if you are using a conventional ERM
 * vibration motor (the factory default is already ERM, but calling it makes
 * your intent explicit).  For LRA actuators, use ::drv2605_use_lra().
 *
 * @param[in] handle  Driver handle returned by ::drv2605_init. Must not be NULL.
 *
 * @return
 *  - ESP_OK on success  
 *  - ESP_ERR_INVALID_ARG if @p handle is NULL  
 *  - Propagated I²C errors from the lower-level driver
 */
esp_err_t drv2605_use_erm(drv2605_handle_t handle);

/**
 * @brief Configure the DRV2605 for an LRA (Linear Resonant Actuator) motor.
 *
 * Sets the appropriate control bits so the device drives a resonant LRA
 * transducer instead of a conventional ERM motor.  Internally this routine:
 *  1. Sets bit 7 (**LRA_EN**) in the *FEEDBACK* register (0x1A) to 1.  
 *  2. Sets bit 5 (**N_LRA**) in the *CONTROL 3* register (0x1D) to 1.
 *
 * These changes switch the output algorithm and resonance tracking logic to
 * LRA mode.  Call once during initialization if your hardware uses an LRA
 * haptic actuator.  To revert to ERM operation, call ::drv2605_use_erm().
 *
 * @param[in] handle  Driver handle obtained from ::drv2605_init.
 *
 * @return
 *  - ESP_OK on success  
 *  - ESP_ERR_INVALID_ARG if @p handle is NULL  
 *  - I²C-related error codes propagated from the lower-level driver
 */
esp_err_t drv2605_use_lra(drv2605_handle_t handle);

#ifdef __cplusplus
}
#endif
