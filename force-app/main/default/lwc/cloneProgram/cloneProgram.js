import { LightningElement, api, track } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { NavigationMixin } from 'lightning/navigation';
import cloneHeaders from '@salesforce/apex/cpqProgramClone.cpqProgramCloneStep1';
import cloneProducts from '@salesforce/apex/cpqProgramClone.cloneProducts';
import FORM_FACTOR from '@salesforce/client/formFactor';
export default class CloneProgram extends LightningElement {
    @api recordId
    loaded = false; 
    formSize; 
    data = [];
    msg; 
    sliderValue;

    connectedCallback(){
        this.formSize = this.screenSize(FORM_FACTOR); 
        this.loaded = true; 
    }

    //check screen size to show table on desktop and cards on mobile
    screenSize = (screen) => {
        return screen === 'Large'? true : false
    }

   closeScreen(){
    this.dispatchEvent(new CloseActionScreenEvent()); 
   }
    handleClone(){
        this.loaded = false; 
        cloneHeaders({recId: this.recordId})
            .then((res)=>{
                this.data = res; 
                console.log(this.data)
            }).then(()=>{
                let mapId = new Map();
                this.data.forEach((x)=>{
                    mapId.set(x.Prev_App_Id__c, x.Id);
                });
                console.log(mapId)
                this.loaded = true; 

            })
    }
    @track mapIds = [];
    newURL; 
    async handleClone2(){
        this.loaded = false; 
        this.msg = 'Gathering'
        this.sliderValue = 10;
        try{
           this.sliderValue = 35;
            this.msg = 'Inserting Program, Area and Apps'
            this.data = await cloneHeaders({recId: this.recordId});
            //this.newURL = this.data[0].Program_ID__c

            this.sliderValue = 75; 
            this.msg = 'Cloning App Products'
          
            let finalStep = await cloneProducts({JSONSTRING: JSON.stringify(this.data)})
            this.sliderValue = 95; 
            this.msg = 'Finishing up. Redirecting Soon'; 
            if(finalStep){
                //console.log(this.newURL)
                this.loaded = true; 
            }
        }catch(err){
            alert(JSON.stringify(err))
        }

    }
}


// @track mapIds = {key:[]};
// async handleClone2(){
//     this.loaded = false; 
//     try{
//         this.data = await cloneHeaders({recId: this.recordId});
        
//         this.data.forEach((x)=>{
//             this.mapIds = 
//                 {...this.mapIds,
//                     prevId: x.Prev_App_Id__c,
//                     newId: x.Prev_App_Id__c
//                 }                
            
//         })