#include "haptic_mouse.h"

#include "driver/gpio.h"

// 定义队列，用于存储音频片段播放命令
QueueHandle_t xAudioCommandQueue;

#define CMD_TASK_STACK_SIZE (4096)
#define BLINK_TASK_STACK_SIZE (4096)
#define I2S_TASK_STACK_SIZE (4096*10)

static void blink_task(void *arg)
{
    gpio_reset_pin(CONFIG_BLINK_GPIO);
    gpio_set_direction(CONFIG_BLINK_GPIO, GPIO_MODE_OUTPUT);
    while (1) {
        vTaskDelay(CONFIG_BLINK_PERIOD / portTICK_PERIOD_MS);
        ESP_LOGI("blink_task", "Turning off the LED");
        gpio_set_level(CONFIG_BLINK_GPIO, 0);
        vTaskDelay(CONFIG_BLINK_PERIOD / portTICK_PERIOD_MS);
        ESP_LOGI("blink_task", "Turning on the LED");
        gpio_set_level(CONFIG_BLINK_GPIO, 1);
    }
}

void app_main(void)
{
    xAudioCommandQueue = xQueueCreate(10, sizeof(audio_command_t));
    if (xAudioCommandQueue == NULL) {
        ESP_LOGE("app_main", "Create xAudioCommandQueue failed");
        return;
    }

    xTaskCreate(cmd_task, "CMD_task", CMD_TASK_STACK_SIZE, NULL, 10, NULL);
    xTaskCreate(i2s_task, "I2S_task", I2S_TASK_STACK_SIZE, NULL, 10, NULL);
    // xTaskCreate(blink_task, "blink_task", BLINK_TASK_STACK_SIZE, NULL, 10, NULL);
}
