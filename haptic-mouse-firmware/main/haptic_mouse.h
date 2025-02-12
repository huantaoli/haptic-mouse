#pragma once

#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "sdkconfig.h"
#include "esp_err.h"
#include "esp_log.h"
#include "esp_check.h"
#include "freertos/queue.h"

extern QueueHandle_t xAudioCommandQueue;

typedef struct {
    char cmd;
    char audio_id;
} audio_command_t;

void cmd_task(void *arg);
void i2s_task(void *arg);
