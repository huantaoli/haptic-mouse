#include "haptic_mouse.h"

#include "driver/usb_serial_jtag.h"

#define BUF_SIZE (128)

#define CMD_START 0xAA
#define CMD_STOP 0x55

#define TAG "cmd_task"

bool parse_command(uint8_t *data, int len, audio_command_t *cmd);
bool validate_command(uint8_t *data, int len);
uint8_t calculate_checksum(uint8_t *data, int len);

void cmd_task(void *arg)
{
    // Configure USB SERIAL JTAG
    usb_serial_jtag_driver_config_t usb_serial_jtag_config = {
        .rx_buffer_size = BUF_SIZE,
        .tx_buffer_size = BUF_SIZE,
    };

    ESP_ERROR_CHECK(usb_serial_jtag_driver_install(&usb_serial_jtag_config));
    ESP_LOGI(TAG, "USB_SERIAL_JTAG init done");

    // Configure a temporary buffer for the incoming data
    uint8_t *data = (uint8_t *) malloc(BUF_SIZE);
    if (data == NULL) {
        ESP_LOGE(TAG, "no memory for data");
        return;
    }

    audio_command_t cmd;

    while (1) {
        int len = usb_serial_jtag_read_bytes(data, (BUF_SIZE - 1), 20 / portTICK_PERIOD_MS);

        if (len) {
            if (!parse_command(data, len, &cmd)) {
                ESP_LOGE(TAG, "Invalid command");
                // Write Invalid command(FF FF FF FF FF) back to the USB SERIAL JTAG
                usb_serial_jtag_write_bytes("\xFF\xFF\xFF\xFF\xFF", 5, 20 / portTICK_PERIOD_MS);
                continue;
            } else {
                xQueueSend(xAudioCommandQueue, &cmd, 0);
                // Write data back to the USB SERIAL JTAG
                usb_serial_jtag_write_bytes((const char *) data, len, 20 / portTICK_PERIOD_MS);
                ESP_LOGI(TAG, "Received command: %d, %d", cmd.cmd, cmd.audio_id);
            }
        }
    }
}

// +------+------+----------+--------+------+
// | START | CMD  | AUDIO_ID | CHECKSUM | END |
// +------+------+----------+--------+------+
// | 0xAA | 0x01 | 0x01     | 0x03     | 0x55 |
bool parse_command(uint8_t *data, int len, audio_command_t *cmd)
{
    if (!validate_command(data, len)) {
        return false;
    }

    cmd->cmd = data[1];
    cmd->audio_id = data[2];

    return true;
}

bool validate_command(uint8_t *data, int len)
{
    if (len < 5) {
        return false;
    }

    if (data[0] != CMD_START || data[len - 1] != CMD_STOP) {
        return false;
    }

    uint8_t checksum = calculate_checksum(data + 1, len - 3);
    if (checksum != data[len - 2]) {
        return false;
    }

    return true;
}

uint8_t calculate_checksum(uint8_t *data, int len)
{
    uint8_t checksum = 0;
    for (int i = 0; i < len; i++) {
        checksum += data[i];
    }
    return checksum;
}
