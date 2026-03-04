import { LightningElement, api, wire } from 'lwc';
import getApps from '@salesforce/apex/appProduct.getAppForCalendar';
import getHolidays from '@salesforce/apex/calendarInfo.getHolidays';
import getWeatherCords from '@salesforce/apex/appWeather.getWeatherInfo';
import getAddress from '@salesforce/apex/appProduct.getAddressInfo';
import { updateRecord} from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//fields to update
import APP_ID from '@salesforce/schema/Application__c.Id';
import APP_DATE from '@salesforce/schema/Application__c.Date__c'; 
import REC_ID from '@salesforce/schema/Program__c.Id'
//helper
import DAY from 'c/weatherDay'; 
import NEWADDRESS from 'c/updateLocation';
//message
import { APPLICATION_SCOPE,MessageContext,publish,subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
export default class CalendarContainer extends LightningElement{
    applications;
    applicationsSet = false;
    appId;  
    zip;
    lat;
    long;
    accountId; 
    cleanWeather; 
    weather
    @api recordId;
    
    badAPIExample = 'SC9NP46DF9TQT57GAHLWSDALA'
    
    subscription= null;
    connectedCallback(){
        this.subscribeToMessage();
        this.start(); 
    }
    //subscribe for refresh
    @wire(MessageContext)
    messageContext;
        subscribeToMessage(){
            if(!this.subscription){
                this.subscription = subscribe(
                    this.messageContext,
                    Program_Builder,
                    (message)=> this.handleUpdate(message),
                    {scope:APPLICATION_SCOPE})
            }
        } 
        disconnectedCallback(){
            this.unsubscribeFromMessageChannel(); 
        }
        unsubscribeFromMessageChannel(){
            unsubscribe(this.subscritption);
            this.subscritption = null; 
    }
    //getUpdate
    //call a timeout to let the database insert multiple apps
    //then retrieve the new values
    handleUpdate(mess){ 
        window.clearTimeout(this.delay);
        if(mess.updateTable === true){
            this.delay = setTimeout(()=>{
                this.applicationsSet = false; 
                let x =  this.start()
            },2000) 
        }else{
            //this.loaded= true;
        }
    }
    async start(){
        let apps = await getApps({recId: this.recordId})
        let holidays = await getHolidays();
        let accWeatherInfo = await getWeatherCords({recordId: this.recordId}) 
        this.weather = await this.getWeather(accWeatherInfo)
        
        this.cleanWeather = this.cleanData(this.weather, 'weather')
        let cleanHolidays = this.cleanData(holidays, 'holiday')
        let cleanApps = apps.length > 0 ? this.cleanData(apps, 'applications'): [];
        this.applications = [...cleanHolidays, ...cleanApps, ...this.cleanWeather]
        this.applicationsSet = this.applications.length>0 ? true:false;
    }

    cleanData(arr, type){
        //!change the description on applications and the update does not run!!!!!!!!!!!!!!!
        let backData = []
        if(type==='applications'){
            for(let i = 0; i<arr.length; i ++){
                if(arr[i].Type__c === 'Application'){
                let single= {
                    id: arr[i].Id,
                    title: arr[i].Name,
                    date: arr[i].Date__c,
                    backgroundColor:'#1a5532',
                    textColor: '#F8F8FF',  
                     description: 'application'
                } 
                backData.push(single)
                }else if(arr[i].Type__c === 'Cultural Practice'){
                let single= {
                    id: arr[i].Id,
                    title: arr[i].Name,
                    date: arr[i].Date__c,
                    backgroundColor: '#ffb600',
                    description: 'cultural'
                } 
                backData.push(single)
                }else{
               let single= {
                    id: arr[i].Id,
                    title: arr[i].Name,
                    date: arr[i].Date__c,
                    backgroundColor: '#CC0000', 
                    description: 'event'
                }
                backData.push(single)
                }

            }

        }else if(type==='holiday'){
            for(let i = 0; i<arr.length; i ++){
                
                let single= {
                     id: arr[i].Id,
                     title: arr[i].Name,
   
                     date: arr[i].ActivityDate,
                     editable: false,
                     backgroundColor: 'rgb(11, 128, 67)',
                     description: 'holiday'
                 }
                 //console.log('single ', single)
                 backData.push(single)
             }
        }else if(type==='weather'){
            for(let i = 0; i<arr.length; i ++){
                console.log(arr[i])
                let single= {
                     id: arr[i].datetime,
                     title:`H ${arr[i].tempmax} L ${arr[i].tempmin} precip ${arr[i].precipprob}% hum ${arr[i].humidity}` ,
   
                     date: arr[i].datetime,
                     editable: false,
                     backgroundColor: '#F0F8FF',
                     textColor: 'black', 
                     description: 'weather',
                     overlap:true
                 }
                 //console.log('single ', single)
                 backData.push(single)
             }
        }
        
        let final = JSON.parse(JSON.stringify(backData));
        
        return final; 
    }

    handleUpdateDate(x){
                //update record
                const fields = {};
                fields[APP_ID.fieldApiName] = x.detail.Id;
                fields[APP_DATE.fieldApiName] = x.detail.Date__c;
                const addCount = {fields}
                updateRecord(addCount)
                    .then(()=>{
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: `Updated Date`, 
                                message:`Moved ${x.detail.name}  Date to ${x.detail.Date__c}`,
                                variant: 'success'
                            })
                        )
                    }).catch((error)=>{
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'error',
                                message:error,
                                variant:'error'
                            })
                        )
                    })
    }
    async handleNewEvent(){
    console.log('button')    
    }
 //call message Channel
    showApp(x){

        const payload = {
            updateProdTable: true,
            addProd: false,
            updateProd: true,
            appId: x.detail,
            areaArray: []
        }
        publish(this.messageContext, Program_Builder, payload);
    }
async showDayWeather(event){
        let dayData = this.weather.find(x=> x.datetime === event.detail)

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
    backUp
    handleToggle(x){
        switch(x.detail){
            case 'weather':
                this.backUp = this.applications
                let noWeather = this.applications.filter(x=> x.description != 'weather')
                this.applications = [...noWeather]
                this.template.querySelector("c-calendar").refreshCalendar();
            break;
            default:
                console.warn('nothing found .....')

        }
    }
    async getWeather(input){
        let zip = input[0]?.Preferred_Zip_Code__c ?? ''
        let lat = input[0].Preferred_Lat_Long__c ? input[0].Preferred_Lat_Long__c.latitude:  input[0].Account__r.BillingLatitude;
        let long = input[0].Preferred_Lat_Long__c ? input[0].Preferred_Lat_Long__c.longitude: input[0].Account__r.BillingLongitude;
        let accountId = input[0].Account__c;
        let endPointBase50 = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat}%2C${long}?unitGroup=us&elements=datetime%2Cname%2CresolvedAddress%2Clatitude%2Clongitude%2Ctempmax%2Ctempmin%2Ctemp%2Cfeelslikemax%2Cfeelslikemin%2Cfeelslike%2Cdew%2Chumidity%2Cprecip%2Cprecipprob%2Cprecipcover%2Cpreciptype%2Csnow%2Cwindgust%2Cwindspeed%2Cwindspeedmax%2Cwindspeedmin%2Cwinddir%2Cpressure%2Ccloudcover%2Cvisibility%2Cuvindex%2Csevererisk%2Csunrise%2Csunset%2Cconditions%2Cdescription%2Cicon%2Cdegreedays%2Caccdegreedays%2Csoiltemp01%2Csoiltemp04%2Csoilmoisture01%2Csoilmoisture04&key=SC9NP46DF9TQT57GAHLWSDALA&maxStations=3&contentType=json&degreeDayMethod=average&degreeDayTempMaxThreshold=86&degreeDayTempBase=50&degreeDayStartDate=2026-01-01`
        let forecast;
        //call api
        try{
         
          const response = await fetch(endPointBase50);
          
          if(response.ok){
                
                const json = await response.json();
                
                forecast = [...json.days.splice(0,10)]
                return forecast; 
            }
        }catch(error){
          console.error(error)
        }
    }

   async newLocation(){
            let newAdd = await NEWADDRESS.open({
                size:'small',
                initLatitude: this.lat,
                initLongitude: this.long,
                initZipCode: this.zip
            }).then((x)=>{
                if(x === undefined){
                return;
                }else if(x.updateHow === 'cords'){
                    console.log(x.updateHow)
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
     console.log(fields)
      const recordInput = {fields}
      const x = await updateRecord(recordInput)
      console.log(11, x)
      if(x){
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Address updated",
            variant: "success",
          }),
        );
        this.getWeather(this.typeofGDD)
      }else{
            this.dispatchEvent(
                new ShowToastEvent({
                title: "Error",
                message: 'Did not update address',
             variant: "error",
          }),
        );
      }
    }
}