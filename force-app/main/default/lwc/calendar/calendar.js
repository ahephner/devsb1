import { LightningElement, wire, api } from 'lwc';

import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import FULLCALENDAR from '@salesforce/resourceUrl/fullCal';
/**
 * When using this component in an LWR site, please import the below custom implementation of 'loadScript' module
 * instead of the one from 'lightning/platformResourceLoader'
 *
 * import { loadScript } from 'c/resourceLoader';
 *
 * This workaround is implemented to get around a limitation of the Lightning Locker library in LWR sites.
 * Read more about it in the "Lightning Locker Limitations" section of the documentation
 * https://developer.salesforce.com/docs/atlas.en-us.exp_cloud_lwr.meta/exp_cloud_lwr/template_limitations.htm
 * Demo
 * https://github.com/trailheadapps/lwc-recipes/blob/at/fullcalendarv6/force-app/main/default/lwc/libsFullCalendar/libsFullCalendar.js
 */
export default class Calendar extends LightningElement{
   @api recordId; 
   @api applications; 
   appList
    calendarJSInitialized = false; 
    error; 
    appName; 
    refreshDate; 

    //  @wire(getApps, {recordId: '$recordId'})
    //         wiredList(result){
    //             //console.log('app table recordID', this.recordId)   
    //             this.wiredAppList = result; 
    //             if(result.data){
    //                 console.log(result.data)
    //                 this.appList = result.data.map(item=>{
    //                     //let madeOrder = item.Converted__c ? 'slds-icon-custom-custom5 slds-text-color_default': 'slds-text-color_default';
    //                     return{...item, 
    //                         'title': item.Name,
    //                         'date': item.Date__c
    //                     }
    //                 }); 
                    
    //             }else if(result.error){
    //                 this.error = result.error 
    //                 this.appList = undefined; 
    //             }
    
    //         }
    async renderedCallback() {
        if (this.calendarJSInitialized) {
            return;
        }
        this.calendarJSInitialized = true;
        
        //console.log('apps ', this.applications) 
        try {
            await Promise.all([
                loadScript(
                    this,
                    FULLCALENDAR + '/core/fullcalendar_v6.modified.js'
                ),
                loadStyle(this, FULLCALENDAR + '/core/main.min.css'),
               
            ]).then(()=>{
                    
                    this.startCalendar();
                })
            
        } catch (error) {
            this.error = error;
            console.error(this.error)
        }
    }
    @api
    refreshCalendar(){
        console.log('refresh');
        this.startCalendar()
    }
    selected; 
    startCalendar(){
        const calendarEl = this.template.querySelector('.calendar');
        // eslint-disable-next-line no-undef
        if (typeof FullCalendar === 'undefined') {
            throw new Error(
                'Could not load FullCalendar. Make sure that Lightning Web Security is enabled for your org. See link below.'
            );
        }
        // eslint-disable-next-line no-undef
        const calendar = new FullCalendar.Calendar(calendarEl, {
            customButtons:{
                filterWeather:{
                    text:'Toggle Weather',
                    click: (info)=>{
                        this.passBack('', '', 'hideWeather')
                    }
                }
            },
            headerToolbar: {
                left: 'prev,next today filterWeather',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            //initialDate: this.refreshDate ? this.refreshDate : '2026-01-01',
            editable: true,
            aspectRatio: .5,
            contentHeight: 500,
            events: this.applications,
            eventClick: (info) => {
                //console.log(info.event._def)
                this.passBack('', info.event._def.publicId, info.event.extendedProps.description); 
            },
            eventDrop: (data) => {
                // console.log(data.event.start.toISOString().substring(0,10))
                this.appName = data.event.title;
                let date = data.event.start.toISOString().substring(0,10)
                let id = data.event.id
                
                this.passBack(date,id, 'changeDate' )
            },
            datesSet: function(dateInfo) {
                //var currentMonth = dateInfo.start.getMonth() + 1;
                this.refreshDate = calendar.getDate().toISOString()//.splice(0,10);
                
                //console.log("New view range:",  this.refreshDate);

            }

        });
        calendar.render();
    }

    passBack(inputOne, Id, type){
        switch(type){
            case 'changeDate':
                let back = {
                    Id: Id,
                    Date__c: inputOne, 
                    name: this.appName
                }
                this.dispatchEvent(new CustomEvent('updatedate', {
                    detail: back
                }));
                break;
            case 'application':
                let appId = Id; 
                this.dispatchEvent(new CustomEvent('seeapp',{
                    detail: appId
                }));
                break;
            case 'weather':
                this.dispatchEvent(new CustomEvent('weatherday',{
                    detail: Id
                }));
                break;
            case 'hideWeather':
                this.dispatchEvent(new CustomEvent('toggle',{
                    detail: 'weather'
                }));
            default:
                console.warn('missing value')
        }


    }
}