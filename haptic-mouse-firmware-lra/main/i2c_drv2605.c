#include "i2c_drv2605.h"

#include <string.h>
#include <stdio.h>
#include "sdkconfig.h"
#include "esp_types.h"
#include "esp_log.h"
#include "esp_check.h"
#include "driver/i2c_master.h"
#include "esp_check.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#define DRV2605_I2C_TIMEOUT_MS  100

static const char *TAG = "i2c-drv2605";

/* Null-pointer guard macro (short form) */
#define CHECK_HANDLE(h) ESP_RETURN_ON_FALSE((h) != NULL, ESP_ERR_INVALID_ARG, TAG, "null handle")

/*---------------------------------------------------------------------------
 *  Public API implementation
 *-------------------------------------------------------------------------*/
esp_err_t drv2605_init(i2c_master_bus_handle_t bus_handle, const drv2605_config_t *drv2605_config, drv2605_handle_t *drv2605_handle)
{
    ESP_RETURN_ON_FALSE(bus_handle, ESP_ERR_INVALID_ARG, TAG, "null handle");

    esp_err_t ret = ESP_OK;

    // allocate handle
    drv2605_handle_t out_handle;
    out_handle = (drv2605_handle_t)calloc(1, sizeof(*out_handle));
    ESP_RETURN_ON_FALSE(out_handle, ESP_ERR_NO_MEM, TAG, "no mem for handle");

    // configure device
    i2c_device_config_t i2c_dev_conf = {
        .scl_speed_hz = drv2605_config->drv2605_device.scl_speed_hz,
        .device_address = drv2605_config->drv2605_device.device_address,
    };

    // add device to bus
    if (out_handle->i2c_dev == NULL) {
        ESP_GOTO_ON_ERROR(i2c_master_bus_add_device(bus_handle, &i2c_dev_conf, &out_handle->i2c_dev), err, TAG, "i2c new bus failed");
    }

    // set default values
    #define W(reg, val)  ESP_GOTO_ON_ERROR(drv2605_write_reg8(out_handle, (reg), (val)), err, TAG, "init reg write failed")
    #define R(reg, p)    ESP_GOTO_ON_ERROR(drv2605_read_reg8 (out_handle, (reg), (p)),  err, TAG, "init reg read failed")

    W(DRV2605_REG_MODE, 0x00); // out of standby

    W(DRV2605_REG_RTPIN, 0x00); // no real-time-playback
  
    W(DRV2605_REG_WAVESEQ1, 1); // strong click
    W(DRV2605_REG_WAVESEQ2, 0); // end sequence
  
    W(DRV2605_REG_OVERDRIVE, 0); // no overdrive
  
    W(DRV2605_REG_SUSTAINPOS, 0);
    W(DRV2605_REG_SUSTAINNEG, 0); 
    W(DRV2605_REG_BREAK, 0); 
    W(DRV2605_REG_AUDIOMAX, 0x64);
  
    // ERM open loop
    uint8_t v;
    // turn off N_ERM_LRA
    R(DRV2605_REG_FEEDBACK, &v);
    W(DRV2605_REG_FEEDBACK, v & 0x7F);   /* clear LRA_EN (bit-7) */
    // turn on ERM_OPEN_LOOP    
    R(DRV2605_REG_CONTROL3, &v);
    W(DRV2605_REG_CONTROL3,  v | 0x20);     /* set ERM_OPEN_LOOP (bit-5) */

    // return handle
    *drv2605_handle = out_handle;
    return ESP_OK;

    // Failure cleanup
err:
    if (out_handle && out_handle->i2c_dev) {
        i2c_master_bus_rm_device(out_handle->i2c_dev);
    }
    free(out_handle);
    return ret;
}

esp_err_t drv2605_write_reg8(drv2605_handle_t handle, uint8_t reg, uint8_t val)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");

    uint8_t buf[2] = { reg, val };

    return i2c_master_transmit(handle->i2c_dev, buf, sizeof(buf), DRV2605_I2C_TIMEOUT_MS);
}

esp_err_t drv2605_read_reg8(drv2605_handle_t handle, uint8_t reg, uint8_t *out_val)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");
    ESP_RETURN_ON_FALSE(out_val, ESP_ERR_INVALID_ARG, TAG, "null out_val pointer");

    return i2c_master_transmit_receive(handle->i2c_dev,
                                        &reg,   1,          /* tx buffer & length */
                                        out_val, 1,         /* rx buffer & length */
                                        DRV2605_I2C_TIMEOUT_MS);
}

esp_err_t drv2605_set_waveform(drv2605_handle_t handle, uint8_t slot, uint8_t waveform_id)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");

    return drv2605_write_reg8(handle, DRV2605_REG_WAVESEQ1 + slot, waveform_id);
}

esp_err_t drv2605_select_library(drv2605_handle_t handle, uint8_t lib)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");

    return drv2605_write_reg8(handle, DRV2605_REG_LIBRARY, lib);
}

esp_err_t drv2605_go(drv2605_handle_t handle)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");

    return drv2605_write_reg8(handle, DRV2605_REG_GO, 1);
}

esp_err_t drv2605_stop(drv2605_handle_t handle)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");

    return drv2605_write_reg8(handle, DRV2605_REG_GO, 0);
}

esp_err_t drv2605_set_mode(drv2605_handle_t handle, uint8_t mode)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");

    return drv2605_write_reg8(handle, DRV2605_REG_MODE, mode);
}

esp_err_t drv2605_set_realtime_value(drv2605_handle_t handle, uint8_t rtp)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");

    return drv2605_write_reg8(handle, DRV2605_REG_RTPIN, rtp);
}

esp_err_t drv2605_use_erm(drv2605_handle_t handle)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");

    uint8_t reg_val;
    esp_err_t err = drv2605_read_reg8(handle, DRV2605_REG_FEEDBACK, &reg_val);

    if (err != ESP_OK) {
        return err;
    }

    reg_val &= 0x7F;  /* clear bit-7 (LRA_EN) */

    return drv2605_write_reg8(handle, DRV2605_REG_FEEDBACK, reg_val);
}

esp_err_t drv2605_use_lra(drv2605_handle_t handle)
{
    ESP_RETURN_ON_FALSE(handle && handle->i2c_dev,ESP_ERR_INVALID_ARG, TAG, "null handle");

    uint8_t reg_val;
    esp_err_t err = drv2605_read_reg8(handle, DRV2605_REG_FEEDBACK, &reg_val);

    if (err!= ESP_OK) {
        return err;
    }

    reg_val |= 0x80;  /* set bit-7 (LRA_EN) */

    return drv2605_write_reg8(handle, DRV2605_REG_FEEDBACK, reg_val);
}