idf_component_register(
    SRCS "tusb_hid_main.c" "i2c_drv2605.c" "drv2605_effects.c"
    INCLUDE_DIRS "."
    PRIV_REQUIRES esp_driver_gpio driver
    )
