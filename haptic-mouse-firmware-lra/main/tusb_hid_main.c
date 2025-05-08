/*
 * SPDX-FileCopyrightText: 2022-2024 Espressif Systems (Shanghai) CO LTD
 *
 * SPDX-License-Identifier: Unlicense OR CC0-1.0
 */

#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include "sdkconfig.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "tinyusb.h"
#include "class/hid/hid_device.h"
#include "driver/i2c_master.h"
#include "driver/gpio.h"

#include "i2c_drv2605.h"
#include "drv2605_effects.h"

#define I2C_SCL_GPIO 5
#define I2C_SDA_GPIO 6
#define DRV_EN_GPIO  7
#define MASTER_FREQUENCY 400000

static const char *TAG = "app_main";

// DRV2605 handle
drv2605_handle_t drv2605_handle;

/************* TinyUSB descriptors ****************/

#define TUSB_DESC_TOTAL_LEN      (TUD_CONFIG_DESC_LEN + CFG_TUD_HID * TUD_HID_DESC_LEN)

/**
 * @brief HID report descriptor
 */
const uint8_t hid_report_descriptor[] = {
    HID_USAGE_PAGE(0x0E), // Haptics page
    HID_USAGE(0x01), // Simple Haptic Controller
    HID_COLLECTION(HID_COLLECTION_APPLICATION), // Application
        HID_REPORT_ID(0x10) // Haptic report ID
        HID_LOGICAL_MIN(0x00),
        HID_LOGICAL_MAX(0xFF), // 8-bit (0-255)
        HID_USAGE(0x01), // Just one actuator
        HID_USAGE_MIN(0x01),
        HID_USAGE_MAX(0x01),
        HID_REPORT_SIZE(0x08),
        HID_REPORT_COUNT(0x01),
        HID_OUTPUT( HID_DATA | HID_VARIABLE | HID_ABSOLUTE ), // Output (Data,Var,Abs)
    HID_COLLECTION_END
};

/**
 * @brief String descriptor
 */
const char* hid_string_descriptor[5] = {
    // array of pointer to string descriptors
    (char[]){0x09, 0x04},  // 0: is supported language is English (0x0409)
    "TinyUSB",             // 1: Manufacturer
    "TinyUSB Device",      // 2: Product
    "123456",              // 3: Serials, should use chip ID
    "Example HID interface",  // 4: HID
};

/**
 * @brief Configuration descriptor
 *
 * This is a simple configuration descriptor that defines 1 configuration and 1 HID interface
 */
static const uint8_t hid_configuration_descriptor[] = {
    // Configuration number, interface count, string index, total length, attribute, power in mA
    TUD_CONFIG_DESCRIPTOR(1, 1, 0, TUSB_DESC_TOTAL_LEN, TUSB_DESC_CONFIG_ATT_REMOTE_WAKEUP, 100),

    // Interface number, string index, boot protocol, report descriptor len, EP In address, size & polling interval
    TUD_HID_DESCRIPTOR(0, 4, false, sizeof(hid_report_descriptor), 0x81, 16, 10),
};

/********* TinyUSB HID callbacks ***************/

// Invoked when received GET HID REPORT DESCRIPTOR request
// Application return pointer to descriptor, whose contents must exist long enough for transfer to complete
uint8_t const *tud_hid_descriptor_report_cb(uint8_t instance)
{
    // We use only one interface and one HID report descriptor, so we can ignore parameter 'instance'
    return hid_report_descriptor;
}

// Invoked when received GET_REPORT control request
// Application must fill buffer report's content and return its length.
// Return zero will cause the stack to STALL request
uint16_t tud_hid_get_report_cb(uint8_t instance, uint8_t report_id, hid_report_type_t report_type, uint8_t* buffer, uint16_t reqlen)
{
    (void) instance;
    (void) report_id;
    (void) report_type;
    (void) buffer;
    (void) reqlen;

    return 0;
}

// Invoked when received SET_REPORT control request or
// received data on OUT endpoint ( Report ID = 0, Type = 0 )
void tud_hid_set_report_cb(uint8_t instance, uint8_t report_id, hid_report_type_t report_type, uint8_t const* buffer, uint16_t bufsize)
{
    if (report_type == HID_REPORT_TYPE_OUTPUT && report_id == 0x10 && bufsize >= 1) {
        ESP_LOGI("HID_set_cb", "Received HID: %d", buffer[0]);
        ESP_LOGI("drv2605", "Play %s", drv2605_effect_names[buffer[0]]);
        // set the effect to play
        drv2605_stop(drv2605_handle);
        // set the waveform 
        drv2605_set_waveform(drv2605_handle, 0, buffer[0]);
        // end waveform
        drv2605_set_waveform(drv2605_handle, 1, 0);
        // play the effect!
        drv2605_go(drv2605_handle);
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "ENABLE DRV2605");
    gpio_reset_pin(DRV_EN_GPIO);
    gpio_set_direction(DRV_EN_GPIO, GPIO_MODE_OUTPUT);
    gpio_set_level(DRV_EN_GPIO, 1);

    ESP_LOGI(TAG, "DRV2605 initialization");
    //set i2c pins
    i2c_master_bus_config_t i2c_bus_config = {
        .clk_source = I2C_CLK_SRC_DEFAULT,
        .i2c_port = I2C_NUM_0,
        .scl_io_num = I2C_SCL_GPIO,
        .sda_io_num = I2C_SDA_GPIO,
        .flags.enable_internal_pullup = true,
    };
    i2c_master_bus_handle_t bus_handle;
    ESP_ERROR_CHECK(i2c_new_master_bus(&i2c_bus_config, &bus_handle));

    drv2605_config_t drv2605_config = {
        .drv2605_device.scl_speed_hz = 400000,
        .drv2605_device.device_address = DRV2605_ADDR,
    };

    ESP_ERROR_CHECK(drv2605_init(bus_handle, &drv2605_config, &drv2605_handle));
    ESP_LOGI(TAG, "DRV2605 initialization DONE");

    ESP_LOGI(TAG, "DRV2605 configuration");
    // use LRA mode
    drv2605_use_lra(drv2605_handle);

    // set waveform library
    drv2605_select_library(drv2605_handle, 1);
    drv2605_set_mode(drv2605_handle, DRV2605_MODE_INTTRIG);
    drv2605_go(drv2605_handle);
    ESP_LOGI(TAG, "DRV2605 configuration DONE");

    ESP_LOGI(TAG, "USB initialization");
    const tinyusb_config_t tusb_cfg = {
        .device_descriptor = NULL,
        .string_descriptor = hid_string_descriptor,
        .string_descriptor_count = sizeof(hid_string_descriptor) / sizeof(hid_string_descriptor[0]),
        .external_phy = false,
        .configuration_descriptor = hid_configuration_descriptor,
    };

    ESP_ERROR_CHECK(tinyusb_driver_install(&tusb_cfg));
    ESP_LOGI(TAG, "USB initialization DONE");

    while (1) {
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}
