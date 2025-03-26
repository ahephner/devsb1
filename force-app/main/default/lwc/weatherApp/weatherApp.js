import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getWeatherCords from '@salesforce/apex/appWeather.getWeatherInfo';
import getAddress from '@salesforce/apex/appProduct.getAddressInfo';

import {triggerPest} from 'c/programBuilderHelper'

import { updateRecord } from 'lightning/uiRecordApi';
import REC_ID from '@salesforce/schema/Program__c.Id'


import NEWADDRESS from 'c/updateLocation';
import DAY from 'c/weatherDay'; 
const crabPre32 = [
  {min:171,max:250, res:'Crab Preemerge Timing: Early', class:'secondPestEarly', found:true},
  {min:251,max:500, res:'Crab Preemerge Timing: Optimum', class:'secondPestTarget', found:true},
  {min:501,max:801, res:'Crab Preemerge Timing: Late', class:'secondPestLate', found:true}
  //{min:801,max:100000, res:'Crab Preemerge Timing: Past'},
]
const poaAnnuaSeedHeadSuppression32 = [
  {min:121,max:220, res:'Proxy/PGR Timing: Close', class:'firstPestEarly', found:true},
  {min:221,max:501, res:'Proxy/PGR Timing: Target', class:'firstPestTarget', found:true},
  {min:502,max:651, res:'Proxy/PGR Timing: Late', class:'firstPestLate', found:true},
]
const springBroadleaf50 = [
  {min:71,max:110, res:'Broadleaf Timing: Early', class:'firstPestEarly', found:true},
  {min:110,max:151, res:'Broadleaf Timing: Ester', class:'firstPestEarly', found:true},
  {min:152,max:201, res:'Broadleaf Timing: Ester or Amine', class:'firstPestEarly', found:true},
  {min:202,max:601, res:'Broadleaf Timing: Amine', class:'firstPestEarly', found:true},
]
const crabGermination50 = [
  {min:100,max:200, res:'Crabgrass Germination: Early', class:'secondPestEarly', found:true},
  {min:201,max:601, res:'Crabgrass Germination: Prime', class:'secondPestTarget', found:true},
  {min:601,max:1401, res:'Crabgrass Germination: Late', class:'secondPestLate', found:true}
]
// Example :- import TRAILHEAD_LOGO from '@salesforce/resourceUrl/trailhead_logo';'
export default class WeatherApp extends LightningElement {
    @api recordId; 
    lat;
    long;
    zip; 
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
    accountId; 
    btnLabel = 'Use 32 GDD' 
    baseType= false;  
    typeofGDD = '50 Degree Modal'
    loaded=false; 
    connectedCallback(){
        this.firstLoad(this.recordId);
       
    }
amount;
level; 
   async firstLoad(){
      //get billing zip code
      let zips = await getWeatherCords({recordId: this.recordId})
      //future lat = zips[0].Preferred_Lat_Long__c.latitude
      //future long = zips[0].Preferred_Lat_Long__c.longitude
      this.zip = zips[0]?.Preferred_Zip_Code__c ?? ''
      this.lat = zips[0].Preferred_Lat_Long__c ? zips[0].Preferred_Lat_Long__c.latitude:  zips[0].Account__r.BillingLatitude;
      this.long = zips[0].Preferred_Lat_Long__c ? zips[0].Preferred_Lat_Long__c.longitude: zips[0].Account__r.BillingLongitude;
      this.accountId = zips[0].Account__c;

      this.getWeather(this.typeofGDD)
    }
    async getWeather(base){
      
        //fetch api
                let endPointBase50 = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${this.lat}%2C${this.long}?unitGroup=us&elements=datetime%2Cname%2CresolvedAddress%2Clatitude%2Clongitude%2Ctempmax%2Ctempmin%2Ctemp%2Cfeelslikemax%2Cfeelslikemin%2Cfeelslike%2Cdew%2Chumidity%2Cprecip%2Cprecipprob%2Cprecipcover%2Cpreciptype%2Csnow%2Cwindgust%2Cwindspeed%2Cwindspeedmax%2Cwindspeedmin%2Cwinddir%2Cpressure%2Ccloudcover%2Cvisibility%2Cuvindex%2Csevererisk%2Csunrise%2Csunset%2Cconditions%2Cdescription%2Cicon%2Cdegreedays%2Caccdegreedays%2Csoiltemp01%2Csoiltemp04%2Csoilmoisture01%2Csoilmoisture04&key=SC9NP46DF9TQT57GAHLWSDALA&maxStations=3&contentType=json&degreeDayMethod=average&degreeDayTempMaxThreshold=86&degreeDayTempBase=50&degreeDayStartDate=2025-01-01`
                let endPointBase32 = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${this.lat}%2C${this.long}?unitGroup=us&elements=datetime%2Cname%2CresolvedAddress%2Clatitude%2Clongitude%2Ctempmax%2Ctempmin%2Ctemp%2Cfeelslikemax%2Cfeelslikemin%2Cfeelslike%2Cdew%2Chumidity%2Cprecip%2Cprecipprob%2Cprecipcover%2Cpreciptype%2Csnow%2Cwindgust%2Cwindspeed%2Cwindspeedmax%2Cwindspeedmin%2Cwinddir%2Cpressure%2Ccloudcover%2Cvisibility%2Cuvindex%2Csevererisk%2Csunrise%2Csunset%2Cconditions%2Cdescription%2Cicon%2Cdegreedays%2Caccdegreedays%2Csoiltemp01%2Csoiltemp04%2Csoilmoisture01%2Csoilmoisture04&key=SC9NP46DF9TQT57GAHLWSDALA&maxStations=3&contentType=json&degreeDayMethod=average&degreeDayTempMaxThreshold=86&degreeDayTempBase=32&degreeDayStartDate=2025-01-01`
                                //let foreCastEndPoint = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${this.lat}%2C${this.long}?unitGroup=us&key=${this.badAPIExample}&contentType=json`    
                console.log(base)
                let endPoint = base === '50 Degree Modal' ? endPointBase50 : endPointBase32
                console.log(endPoint)      
                try {
                        const response = await fetch(endPoint);
                        
                        if (!response.ok) {
                          throw new Error(`Response status: ${response.status}`);
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
                          this.warningEnds = Date.parse(json.alerts[0].ends)
                          //older way to see
                          //Number(json.alerts[0].ends.slice(8,10))
                        }
                        let tenDay = [...json.days.splice(0,10)]
                        this.futureWeather = tenDay.map((item, index)=>{
                          let id = index
                          let day = Number(item.datetime.slice(8,11))
                          let dayWarning = Date.parse(item.datetime)
                          
                          let warningDay = this.warning && this.warningEnds >= dayWarning? true: false;
                          let warningDayText = this.warningText
                          
                          let poa
                          //let poaInfo = false
                          let poaCSS = 'hide'
                          
                          let broadLeaf 
                          //let broadInfo = false
                          let broadCSS = 'hide'
                          
                          let crabPre
                          //let crabPreInfo = false
                          let crabPreCSS = 'hide'

                          let crabGerm
                          //let crabGerInfo = false
                          let crabGerCSS = 'hide'
                          if(base === '50 Degree Modal'){
                              let crabGetInfo = triggerPest(item.accdegreedays,crabGermination50 )
                              crabGerm = crabGetInfo.text
                              crabGerCSS = crabGetInfo.css

                              let broadGetInfo = triggerPest(item.accdegreedays,springBroadleaf50 )
                              broadLeaf = broadGetInfo.text
                              broadCSS = broadGetInfo.css
                          }else{
                            let crabGetInfo = triggerPest(item.accdegreedays,crabPre32 )
                            crabPre = crabGetInfo.text
                            crabPreCSS = crabGetInfo.css
                            
                            let poaGetInfo = triggerPest(item.accdegreedays,poaAnnuaSeedHeadSuppression32 )
                            poa = poaGetInfo.text;
                            poaCSS = poaGetInfo.css 

                          }
                          return {...item, 
                                  id,
                                  day, 
                                  warningDay, 
                                  warningDayText, 
                                  crabPre,
                                  crabPreCSS, 
                                  //crabPreInfo,
                                  broadLeaf,
                                  broadCSS,
                                  //broadInfo, 
                                  crabGerm,
                                  crabGerCSS,
                                  //crabGerInfo,
                                  poa, 
                                  poaCSS,
                                  //poaInfo
                                }
                        })
                      } catch (error) {
                        console.error(error.message);
                      }
                      this.loaded = true; 
        //assign vars
        //close loading
    }
    changeBase(evt){
      evt.preventDefault();
      if(!this.baseType){
        this.baseType = true;
        this.btnLabel = 'Use 50 GDD'
        this.typeofGDD = '32 Degree Modal'
      }else{
        this.baseType = false;
        this.btnLabel = 'Use 32 GDD'
        this.typeofGDD = '50 Degree Modal'
      }
      this.loaded = false; 
      this.getWeather(this.typeofGDD)
    }

//Open day data
    async openDay(event){
      let dayData = this.futureWeather.find(x=> x.id === Number(event.target.dataset.id))
      console.log(dayData);
      const result = await DAY.open({
        size: 'large',
        dayInfo: dayData,
        lattitude: this.lat,
        longitude: this.long,
        key: this.badAPIExample
      }).then((x)=>{
        console.log(x)
      })
      
    }
    async updateLocation(){
      let newAdd = await NEWADDRESS.open({
        size:'small',
        initLatitude: this.lat,
        initLongitude: this.long,
        initZipCode: this.zip
      }).then((x)=>{
        if(x === undefined){
          return;
        }else if(x.updateHow === 'cords'){
          this.zip = x.zipCode;
          this.lat = x.lattitude;
          this.long = x.longitude; 
          this.updateZipLatLong();
        }else{
          this.getApexLocation(x.address)
        }

      }).catch((error)=>{
        let err =  JSON.stringify(error);
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: err,
            variant: "error",
          }),
        );
      })
    }

   async getApexLocation(x){
          let raw = await getAddress({streetAddress: x})
          console.log(raw)
          this.lat = raw.data.position.lat
          this.long = raw.data.position.lng;
          this.updateZipLatLong(); 
   }
   async updateZipLatLong(){
      const fields = {};
      fields[REC_ID.fieldApiName] = this.recordId
      fields['Preferred_Lat_Long__Longitude__s'] = this.long
      fields['Preferred_Lat_Long__Latitude__s'] = this.lat
     
      const recordInput = {fields}
      updateRecord(recordInput)
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Address updated",
            variant: "success",
          }),
        );
        this.getWeather(this.typeofGDD)
       
      }).catch((error)=>{
        let err =  JSON.stringify(error);
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: err,
            variant: "error",
          }),
        );
      })
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