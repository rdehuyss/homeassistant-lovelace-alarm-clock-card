# Alarm Clock for Home Assistant

In the quest for a perfect Alarm Clock, I'm getting closer, thanks to home assistant.

This card was designed for a tablet which I use on my nightstand with a resolution of 1280px on 800px. 
The idea is to have a really minimalistic, readable clock with some Home Assistant love. 

## Screenshots love...
![](https://i.imgur.com/sP5DNxC.png "1")
![](https://i.imgur.com/6Mbs0H6.png "2")
![](https://i.imgur.com/sMX4Ru9.png "3")
![](https://i.imgur.com/E3QcX0F.png "4")
![](https://i.imgur.com/ErtOXPq.png "5")

## Note:
- This card is still in beta and it scratches my own itch. No support/guarantees/.... It may eat your dog or the alarm may not go off and you can thus miss a date with the love of your live, ...
- I tried to solve the alarm in the backend using timers, ... but did not succeed due to some outstanding bugs. So, this means that the logic to *fire the alarm is in the frontend*. If you close your browser, it will not go off. But, since it was designed for an always on tablet (for me a Nexus 7 2013 which is always running and has this constantly open), it appears to work


## Features
### User interface
The card exists out of two parts:
* the clock part (65%) of the height of the screen with:
  * the clock of course
  * the options to setup alarms
  * the option to override/update the next alarm
  * a nap timer option
* the lower part (35%) of the height of the screen which:
  * can show up to 3 other home-assistant cards
  * shows the snooze and dismiss button when the alarm is ringing
  
### Alarm - and PreAlarm options
* You can define multiple entities that will turn on when the alarm goes off, including lights, input_booleans, scripts and media_players. Configuration is as follows:

```
  ...
  alarm_entities:
    - entity_id: input_boolean.alarm_clock
    - entity_id: media_player.gpm_desktop_player
  ...
```
* You can also specify pre-alarm options, think off having your Philips Hue light slowly starting an half hour before the alarm. Configuration is as follows:

```
  ...
  scripts:
    - entity: script.start_lights_bedroom_slowly
      when: '-00:30'
    - entity: light.bathroom
      when: on_dismiss
  ...
```

### Holiday integration
But wait, that's not all! It also integrates with:
* a holiday calendar so that when you have a holiday the next day, your alarm will automatically disable.
* the workday sensor so that when you have a holiday the next day, your alarm will automatically disable.

## Updates
* 2018-09-07: more features...
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
`[home-assistant-root]/www/custom_ui/alarm-clock-card/`

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
  - url: https://unpkg.com/moment@2.22.2/min/moment.min.js
    type: js
  - url: https://cdn.jsdelivr.net/npm/flatpickr
    type: js
  - url: https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css
    type: css
  - url: /local/custom_ui/alarm-clock-card/alarm-clock-card.js?v=0.5.0
    type: module
...

  - title: Alarm Clock
    panel: true
    cards:
    - type: vertical-stack
      cards:
        - type: "custom:alarm-clock-card"
          alarm_entities:
            - entity_id: input_boolean.alarm_clock
            - entity_id: media_player.gpm_desktop_player
          scripts:
            - entity: script.start_lights_bedroom_slowly
              when: '-00:30'
            - entity: light.bathroom
              when: on_dismiss
          holiday:
            calendars:
              - calendar.holidays
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

