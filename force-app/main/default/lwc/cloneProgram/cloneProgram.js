import { LightningElement, api, track } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { NavigationMixin } from 'lightning/navigation';
import cloneHeaders from '@salesforce/apex/cpqProgramClone.cpqProgramCloneStep1';
import cloneProducts from '@salesforce/apex/cpqProgramClone.cloneProducts';
import FORM_FACTOR from '@salesforce/client/formFactor';
export default class CloneProgram extends NavigationMixin(LightningElement) {
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
            //set values that came back in a wrapper
            this.newURL = this.data.programId;
            let apps = [...this.data.backApps]; 
            this.sliderValue = 75; 
            this.msg = 'Cloning App Products'
          
            let finalStep = await cloneProducts({JSONSTRING: JSON.stringify(apps)})
            this.sliderValue = 95; 
            this.msg = 'Finishing up. Redirecting Soon'; 
            if(finalStep === 'success'){
                this.closeScreen(); 
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.newURL,
                        objectApiName: 'Opportunity',
                        actionName: 'view'
                    }
                });
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