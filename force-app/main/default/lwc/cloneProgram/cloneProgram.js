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

    connectedCallback(){
        this.formSize = this.screenSize(FORM_FACTOR); 
        this.loaded = true; 
    }

    //check screen size to show table on desktop and cards on mobile
    screenSize = (screen) => {
        return screen === 'Large'? true : false
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
    async handleClone2(){
        this.loaded = false; 
        try{
            this.data = await cloneHeaders({recId: this.recordId});
            
            // this.data.forEach((x)=>{
            //     this.mapIds = [...this.mapIds,{
            //                     Prev_App_Id__c: x.Prev_App_Id__c,
            //                     Id: x.Id 
            //         }]                
                
            // })
            console.log(JSON.stringify(this.mapIds))
            let finalStep = await cloneProducts({JSONSTRING: JSON.stringify(this.data)})
            if(finalStep){
                console.log(finalStep)
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