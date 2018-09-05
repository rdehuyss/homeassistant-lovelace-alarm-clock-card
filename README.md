# Alarm Clock for Home Assistant

In the quest for a perfect Alarm Clock, I'm getting closer, thanks to home assistant.

This card was designed for a tablet which I use on my nightstand with a resolution of 1280px on 800px. 
The idea is to have a really minimalistic, readable clock with some Home Assistant love. 
The card exists out of two parts:
* the clock part (65%) of the height of the screen with:
** the clock of course
** the options to setup alarms
** a nap timer option
* the lower part (35%) of the height of the screen which:
** can show up to 3 other home-assistant cards
** shows the snooze and dismiss button when the alarm is ringing


## Updates
* 2018-09-05: first beta release

### Track Updates
This custom card can be tracked with the help of [custom-lovelace](https://github.com/ciotlosm/custom-lovelace).

In your configuration.yaml

```
custom_updater:
  card_urls:
    - https://raw.githubusercontent.com/rdehuyss/homeassistant-lovelace-alarm-clock-card/master/custom_updater.json
```
# Installation
## Prerequisites
You should have installed the custom_component [hass-variables](https://github.com/rogro82/hass-variables)

### Configuration
#### Copy all files from this repo to:
[home-assistant-root]/www/custom_ui/alarm-clock-card/

#### In your configuration.yml
```
variable:
  alarm_clock:
    value: 'Alarm Clock'
    restore: true
```

#### In your ui-lovelace.yaml

```
resources:
  - url: https://unpkg.com/moment@2.22.2/moment.js
    type: js
  - url: /local/custom_ui/alarm-clock-card/alarm-clock-card.js?v=0.5.0
    type: module
...

  - title: Alarm Clock
    panel: true
    cards:
    - type: vertical-stack
      cards:
        - type: "custom:alarm-clock-card"
          holiday:
            calendars:
              - calendar.amplexor
          cards:
            - type: 'custom:simple-weather-card'
              entity: weather.yweather
            - type: media-control
              entity: media_player.gpm_desktop_player
            - type: "custom:monster-card"
              card:
                title: Devices requiring your attention
                type: entities
              show_empty: false
              filter:
                include:
                  - state: "on"
                  - state: "playing"
                exclude:
                  - domain: group
                  - domain: weather
                  - domain: calendar
                  - domain: input_boolean
                  - domain: binary_sensor
                  - entity_id: switch.licht_nachtkastje
              when:
                entity: group.all_important_devices
                state: 'on'
            - type: "custom:monster-card"
              card:
                title: Quick info
                type: glance
              filter:
                include:
                  - entity_id: group.all_important_devices
                    options:
                      name: "All lights"
                      tap_action: toggle
                  - entity_id: switch.licht_nachtkastje
                    options:
                      name: "Licht nachtkastje"
                      tap_action: toggle
                  - entity_id: binary_sensor.alarm
                  - entity_id: binary_sensor.motion
                  - entity_id: binary_sensor.back_door
                  - entity_id: binary_sensor.front_door
                  - entity_id: sensor.temperature
                  - entity_id: sensor.humidity
                  - entity_id: sensor.illuminance
              when:
                entity: group.all_important_devices
                state: 'off'

```

#### Note:
In my example, the configuration also uses [Simple Weather Card](https://github.com/rdehuyss/homeassistant-lovelace-simple-weather-card)

