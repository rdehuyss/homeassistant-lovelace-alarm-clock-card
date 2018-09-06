export class AlarmController {

    constructor(config) {
        this.config = config;
    }

    set hass(hass) {
        this._hass = hass;
        this._alarmClockConfiguration = null;
        this._evaluate();
    }

    get alarmRingingEntity() {
        return this._hass.states[`input_boolean.${this.config.name}_ringing`];
    }

    get alarmClockVariableEntity() {
        return this._hass.states[`variable.${this.config.name}`];
    }

    get alarmClockConfiguration() {
        if(! this._alarmClockConfiguration) {
            this._alarmClockConfiguration = Object.assign(new AlarmConfiguration, this.alarmClockVariableEntity.attributes);
        }
        return this._alarmClockConfiguration;
    }

    saveAlarmClockConfiguration(configuration) {
        this._saveConfiguration(configuration);
    }

    isConfigCorrect() {
        return this.alarmClockVariableEntity
            && this.alarmRingingEntity;
    }

    snooze() {
        let alarmClockConfiguration = this.alarmClockConfiguration;
        alarmClockConfiguration.snooze(10);
        this._saveConfiguration(alarmClockConfiguration);
        this._alarmRingingOff(); //must be at end
    }

    dismiss() {
        let alarmClockConfiguration = this.alarmClockConfiguration;
        alarmClockConfiguration.dismiss();
        this._saveConfiguration(alarmClockConfiguration);
        this._alarmRingingOff(); //must be at end
    }

    get nextAlarm() {
        let nextAlarm = this.alarmClockConfiguration.nextAlarm;

        if(!nextAlarm) {
            return {enabled: false};
        }

        if(nextAlarm.overriden) {
            return nextAlarm;
        }

        if(this._nextAlarmIsAHolidayAccordingToCalendar(nextAlarm) 
            || this._nextAlarmIsAHolidayAccordingToWorkdaySensor(nextAlarm)) {
            return {
                ...nextAlarm,
                enabled: false,
                holiday: true
            };
        }

        return nextAlarm;
    }

    _nextAlarmIsAHolidayAccordingToCalendar(nextAlarm) {
        if(this.config.holiday && this.config.holiday.calendars) {
            for(let calendar_entity_id of this.config.holiday.calendars) {
                if(this._hass.states[calendar_entity_id]) {
                    const startDate = moment(this._hass.states[calendar_entity_id].attributes.start_time, "YYYY-MM-DD HH:mm:ss");
                    const endDate = moment(this._hass.states[calendar_entity_id].attributes.end_time, "YYYY-MM-DD HH:mm:ss");
    
                    if(moment(`${nextAlarm.date} ${nextAlarm.time}`, 'YYYY-MM-DD HH:mm').isBetween(startDate, endDate, 'minutes', '[]')) {
                        return true;
                    }
                } else {
                    console.warn(`Could not find calendar ${calendar_entity_id} in hass.states`);
                }
            }
        }
        return false;
    }

    _nextAlarmIsAHolidayAccordingToWorkdaySensor(nextAlarm) {
        let { workdaySensor, workdayTomorrowSensor } = this._getWorkdaySensors();
        if(workdaySensor && workdayTomorrowSensor) {
            let now = moment().format('HH:mm');
            if(now <= nextAlarm.time && workdaySensor.state == 'off') {
                return true;
            } else if(now >= nextAlarm.time && workdayTomorrowSensor.state == 'off') {
                return true;
            }
        }
        return false;
    }

    workdaySensorContainsSaturdayOrSunday() {
        let { workdaySensor } = this._getWorkdaySensors();
        if(workdaySensor) {
            if(workdaySensor.attributes.excludes.includes('sat') || workdaySensor.attributes.excludes.includes('sun')) {
                return true;
            }
        }
        return false;
    }

    _getWorkdaySensors() {
        if(this.config.holiday && this.config.holiday.workday_sensor && this.config.holiday.workday_sensor_tomorrow) {
            return { workdaySensor: this._hass.states[this.config.holiday.workday_sensor], workdayTomorrowSensor: this._hass.states[this.config.holiday.workday_sensor_tomorrow] };
        }
        return { workdaySensor: null, workdayTomorrowSensor: null} ;
    }

    set nextAlarm(nextAlarm) {
        let alarmClockConfiguration = this.alarmClockConfiguration;
        alarmClockConfiguration.nextAlarm = {
            ...AlarmConfiguration.createNextAlarm(nextAlarm),
            overriden: true
        };
        this._saveConfiguration(alarmClockConfiguration);
    }

    get isAlarmEnabled() {
        let nextAlarm = this.nextAlarm;

        if(nextAlarm.overriden && nextAlarm.enabled) {
            return true;
        }
        return this.alarmClockConfiguration.alarmsEnabled && nextAlarm.enabled;
    }

    isAlarmRinging() {
        return this.alarmRingingEntity.state == 'on';
    }

    _evaluate() {
        if(!this.alarmClockConfiguration.alarmsEnabled) {
            return;
        }

        let nextAlarm = this.nextAlarm;
        if(! nextAlarm.enabled) {
            return;
        }
        
        if(!this.isAlarmRinging() && moment().format('HH:mm') == nextAlarm.time) {
            this._alarmRingingOn();
        } else if(this.isAlarmRinging()) {
            //TODO: configure 10 minutes
            if(moment(nextAlarm.time, "HH:mm").add(10, 'minutes').format('HH:mm') == moment().format('HH:mm')) {
                this.dismiss();
            }
        }
    }

    _alarmRingingOn() {
        this._callAlarmRingingService('turn_on');
    }

    _alarmRingingOff() {
        this._callAlarmRingingService('turn_off');
    }

    _callAlarmRingingService(action) {
        this._hass.callService('input_boolean', action, {"entity_id": this.alarmRingingEntity.entity_id});
    }

    _saveConfiguration(configuration) {
        let actualConfiguration = configuration;
        if(! (configuration instanceof AlarmConfiguration)) {
            actualConfiguration = Object.assign(new AlarmConfiguration, configuration);
        }

        //reset next alarm after being disabled and now being re-enabled
        if(actualConfiguration.alarmsEnabled && this.alarmClockConfiguration.alarmsEnabled == false) {
            actualConfiguration.dismiss();
        }

        let configurationWithLastUpdated = {
            ...actualConfiguration,
            lastUpdated: moment().format('YYYY-MM-DD HH:mm:ss')
        }
        const param = {
            variable: "alarm_clock",
            attributes: configurationWithLastUpdated,
            replace_attributes: true
        };
        this._hass.callService('variable', 'set_variable', param);
        this._alarmClockConfiguration = Object.assign(new AlarmConfiguration, configurationWithLastUpdated);
    }
}

export class AlarmConfiguration {
    
    constructor() {
        this.alarmsEnabled = false;
        this.nextAlarm = {enabled: false, time: "08:00"};
        this.mo = {enabled: false, time: "07:00"}
        this.tu = {enabled: false, time: "07:00"}
        this.we = {enabled: false, time: "07:00"}
        this.th = {enabled: false, time: "07:00"}
        this.fr = {enabled: false, time: "07:00"}
        this.sa = {enabled: false, time: "09:00"}
        this.su = {enabled: false, time: "09:00"}
    }

    snooze(minutes) {
        let nextAlarmTime = moment(this.nextAlarm.time, 'HH:mm').add(minutes, 'minutes');
        this.nextAlarm = {
            ...this.nextAlarm,
            enabled: true,
            snooze: true,
            time: nextAlarmTime.format('HH:mm'),
            dateTime: nextAlarmTime.format('YYYY-MM-DD HH:mm')
        }
    }

    dismiss() {
        const momentTomorrow = moment().add(1, 'days');
        const alarmTomorrow = this[momentTomorrow.format('dd').toLowerCase()];
        this.nextAlarm = AlarmConfiguration.createNextAlarm(alarmTomorrow);
    }

    static createNextAlarm(alarm) {
        let now = moment();
        if(alarm.time <= now.format('HH:mm')) {
            now.add(1, 'days');
        }
        return {
            ...alarm,
            date: now.format('YYYY-MM-DD'),
            dateTime: `${now.format('YYYY-MM-DD')} ${alarm.time}`,
        }
    }
}