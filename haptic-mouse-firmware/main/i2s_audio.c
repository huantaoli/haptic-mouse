#include "haptic_mouse.h"

#include <string.h>
#include <sys/stat.h>
#include <unistd.h>
#include "esp_system.h"
#include "esp_littlefs.h"
#include "driver/i2s_std.h"
#include "driver/gpio.h"

#define EXAMPLE_BUFF_SIZE               4096

#define CCCC(c1, c2, c3, c4)    ((c4 << 24) | (c3 << 16) | (c2 << 8) | c1)

static i2s_chan_handle_t                tx_chan;        // I2S tx channel handler

static const char *TAG = "i2s_task";

static void i2s_example_init_std_simplex(void);
static void i2s_example_write_task(void);
void i2s_read_wav_file(const char* filename);

void i2s_task(void *arg)
{
    ESP_LOGI(TAG, "Initializing LittleFS");

    esp_vfs_littlefs_conf_t conf = {
        .base_path = "/littlefs",
        .partition_label = "storage",
        .format_if_mount_failed = true,
        .dont_mount = false,
    };

    // Use settings defined above to initialize and mount LittleFS filesystem.
    // Note: esp_vfs_littlefs_register is an all-in-one convenience function.
    esp_err_t ret = esp_vfs_littlefs_register(&conf);

    if (ret != ESP_OK) {
        if (ret == ESP_FAIL) {
            ESP_LOGE(TAG, "Failed to mount or format filesystem");
        } else if (ret == ESP_ERR_NOT_FOUND) {
            ESP_LOGE(TAG, "Failed to find LittleFS partition");
        } else {
            ESP_LOGE(TAG, "Failed to initialize LittleFS (%s)", esp_err_to_name(ret));
        }
        return;
    }

    size_t total = 0, used = 0;
    ret = esp_littlefs_info(conf.partition_label, &total, &used);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to get LittleFS partition information (%s)", esp_err_to_name(ret));
        esp_littlefs_format(conf.partition_label);
    } else {
        ESP_LOGI(TAG, "Partition size: total: %d, used: %d", total, used);
    }

    // initialize I2S 
    ESP_LOGI(TAG, "Initializing I2S");
    i2s_example_init_std_simplex();
    ESP_ERROR_CHECK(i2s_channel_enable(tx_chan));

    audio_command_t cmd;
    while (1) {
        if (xQueueReceive(xAudioCommandQueue, &cmd, portMAX_DELAY)) {
            ESP_LOGI(TAG, "Received command: %d, %d", cmd.cmd, cmd.audio_id);
            char filename[20];
            sprintf(filename, "/littlefs/%d.wav", cmd.audio_id);
            i2s_read_wav_file(filename);
        }
    }
    // 关闭I2S
    // i2s_channel_disable(tx_chan);
}

void i2s_read_wav_file(const char* filename)
{
    // 打开文件进行读取
    FILE *f = fopen(filename, "rb");
    // FILE *f = fopen("/littlefs/1.wav", "rb");

    if (f == NULL) 
    {
        ESP_LOGI("AUDIO", "Failed to open file for reading");
    } 
    else 
    {
        fseek(f, 12, SEEK_SET); // 重新将指针指向subchunkID

        uint32_t subChunkID = 0;
        uint32_t subChunkSize = 0;

        while(1){
            fread(&subChunkID, sizeof(uint32_t), 1, f); // 读取subchunkID
            fread(&subChunkSize, sizeof(uint32_t), 1, f); // 读取subchunkSize

            // 将subchunkID转换为字符串
            char subChunkIDStr[5];
            memcpy(subChunkIDStr, &subChunkID, 4);
            subChunkIDStr[4] = '\0';
            ESP_LOGI("AUDIO", "subchunkID: %s, subchunkSize: %ld", subChunkIDStr, subChunkSize);

            // 如果不是data块，则跳过
            if (subChunkID != CCCC('d', 'a', 't', 'a')) {
                fseek(f, subChunkSize, SEEK_CUR);
            } else {
                break;
            }
        }
        
        // 读取wavData
        size_t BytesWritten;
        uint8_t *wavBuffer = (uint8_t *)malloc(subChunkSize);
        fread(wavBuffer, sizeof(char), subChunkSize, f); // 读文件

        // preloaded data
        // ESP_ERROR_CHECK(i2s_channel_preload_data(tx_chan, wavBuffer, subChunkSize, &BytesWritten));
        // ESP_ERROR_CHECK(i2s_channel_enable(tx_chan));

        if (i2s_channel_write(tx_chan, wavBuffer, subChunkSize, &BytesWritten, portMAX_DELAY) == ESP_OK) {
            ESP_LOGI("AUDIO", "Write Task: i2s write %d bytes", BytesWritten);
        } else {
            ESP_LOGE("AUDIO", "Write Task: i2s write failed");
        }
        free(wavBuffer);
    }
    // 关闭文件
    fclose(f);
}

static void i2s_example_write_task(void)
{
    uint8_t *w_buf = (uint8_t *)calloc(1, EXAMPLE_BUFF_SIZE);
    assert(w_buf); // Check if w_buf allocation success

    /* Assign w_buf */
    for (int i = 0; i < EXAMPLE_BUFF_SIZE; i += 8) {
        w_buf[i]     = 0x12;
        w_buf[i + 1] = 0x34;
        w_buf[i + 2] = 0x56;
        w_buf[i + 3] = 0x78;
        w_buf[i + 4] = 0x9A;
        w_buf[i + 5] = 0xBC;
        w_buf[i + 6] = 0xDE;
        w_buf[i + 7] = 0xF0;
    }

    size_t w_bytes = EXAMPLE_BUFF_SIZE;

    /* (Optional) Preload the data before enabling the TX channel, so that the valid data can be transmitted immediately */
    while (w_bytes == EXAMPLE_BUFF_SIZE) {
        /* Here we load the target buffer repeatedly, until all the DMA buffers are preloaded */
        ESP_ERROR_CHECK(i2s_channel_preload_data(tx_chan, w_buf, EXAMPLE_BUFF_SIZE, &w_bytes));
    }

    /* Enable the TX channel */
    ESP_ERROR_CHECK(i2s_channel_enable(tx_chan));

    /* Write i2s data */
    if (i2s_channel_write(tx_chan, w_buf, EXAMPLE_BUFF_SIZE, &w_bytes, 1000) == ESP_OK) {
        printf("Write Task: i2s write %d bytes\n", w_bytes);
    } else {
        printf("Write Task: i2s write failed\n");
    }
//     vTaskDelay(pdMS_TO_TICKS(200));

    free(w_buf);
}

static void i2s_example_init_std_simplex(void)
{
    /* Setp 1: Determine the I2S channel configuration and allocate two channels one by one
     * The default configuration can be generated by the helper macro,
     * it only requires the I2S controller id and I2S role
     * The tx and rx channels here are registered on different I2S controller,
     * Except ESP32 and ESP32-S2, others allow to register two separate tx & rx channels on a same controller */
//     i2s_chan_config_t tx_chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_AUTO, I2S_ROLE_MASTER);
    i2s_chan_config_t tx_chan_cfg = {
        .id = I2S_NUM_AUTO,
        .role = I2S_ROLE_MASTER,
        .dma_desc_num = 6,
        .dma_frame_num = 240,
        .auto_clear_after_cb = true,
        .auto_clear_before_cb = true,
        .intr_priority = 0,
    };
    ESP_ERROR_CHECK(i2s_new_channel(&tx_chan_cfg, &tx_chan, NULL));

    /* Step 2: Setting the configurations of standard mode and initialize each channels one by one
     * The slot configuration and clock configuration can be generated by the macros
     * These two helper macros is defined in 'i2s_std.h' which can only be used in STD mode.
     * They can help to specify the slot and clock configurations for initialization or re-configuring */
    i2s_std_config_t tx_std_cfg = {
        .clk_cfg  = I2S_STD_CLK_DEFAULT_CONFIG(44100),
        .slot_cfg = I2S_STD_MSB_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO),
        .gpio_cfg = {
            .mclk = I2S_GPIO_UNUSED,    // some codecs may require mclk signal, this example doesn't need it
            .bclk = CONFIG_MAX98357A_BCLK_GPIO,
            .ws   = CONFIG_MAX98357A_LRC_GPIO,
            .dout = CONFIG_MAX98357A_DIN_GPIO,
            .din  = I2S_GPIO_UNUSED,
            .invert_flags = {
                .mclk_inv = false,
                .bclk_inv = false,
                .ws_inv   = false,
            },
        },
    };
    ESP_ERROR_CHECK(i2s_channel_init_std_mode(tx_chan, &tx_std_cfg));
}
