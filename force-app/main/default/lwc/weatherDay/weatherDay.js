import { api, track } from "lwc";
import LightningModal from 'lightning/modal';
//images
//https://www.visualcrossing.com/resources/documentation/weather-api/defining-icon-set-in-the-weather-api/
import sunny from '@salesforce/resourceUrl/weather_sunny';
import clearNight from '@salesforce/resourceUrl/weather_clear_night';
import rain from '@salesforce/resourceUrl/weather_rain';
import nightRain from '@salesforce/resourceUrl/weather_night_rain';
import snow from '@salesforce/resourceUrl/weather_snow';
import storm from '@salesforce/resourceUrl/weather_storm';
import windy from '@salesforce/resourceUrl/weather_windy';
import cloudy from '@salesforce/resourceUrl/weather_cloudy';
import cloudyNight from '@salesforce/resourceUrl/weather_cloudy_night';
import rainPercent from '@salesforce/resourceUrl/weather_rain_percent';
import {getMonth} from 'c/programBuilderHelper'
//https://www.iconfinder.com/icons/2682827/cloud_day_light_bolt_rain_sun_thunderstorm_weather_icon
const months = {1:'January', 2:'Feburary', 3: 'March', 4:'April', 5:'May', 6:'June', 7:'July', 8:'August', 9:'September', 10:'October',11:'November', 12:'December'}
export default class WeatherDay extends LightningModal{
    headerLabel='Day Over View'
    loaded = false; 
    @api dayInfo
    @api lattitude;
    @api longitude; 
    currentIcon; 
    month; 
    hour = []
    sun = sunny; 
    clearNight = clearNight
    rain = rain;
    nightRain = nightRain;
    snow=snow
    storm = storm;
    windy = windy;
    cloudy = cloudy
    cloudyNight = cloudyNight
    rainPercent = rainPercent
    weatherIcons= {'snow':this.snow, 'rain': this.rain, 'fog': this.cloudy, 'wind': this.windy, 'cloudy': this.cloudy, 'partly-cloudy-day': this.cloudy, 'partly-cloudy-night': this.cloudyNight, 'clear-day': this.sun, 'clear-night':this.clearNight}
    connectedCallback() {
        //code
        this.displayData()
    }

    async displayData(){
        console.log('day info');
        console.log(this.dayInfo)
       let {accdegreedays,description, feelslike, temp,tempmax,tempmin,datetime, day, hours, icon } = this.dayInfo
       let numMonth = months[Number(datetime.slice(5,7))]
       let todayNumber = new Date().getDate(); 
       this.month = `${numMonth} - ${day}`
       this.currentIcon = this.weatherIcons[icon]
       //hourly
       let curHour = new Date().getHours();
       let future = hours.map((x)=>{
        let hour = Number(x.datetime.slice(0,2))
        //let normalTime = Number(x.datetime.slice(0,2)) - 12
        //let ampm = Number(x.datetime.slice(0,2)) - 12 <= 12 ? 'pm' : 'am'; 
        let displayTime = this.setHour(hour)
        let icon = this.weatherIcons[x.icon]
        return {...x, hour, displayTime, icon}
       })
       
       let ahead = day === todayNumber ? future.filter(({hour})=> hour > curHour): future;
       console.log(1,ahead)
       this.hour = [...ahead]
    }

    setHour(data){
        let back
        if(data<12){
            back= `${data} am`
        }else if(data === 0){
            back = `12 am`
         }else if(data === 12){
           back = `${data} pm`
        }else{
           let x = data -12
            back =`${x} pm`
        }
        return back;
    }
    async getHistory(){
        console.log(this.dayInfo)
        //  try {  
        //         let endPoint = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/39.89833062467567%2C%20-86.14610232546177/2024-02-01/2024-03-08?unitGroup=us&elements=datetime%2Ctempmax%2Ctempmin%2Cdegreedays%2Caccdegreedays%2Csoiltemp01%2Csoiltemp04%2Csoilmoisture01%2Csoilmoisture04&key=SC9NP46DF9TQT57GAHLWSDALA&contentType=json&degreeDayMethod=average&degreeDayTempMaxThreshold=85&degreeDayTempBase=32&degreeDayStartDate=2024-01-01`

        //         //let endPoint = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${this.lattitude}%2C${this.longitude}/2024-01-01/2024-03-03?key=SC9NP46DF9TQT57GAHLWSDALA`
        //         const response = await fetch(endPoint);
                                
        //         if (!response.ok) {
        //                 throw new Error(`Response status: ${response.status}`);
        //         }
                            
        //         const json = await response.json();
        //         console.log(json)                        
                                
                                
        //     } catch (error) {
        //         console.error(error.message);
        //     }
                this.loaded = true; 
             
            
    }
    handleClose(){
        this.close('cancel')
    }
}