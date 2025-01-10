import { LightningElement, api } from 'lwc';
import getApps from '@salesforce/apex/appProduct.getApps';
import {roundNum} from 'c/helper'
export default class WeatherApp extends LightningElement {
    @api recordId; 
    lat;
    long; 
    station;
    currentMax;
    currentLow;
    feelLike;
    desc; 
    clouds;
    humidity;
    windSpeed;
    tempIcon; 
    badAPIExample = 'd12a8c53d866c8387d347b0fc6ff2b64';
    convertMMPerHour = 0.03937713512277;
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
                let endPoint = `https://api.openweathermap.org/data/2.5/weather?lat=${this.lat}&lon=${this.long}&appid=${this.badAPIExample}&units=imperial`
                    try {
                        const response = await fetch(endPoint);
                        if (!response.ok) {
                          throw new Error(`Response status: ${response.status}`);
                        }
                    
                        const json = await response.json();
                        console.log(json);
                        this.station = json.name; 
                        this.currentMax = json.main.temp_max;
                        this.currentLow = json.main.temp_min;
                        this.feelLike = json.main.feels_like;
                        this.amount = json.snow ? roundNum(json.snow['1h'] * this.convertMMPerHour, 4):
                                      json.rain ? roundNum(json.rain['1h'] * this.convertMMPerHour,4): '';
                        this.level = json.snow ? this.calcSnowAmount(json.snow['1h']):
                                     json.rain ? this.calcRainAmount(json.rain['1h']): ''
                        this.desc =  json.snow || json.rain ?`${this.level} ${json.weather[0].description} ${this.amount}" per hour`: json.weather[0].description; 

                        this.cloud = json.clouds.all;
                        //this.tempIcon = this.feelLike <= 32 ?   
                        this.humidity = json.main.humidity;
                        this.windSpeed = json.wind.speed; 
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