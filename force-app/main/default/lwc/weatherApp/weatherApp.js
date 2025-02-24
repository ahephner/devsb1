import { LightningElement, api } from 'lwc';
import getApps from '@salesforce/apex/appProduct.getApps';
import {roundNum} from 'c/helper'

// Example :- import TRAILHEAD_LOGO from '@salesforce/resourceUrl/trailhead_logo';'
export default class WeatherApp extends LightningElement {
    @api recordId; 
    lat;
    long; 
    station;
    temp;
    accDDays;
    feelLike;
    desc; 
    clouds;
    humidity;
    windSpeed;
    tempIcon; 
    badTwo = 'd12a8c53d866c8387d347b0fc6ff2b64' 
    badAPIExample = 'SC9NP46DF9TQT57GAHLWSDALA';
    convertMMPerHour = 0.03937713512277;
    warning = false;
    warningText;
    warningEnds
    futureWeather = []
    connectedCallback(){
        this.getWeather(this.recordId);
    }
amount;
level; 
    async getWeather(recId){
      
        //get billing zip code
        let zips = await getApps({recordId: this.recordId})
        this.lat = zips[0].Area__r.Program__r.Account__r.BillingLatitude;
        this.long = zips[0].Area__r.Program__r.Account__r.BillingLongitude;
        //fetch api
                let endPoint = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${this.lat}%2C${this.long}?unitGroup=us&elements=datetime%2Cname%2CresolvedAddress%2Clatitude%2Clongitude%2Ctempmax%2Ctempmin%2Ctemp%2Cfeelslikemax%2Cfeelslikemin%2Cfeelslike%2Cdew%2Chumidity%2Cprecip%2Cprecipprob%2Cprecipcover%2Cpreciptype%2Csnow%2Cwindgust%2Cwindspeed%2Cwindspeedmax%2Cwindspeedmin%2Cwinddir%2Cpressure%2Ccloudcover%2Cvisibility%2Cuvindex%2Csevererisk%2Csunrise%2Csunset%2Cconditions%2Cdescription%2Cicon%2Cdegreedays%2Caccdegreedays%2Csoiltemp01%2Csoiltemp04%2Csoilmoisture01%2Csoilmoisture04&key=SC9NP46DF9TQT57GAHLWSDALA&maxStations=3&contentType=json&degreeDayMethod=average&degreeDayTempMaxThreshold=86&degreeDayTempBase=50&degreeDayStartDate=2025-01-01`
                //let endPoint = `https://api.openweathermap.org/data/2.5/weather?lat=${this.lat}&lon=${this.long}&appid=${this.badTwo}&units=imperial`
                //let foreCastEndPoint = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${this.lat}%2C${this.long}?unitGroup=us&key=${this.badAPIExample}&contentType=json`    
                try {
                        const response = await fetch(endPoint);
                        
                        if (!response.ok) {
                          throw new Error(`Response status: ${dayResponse.status}`);
                        }
                    
                        const json = await response.json();
                        console.log(json)                        
                        
                         this.station = json.resolvedAddress; 
                         this.temp = json.currentConditions.temp;
                         this.soilTemp = json.currentConditions.soiltemp01;
                         this.feelLike = json.currentConditions.feelslike;
                        // this.amount = json.snow ? roundNum(json.snow['1h'] * this.convertMMPerHour, 4):
                        //               json.rain ? roundNum(json.rain['1h'] * this.convertMMPerHour,4): '';
                        // this.level = json.snow ? this.calcSnowAmount(json.snow['1h']):
                        //              json.rain ? this.calcRainAmount(json.rain['1h']): ''
                         this.desc =  json.description; 

                         this.cloud = json.currentConditions.cloudcover;
                        //this.tempIcon = this.feelLike <= 32 ?   
                         this.humidity = json.currentConditions.humidity;
                         this.windSpeed = json.currentConditions.windspeed;
                         this.accDDays = json.days[0].accdegreedays


                        if(json.alerts.length>=1){
                          this.warning = true;
                          this.warningText = json.alerts[0].headline;
                          this.warningEnds = Number(json.alerts[0].ends.slice(8,10))
                        }
                        let tenDay = [...json.days.splice(0,10)]
                        this.futureWeather = tenDay.map(item=>{
                          let day = item.datetime.slice(8,11)
                          let warningDay = this.warning && this.warningEnds >= day? true: false;
                          let warningDayText = this.warningText
                          return {...item, day, warningDay, warningDayText}
                        })
                      } catch (error) {
                        console.error(error.message);
                      }
                      
        //assign vars
        //close loading
    }
    calcSnowAmount(level){
     let back = level>=2.5 ? 'Heavy': 
                level>=1 && level < 2.5 ? 'Moderate':
                level < 1 ?'Light': '';
        
                return back;                     
    }
    calcRainAmount(level){
      let back = level>=7.6 ? 'Heavy': 
                 level>=2.6 && level <= 7.5? 'Moderate':
                 level < 2.5 ?'Light': '';
         
                 return back;                     
     }
}